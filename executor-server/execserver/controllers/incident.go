package controllers

import (
	"bytes"
	"context"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/gofiber/fiber/v2"
	"google.golang.org/api/iterator"
)

func ExecuteIncident(c *fiber.Ctx) error {
	log.Println("Starting incident execution request")

	var request struct {
		IncidentName string `json:"incidentName"`
		UserCode     string `json:"userCode"`
		Language     string `json:"language"`
		EntryFile    string `json:"entryFile"`
	}

	if err := c.BodyParser(&request); err != nil {
		log.Println("Incident body parse error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if request.IncidentName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "incidentName is required"})
	}

	if request.Language == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "language is required"})
	}

	if request.UserCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "userCode is required"})
	}

	if request.Language != "python" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Only python incidents are currently supported"})
	}

	tmpDir, err := os.MkdirTemp("", "incident-execution-*")
	if err != nil {
		log.Println("Incident temp dir error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Temp directory creation failed"})
	}
	defer os.RemoveAll(tmpDir)

	ctx := context.Background()
	bucketName := os.Getenv("GCS_BUCKET")
	incidentPrefix := filepath.ToSlash(filepath.Join("incidents", request.IncidentName, "language", request.Language))

	if err := fetchDirectory(ctx, bucketName, incidentPrefix, tmpDir); err != nil {
		log.Println("Incident assets fetch error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch incident assets"})
	}

	entryFile := request.EntryFile
	if strings.TrimSpace(entryFile) == "" {
		entryFile = "src/service.py"
	}

	entryPath := filepath.Join(tmpDir, entryFile)
	if err := os.MkdirAll(filepath.Dir(entryPath), 0755); err != nil {
		log.Println("Incident entry dir error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to prepare incident workspace"})
	}

	if err := os.WriteFile(entryPath, []byte(request.UserCode), 0644); err != nil {
		log.Println("Incident entry write error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to write user code"})
	}

	cmd := exec.Command("python3", "-m", "unittest", "discover", "-s", "tests")
	cmd.Dir = tmpDir

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	cmd.Env = append(os.Environ(), "PYTHONPATH="+tmpDir)

	timeout := time.After(20 * time.Second)
	done := make(chan error)
	go func() { done <- cmd.Run() }()

	status := "Passed"
	passed := true

	select {
	case err := <-done:
		if err != nil {
			status = "Failed"
			passed = false
		}
	case <-timeout:
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return c.JSON(fiber.Map{
			"incidentName": request.IncidentName,
			"status":       "Time Limit Exceeded",
			"passed":       false,
			"output":       strings.TrimSpace(out.String()),
			"error":        strings.TrimSpace(stderr.String()),
		})
	}

	return c.JSON(fiber.Map{
		"incidentName": request.IncidentName,
		"status":       status,
		"passed":       passed,
		"output":       strings.TrimSpace(out.String()),
		"error":        strings.TrimSpace(stderr.String()),
	})
}

func fetchDirectory(ctx context.Context, bucketName, objectPrefix, destDir string) error {
	if os.Getenv("APP_ENV") == "development" {
		fsDataPath := os.Getenv("FS_DATA_PATH")
		if fsDataPath == "" {
			fsDataPath = "/data"
		}

		srcDir := filepath.Join(fsDataPath, objectPrefix)
		return filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			relPath, err := filepath.Rel(srcDir, path)
			if err != nil {
				return err
			}

			if relPath == "." {
				return nil
			}

			destPath := filepath.Join(destDir, relPath)
			if info.IsDir() {
				return os.MkdirAll(destPath, 0755)
			}

			input, err := os.ReadFile(path)
			if err != nil {
				return err
			}

			if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
				return err
			}

			return os.WriteFile(destPath, input, 0644)
		})
	}

	client, err := storage.NewClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	prefix := filepath.ToSlash(objectPrefix)
	if !strings.HasSuffix(prefix, "/") {
		prefix += "/"
	}

	it := client.Bucket(bucketName).Objects(ctx, &storage.Query{Prefix: prefix})
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return err
		}

		if strings.HasSuffix(attrs.Name, "/") {
			continue
		}

		rel := strings.TrimPrefix(attrs.Name, prefix)
		if rel == "" {
			continue
		}

		destPath := filepath.Join(destDir, rel)
		if err := fetchFromGCS(ctx, client, bucketName, attrs.Name, destPath); err != nil {
			return err
		}
	}

	return nil
}
