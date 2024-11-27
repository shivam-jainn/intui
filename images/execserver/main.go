package main

import (
	"execserver/clients"
	"execserver/controllers"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	clients.InitRedis()

	app.Get("/health", controllers.HealthCheck)

	app.Post("/execute", controllers.ProcessJob)

	log.Fatal(app.Listen(":8080"))
}
