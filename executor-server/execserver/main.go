package main

import (
	"execserver/controllers"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Get("/health", controllers.HealthCheck)

	app.Post("/execute", controllers.ExecuteCode)

	log.Fatal(app.Listen(":8080"))
}
