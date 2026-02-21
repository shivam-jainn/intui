package main

import (
	"execserver/consumer"
	"execserver/controllers"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func main() {
	consumerOn := consumerEnabled()
	log.Printf("execserver startup: EXECUTOR_MODE=%q ENABLE_EXECUTION_CONSUMER=%q consumerEnabled=%t", os.Getenv("EXECUTOR_MODE"), os.Getenv("ENABLE_EXECUTION_CONSUMER"), consumerOn)

	if consumerOn {
		log.Println("starting execution consumer")
		go func() {
			if err := consumer.Start(); err != nil {
				log.Printf("consumer exited: %v", err)
			}
		}()
	}

	app := fiber.New()

	app.Get("/health", controllers.HealthCheck)

	app.Post("/execute", controllers.ExecuteCode)

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}

	log.Fatal(app.Listen(":" + port))
}

func consumerEnabled() bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv("ENABLE_EXECUTION_CONSUMER")))
	if value == "" {
		mode := strings.ToLower(strings.TrimSpace(os.Getenv("EXECUTOR_MODE")))
		return mode == "development"
	}

	return value == "1" || value == "true" || value == "yes"
}
