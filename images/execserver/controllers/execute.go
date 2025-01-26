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
	client, err := storage.NewClient(ctx)
	if err != nil {
		log.Println("GCS client error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "GCS connection failed"})
	}
	defer client.Close()

	bucketName := os.Getenv("GCS_BUCKET")
	basePath := decodedQuestionName
	testCasesFile := "testcases.txt"
	if request.IsSubmission {
		testCasesFile = "testcases_submission.txt"
	}

	testCasesPath := filepath.Join(tmpDir, testCasesFile)
	log.Println("Fetching test cases:", testCasesFile)
	if err := fetchFromGCS(ctx, client, bucketName, filepath.Join(basePath, testCasesFile), testCasesPath); err != nil {
		log.Println("Test cases fetch error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get test cases"})
	}

	var cmd *exec.Cmd
	switch request.Language {
	case "python":
		log.Println("Processing Python code")
		driverPath := filepath.Join(tmpDir, "driver.py")
		if err := fetchFromGCS(ctx, client, bucketName, filepath.Join(basePath, "drivers/python/driver.py"), driverPath); err != nil {
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
		if err := fetchFromGCS(ctx, client, bucketName, filepath.Join(basePath, "drivers/cpp/driver.cpp"), driverPath); err != nil {
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

	timeout := time.After(10 * time.Second)
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
