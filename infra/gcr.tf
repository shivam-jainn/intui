resource "google_cloud_run_service" "my_service" {
  name     = "exec-run-service"
  location = var.region["us-central"]

  template {
    spec {
      containers {
        image = "us-central1-docker.pkg.dev/${var.project}/${var.artifact_repository_id}/${var.exec_image_name}:${var.image_tag["latest"]}"
        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }
      }
    }
  }

  autogenerate_revision_name = true

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.my_service.location
  service     = google_cloud_run_service.my_service.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

data "google_iam_policy" "noauth" {
  binding {
    role    = "roles/run.invoker"
    members = ["allUsers"]
  }
}
