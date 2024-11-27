variable "project" {
    type = string
    description = "GCP projects value"
    default = "intui-443016"
}


variable "region" {
    type = map(string)
    description = "Different regional mapping"
    default = {
      "us-central" = "us-central1"
    }
}

variable "zone" {
    type = map(string)
    description = "Different regional mapping"
    default = {
      "us-central1-a" = "us-central1-a",
      "us-central1-b" = "us-central1-b",
      "us-central1-c" = "us-central1-c",
    }
}

variable "artifact_repository_id" {
  type = string
  description = "Repo id for artifact creation"
  default = "exec-arti-repo"
}

variable "exec_image_name" {
  type = string
  description = "Executor image name"
  default = "executor"
}


variable "image_tag" {
  type = map(string)
  description = "Tag for executor image "
  default = {
    "latest" = "latest"
    "pi" = "rpi"
  }
}