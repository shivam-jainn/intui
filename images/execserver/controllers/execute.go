package controllers

import (
	"encoding/json"
	"execserver/clients"
	"execserver/common"
	"execserver/utils"
	"runtime"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
)

func ProcessJob(c *fiber.Ctx) error {

	jobDataJSON, err := clients.RedisClient.LPop(clients.RedisCtx, "code_execution_queue").Result()

	print(jobDataJSON)

	if err == redis.Nil {
		println(err)
		return c.Status(fiber.StatusNotFound).SendString("No jobs available")
	} else if err != nil {
		println(err)
		return c.Status(fiber.StatusInternalServerError).SendString("Error fetching job")
	}

	var jobData common.JobData
	if err := json.Unmarshal([]byte(jobDataJSON), &jobData); err != nil {
		println(err)
		return c.Status(fiber.StatusBadRequest).SendString("Invalid job data")
	}

	startTime := time.Now()
	var memStatsBefore, memStatsAfter runtime.MemStats
	runtime.ReadMemStats(&memStatsBefore)

	output, execErr := utils.ExecuteCode(jobData.UserCode, jobData.Language)
	print(output)

	duration := time.Since(startTime)
	runtime.ReadMemStats(&memStatsAfter)

	memoryUsed := (memStatsAfter.Alloc - memStatsBefore.Alloc) / 1024

	result := map[string]interface{}{
		"questionName": jobData.QuestionName,
		"output":       output,
		"timeTaken":    duration.Seconds(), // in seconds
		"memoryUsedKB": memoryUsed,         // in KB
		"error":        "",
	}
	if execErr != nil {
		print(execErr)
		result["error"] = execErr.Error()
	}

	resultJSON, _ := json.Marshal(result)
	print(resultJSON)

	if err := clients.RedisClient.RPush(clients.RedisCtx, "code_execution_results", resultJSON).Err(); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Error pushing result to Redis")
	}

	return c.Status(fiber.StatusOK).SendString("Job processed and result sent back")
}
