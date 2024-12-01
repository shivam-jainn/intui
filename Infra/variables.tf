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
