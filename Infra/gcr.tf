resource "google_cloud_run_v2_service" "executor" {
  name     = var.cloud_run_service_name-executor
  location = var.location["us-east1"]
  deletion_protection = false
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "${var.location["us-east1"]}-docker.pkg.dev/${var.project}/${var.artifact_repository_id}/${var.exec_image_name}:${var.image_tag["latest"]}"
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}


resource "google_cloud_run_v2_service_iam_binding" "binding" {
  project = google_cloud_run_v2_service.executor.project
  location = google_cloud_run_v2_service.executor.location
  name = google_cloud_run_v2_service.executor.name
  role    = "roles/run.invoker"
  members = [
      "serviceAccount:${var.account-email-invoker}",
  ]
}