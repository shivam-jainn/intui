provider "google" {
    project = var.project
    region = var.region["us-east1"]
    zone = var.zone["us-east1-c"]
    credentials = "../../credentials/gcp.json"
}