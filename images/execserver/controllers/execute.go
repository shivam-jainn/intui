package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gofiber/fiber/v2"
)

type storageMode string

const (
	modeLocal storageMode = "local"
	modeGCS   storageMode = "gcs"
)

func getStorageMode() storageMode {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("EXECUTOR_STORAGE_MODE")))
	if mode == string(modeGCS) {
		return modeGCS
	}
	return modeLocal
}

func getExecutionTimeout() time.Duration {
	raw := strings.TrimSpace(os.Getenv("EXECUTOR_TIMEOUT_SECONDS"))
	if raw == "" {
		return 10 * time.Second
	}
	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds <= 0 {
		return 10 * time.Second
	}
	return time.Duration(seconds) * time.Second
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}

func findLocalArtifact(root, question, filename string) (string, error) {
	paths := []string{
		filepath.Join(root, question, filename),
		filepath.Join(root, question, "tests", filename),
	}

	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}

	return "", fmt.Errorf("artifact not found: %s", filename)
}

func normalizeTestsFromJSON(srcJSON, destTxt string) error {
	type tc struct {
		Input    string      `json:"input"`
		Expected interface{} `json:"expected"`
	}

	raw, err := os.ReadFile(srcJSON)
	if err != nil {
		return err
	}

	var asStrings []string
	if err := json.Unmarshal(raw, &asStrings); err == nil {
		return os.WriteFile(destTxt, []byte(strings.Join(asStrings, "\n")+"\n"), 0644)
	}

	var asObjects []tc
	if err := json.Unmarshal(raw, &asObjects); err == nil {
		lines := make([]string, 0, len(asObjects))
		for _, row := range asObjects {
			expected := fmt.Sprint(row.Expected)
			line := strings.TrimSpace(strings.TrimSpace(row.Input) + " " + expected)
			lines = append(lines, line)
		}
		return os.WriteFile(destTxt, []byte(strings.Join(lines, "\n")+"\n"), 0644)
	}

	return fmt.Errorf("unsupported JSON test case format")
}

func fetchFromLocal(questionName, sourcePath, destPath string) error {
	root := strings.TrimSpace(os.Getenv("EXECUTOR_LOCAL_ROOT"))
	if root == "" {
		root = "/workspace/question-pipeline/output"
	}

	src, err := findLocalArtifact(root, questionName, sourcePath)
	if err == nil {
		return copyFile(src, destPath)
	}

	if strings.HasSuffix(sourcePath, "testcases.txt") {
		jsonPath, jsonErr := findLocalArtifact(root, questionName, "run.json")
		if jsonErr == nil {
			return normalizeTestsFromJSON(jsonPath, destPath)
		}
	}

	if strings.HasSuffix(sourcePath, "testcases_submission.txt") {
		jsonPath, jsonErr := findLocalArtifact(root, questionName, "submission.json")
		if jsonErr == nil {
			return normalizeTestsFromJSON(jsonPath, destPath)
		}
	}

	return fmt.Errorf("local artifact missing for %s", sourcePath)
}

