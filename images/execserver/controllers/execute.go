package controllers

import (
	"bytes"
	"os"
	"os/exec"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
)

func ExecuteCode(c *fiber.Ctx) error {
	var request struct {
		QuestionName string `json:"questionName"`
		UserCode     string `json:"userCode"`
		Language     string `json:"language"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var cmd *exec.Cmd

	switch request.Language {
	case "python":
		cmd = exec.Command("python3", "-c", request.UserCode)
	case "cpp":
		tempFileName := "temp.cpp"
		err := os.WriteFile(tempFileName, []byte(request.UserCode), 0644)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to write temporary file: " + err.Error(),
			})
		}
		defer os.Remove(tempFileName)

		cmd = exec.Command("g++", tempFileName, "-o", "temp.out")

		if err := cmd.Run(); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Compilation failed: " + err.Error(),
			})
		}

		defer os.Remove("temp.out")
		cmd = exec.Command("./temp.out")
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unsupported language: " + request.Language,
		})
	}

	startTime := time.Now()
	var memStatsBefore, memStatsAfter runtime.MemStats
	runtime.ReadMemStats(&memStatsBefore)

	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	execErr := cmd.Run()

	duration := time.Since(startTime)
	runtime.ReadMemStats(&memStatsAfter)
	memoryUsed := (memStatsAfter.Alloc - memStatsBefore.Alloc) / 1024

	result := fiber.Map{
		"questionName": request.QuestionName,
		"output":       out.String(),
		"timeTaken":    duration.Seconds(),
		"memoryUsedKB": memoryUsed,
	}

	if execErr != nil {
		result["error"] = stderr.String()
		return c.Status(fiber.StatusBadRequest).JSON(result)
	}

	return c.Status(fiber.StatusOK).JSON(result)
}
