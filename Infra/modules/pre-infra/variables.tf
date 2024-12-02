variable "project" {
    type = string
    description = "GCP projects value"
}


variable "region" {
    type = map(string)
    description = "Different regional mapping"
    default = {
      "us-central" = "us-central1",
      "us-east1" = "us-east1"
    }
}

variable "zone" {
    type = map(string)
    description = "Different regional mapping"
    default = {
      "us-central1-a" = "us-central1-a",
      "us-central1-b" = "us-central1-b",
      "us-central1-c" = "us-central1-c",
      "us-east1-a" = "us-east1-a",
      "us-east1-b" = "us-east1-b",
      "us-east1-c" = "us-east1-c",
    }
}



variable "artifact_repository_id" {
  type = string
  description = "Repo id for artifact creation"
}

variable "exec_image_name" {
  type = string
  description = "Executor image name"
}


variable "image_tag" {
  type = map(string)
  description = "Tag for executor image "
  default = {
    "latest" = "latest"
    "pi" = "rpi"
  }
}

variable "cloud_run_service_name-executor" {
  type = string
  description = "executor service name"
}

variable "account-email-invoker" {
  type = string
  description = "email account for invoker"
}

variable "website_uri" {
  type = list(string)
  description = "Website uri"
}

variable "bucket_name" {
  type = string
  description = "Storage bucket name"
}