func ExecuteCode(c *fiber.Ctx) error {
	log.Println("Starting code execution request")

	var request struct {
		QuestionName string `json:"questionName"`
		UserCode     string `json:"userCode"`
		Language     string `json:"language"`
		IsSubmission bool   `json:"isSubmission"`
	}

	if err := c.BodyParser(&request); err != nil {
		log.Println("Body parse error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	decodedQuestionName, err := url.QueryUnescape(request.QuestionName)
	if err != nil {
		log.Println("Question name decode error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid question name encoding"})
	}

	tmpDir, err := os.MkdirTemp("", "code-execution-*")
	if err != nil {
		log.Println("Temp dir error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Temp directory creation failed"})
	}
	defer os.RemoveAll(tmpDir)
	log.Println("Created temp dir:", tmpDir)

	mode := getStorageMode()
	bucketName := strings.TrimSpace(os.Getenv("GCS_BUCKET"))
	var client *storage.Client
	ctx := context.Background()
	if mode == modeGCS {
		if bucketName == "" {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "GCS_BUCKET is required when EXECUTOR_STORAGE_MODE=gcs"})
		}

		client, err = storage.NewClient(ctx)
		if err != nil {
			log.Println("GCS client error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "GCS connection failed"})
		}
		defer client.Close()
	}

	basePath := decodedQuestionName
	testCasesFile := "testcases.txt"
	if request.IsSubmission {
		testCasesFile = "testcases_submission.txt"
	}

	testCasesPath := filepath.Join(tmpDir, testCasesFile)
	log.Println("Fetching test cases:", testCasesFile, "mode:", mode)
	if err := fetchArtifact(mode, ctx, client, bucketName, basePath, testCasesFile, testCasesPath); err != nil {
		log.Println("Test cases fetch error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get test cases"})
	}

	var cmd *exec.Cmd
	switch request.Language {
	case "python":
		log.Println("Processing Python code")
		driverPath := filepath.Join(tmpDir, "driver.py")
		if err := fetchArtifact(mode, ctx, client, bucketName, basePath, "drivers/python/driver.py", driverPath); err != nil {
			log.Println("Python driver error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Python driver missing"})
		}

		driverCode, _ := os.ReadFile(driverPath)
		tmpFile := filepath.Join(tmpDir, "temp.py")
		os.WriteFile(tmpFile, []byte(request.UserCode+"\n"+string(driverCode)), 0644)
		cmd = exec.Command("python3", tmpFile, testCasesPath)
		cmd.Dir = tmpDir

	case "cpp":
		log.Println("Processing C++ code")
		driverPath := filepath.Join(tmpDir, "driver.cpp")
		if err := fetchArtifact(mode, ctx, client, bucketName, basePath, "drivers/cpp/driver.cpp", driverPath); err != nil {
			log.Println("C++ driver error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "C++ driver missing"})
		}

		driverCode, _ := os.ReadFile(driverPath)
		tmpFile := filepath.Join(tmpDir, "temp.cpp")
		outputFile := filepath.Join(tmpDir, "temp.out")
		os.WriteFile(tmpFile, append(driverCode, []byte(request.UserCode)...), 0644)

		compileCmd := exec.Command("g++", tmpFile, "-o", outputFile)
		var compileErr bytes.Buffer
		compileCmd.Stderr = &compileErr
		compileCmd.Dir = tmpDir
		log.Println("Compiling:", compileCmd.String())

		if err := compileCmd.Run(); err != nil {
			log.Println("Compilation failed:", compileErr.String())
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Compilation failed: " + compileErr.String(),
			})
		}

		if err := os.Chmod(outputFile, 0755); err != nil {
			log.Println("Permission error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to set executable permissions",
			})
		}

		cmd = exec.Command(outputFile, testCasesPath)
		cmd.Dir = tmpDir

	default:
		log.Println("Unsupported language:", request.Language)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Unsupported language"})
	}

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	cmd.Env = os.Environ()

	timeout := time.After(getExecutionTimeout())
	done := make(chan error)
	go func() { done <- cmd.Run() }()

	select {
	case err := <-done:
		log.Println("Execution completed with status:", err)
	case <-timeout:
		log.Println("Execution timed out")
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return c.Status(fiber.StatusRequestTimeout).JSON(fiber.Map{
			"error": "Execution timed out",
		})
	}

	outputStr := strings.TrimSpace(out.String())
	log.Println("Raw output:", outputStr)
	log.Println("Raw stderr:", stderr.String())

	var parsedOutput []map[string]interface{}
	if err := json.Unmarshal([]byte(outputStr), &parsedOutput); err != nil {
		log.Println("JSON parse error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":  "Failed to parse output",
			"raw":    outputStr,
			"stderr": stderr.String(),
		})
	}

	return c.JSON(fiber.Map{
		"questionName": request.QuestionName,
		"results":      parsedOutput,
		"error":        stderr.String(),
	})
}

func fetchArtifact(mode storageMode, ctx context.Context, client *storage.Client, bucketName, basePath, sourcePath, destPath string) error {
	if mode == modeLocal {
		return fetchFromLocal(basePath, sourcePath, destPath)
	}

	candidates := []string{
		filepath.Join(basePath, sourcePath),
		filepath.Join("questions", basePath, sourcePath),
	}

	for _, objectPath := range candidates {
		if err := fetchFromGCS(ctx, client, bucketName, objectPath, destPath); err == nil {
			return nil
		}
	}

	if strings.HasSuffix(sourcePath, "testcases.txt") {
		for _, objectPath := range []string{
			filepath.Join(basePath, "tests", "run.json"),
			filepath.Join("questions", basePath, "tests", "run.json"),
		} {
			if err := fetchJSONTestsFromGCS(ctx, client, bucketName, objectPath, destPath); err == nil {
				return nil
			}
		}
	}

	if strings.HasSuffix(sourcePath, "testcases_submission.txt") {
		for _, objectPath := range []string{
			filepath.Join(basePath, "tests", "submission.json"),
			filepath.Join("questions", basePath, "tests", "submission.json"),
		} {
			if err := fetchJSONTestsFromGCS(ctx, client, bucketName, objectPath, destPath); err == nil {
				return nil
			}
		}
	}

	return fmt.Errorf("artifact not found: %s", sourcePath)
}

func fetchFromGCS(ctx context.Context, client *storage.Client, bucketName, objectPath, destPath string) error {
	log.Printf("Downloading gs://%s/%s to %s", bucketName, objectPath, destPath)
	reader, err := client.Bucket(bucketName).Object(objectPath).NewReader(ctx)
	if err != nil {
		return err
	}
	defer reader.Close()

	data, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	return os.WriteFile(destPath, data, 0644)
}

func fetchJSONTestsFromGCS(ctx context.Context, client *storage.Client, bucketName, objectPath, destPath string) error {
	reader, err := client.Bucket(bucketName).Object(objectPath).NewReader(ctx)
	if err != nil {
		return err
	}
	defer reader.Close()

	data, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	var asStrings []string
	if err := json.Unmarshal(data, &asStrings); err == nil {
		return os.WriteFile(destPath, []byte(strings.Join(asStrings, "\n")+"\n"), 0644)
	}

	type tc struct {
		Input    string      `json:"input"`
		Expected interface{} `json:"expected"`
	}
	var asObjects []tc
	if err := json.Unmarshal(data, &asObjects); err == nil {
		lines := make([]string, 0, len(asObjects))
		for _, row := range asObjects {
			expected := fmt.Sprint(row.Expected)
			line := strings.TrimSpace(strings.TrimSpace(row.Input) + " " + expected)
			lines = append(lines, line)
		}
		return os.WriteFile(destPath, []byte(strings.Join(lines, "\n")+"\n"), 0644)
	}

	return fmt.Errorf("unsupported JSON test case format")
}
