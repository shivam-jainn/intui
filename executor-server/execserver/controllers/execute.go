package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gofiber/fiber/v2"
)

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

	ctx := context.Background()

	bucketName := os.Getenv("GCS_BUCKET")
	basePath := filepath.Join("questions", decodedQuestionName)
	testCasesFile := "testcases.txt"
	if request.IsSubmission {
		testCasesFile = "testcases_submission.txt"
	}

	testCasesPath := filepath.Join(tmpDir, testCasesFile)
	log.Println("Fetching test cases:", testCasesFile)
	if err := fetchData(ctx, bucketName, filepath.Join(basePath, testCasesFile), testCasesPath); err != nil {
		log.Println("Test cases fetch error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get test cases"})
	}

	var cmd *exec.Cmd
	switch request.Language {
	case "python":
		log.Println("Processing Python code")
		driverPath := filepath.Join(tmpDir, "driver.py")
		if err := fetchData(ctx, bucketName, filepath.Join(basePath, "drivers/python/driver.py"), driverPath); err != nil {
			log.Println("Python driver error:", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Python driver missing"})
		}

		signaturePath := filepath.Join(tmpDir, "signature.py")
		if err := fetchData(ctx, bucketName, filepath.Join(basePath, "drivers/python/signature.py"), signaturePath); err != nil {
			log.Println("Python signature error (optional):", err)
		}

		driverCode, _ := os.ReadFile(driverPath)
		tmpFile := filepath.Join(tmpDir, "temp.py")
		os.WriteFile(tmpFile, []byte(request.UserCode+"\n"+string(driverCode)), 0644)
		args := []string{tmpFile, testCasesPath}
		if request.IsSubmission {
			args = append(args, "submission")
		} else {
			args = append(args, "run")
		}
		cmd = exec.Command("python3", args...)
		cmd.Dir = tmpDir

	case "cpp":
		log.Println("Processing C++ code")
		driverPath := filepath.Join(tmpDir, "driver.cpp")
		if err := fetchData(ctx, bucketName, filepath.Join(basePath, "drivers/cpp/driver.cpp"), driverPath); err != nil {
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
		if request.IsSubmission {
			cmd.Args = append(cmd.Args, "submission")
		} else {
			cmd.Args = append(cmd.Args, "run")
		}
		cmd.Dir = tmpDir

	default:
		log.Println("Unsupported language:", request.Language)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Unsupported language"})
	}

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	cmd.Env = os.Environ()

	timeout := time.After(10 * time.Second)
	done := make(chan error)
	go func() { done <- cmd.Run() }()

	var status string = "Accepted"
	select {
	case err := <-done:
		log.Println("Execution completed with status:", err)
		if err != nil {
			status = "Runtime Error"
		}
	case <-timeout:
		log.Println("Execution timed out")
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return c.JSON(fiber.Map{
			"questionName": request.QuestionName,
			"results":      []interface{}{},
			"status":       "Time Limit Exceeded",
			"error":        "Execution timed out",
		})
	}

	outputStr := strings.TrimSpace(out.String())
	log.Println("Raw output:", outputStr)
	log.Println("Raw stderr:", stderr.String())

	if outputStr == "" && stderr.String() != "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":  "Execution failed",
			"stderr": stderr.String(),
		})
	}

	var parsedOutput []map[string]interface{}
	if err := json.Unmarshal([]byte(outputStr), &parsedOutput); err != nil {
		log.Println("JSON parse error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":  "Failed to parse output",
			"status": "Runtime Error",
			"raw":    outputStr,
			"stderr": stderr.String(),
		})
	}

	// Check if all test cases passed
	allPassed := true
	for _, res := range parsedOutput {
		if val, ok := res["result"].(bool); !ok || !val {
			allPassed = false
			break
		}
	}

	if status == "Accepted" && !allPassed {
		status = "Wrong Answer"
	}

	return c.JSON(fiber.Map{
		"questionName": request.QuestionName,
		"results":      parsedOutput,
		"status":       status,
		"error":        stderr.String(),
	})
}

func fetchData(ctx context.Context, bucketName, objectPath, destPath string) error {
	if os.Getenv("APP_ENV") == "development" {
		fsDataPath := os.Getenv("FS_DATA_PATH")
		if fsDataPath == "" {
			fsDataPath = "/data" // Default for docker if not provided
		}
		fullSrcPath := filepath.Join(fsDataPath, objectPath)
		log.Printf("Copying local file %s to %s", fullSrcPath, destPath)

		input, err := os.ReadFile(fullSrcPath)
		if err != nil {
			return err
		}
		return os.WriteFile(destPath, input, 0644)
	}

	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	return fetchFromGCS(ctx, client, bucketName, objectPath, destPath)
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
