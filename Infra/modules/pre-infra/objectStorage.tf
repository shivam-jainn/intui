resource "google_storage_bucket" "questions-bucket" {
  name          = var.bucket_name
  location      = var.region["us-east1"]

  cors {
    origin          = var.website_uri
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}