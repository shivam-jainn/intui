resource "google_artifact_registry_repository" "exec-repo" {
  location      = var.region["us-central"]
  repository_id = var.artifact_repository_id
  description   = "exec image docker repository"
  format        = "DOCKER"

  docker_config {
    immutable_tags = true
  }
}
