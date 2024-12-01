resource "google_artifact_registry_repository" "executor-repo" {
  location      = var.region["us-east1"]
  repository_id = "my-repository"
  description   = "executor docker repository"
  format        = "DOCKER"

  docker_config {
    immutable_tags = true
  }
}