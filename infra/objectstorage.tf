# resource "aws_s3_bucket" "intui-bucket" {
#   bucket = "intui-bucket"

#   tags = {
#     Name        = "Intui"
#     Environment = "Development"
#   }
# }

resource "google_storage_bucket" "intui-bucket" {
  name     = "intui-bucket"
  location = "us-central1"
}

resource "google_storage_bucket_access_control" "public_rule" {
  bucket = google_storage_bucket.intui-bucket.name
  role   = "READER"
  entity = "allUsers"
}
