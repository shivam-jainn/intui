resource "google_artifact_registry_repository" "executor-repo" {
  location      = var.region["us-east1"]
  repository_id = var.artifact_repository_id
  description   = "executor docker repository"
  format        = "DOCKER"

  docker_config {
    immutable_tags = true
  }
}