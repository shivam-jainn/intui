# Load environment variables from .env.local if it exists, otherwise .env
# Relative path from Infra/ to repo root is ../
IF_LOCAL := $(wildcard ../.env.local)
IF_STD   := $(wildcard ../.env)

ifdef IF_LOCAL
    include ../.env.local
    export $(shell sed 's/=.*//' ../.env.local)
else ifdef IF_STD
    include ../.env
    export $(shell sed 's/=.*//' ../.env)
endif

.PHONY: help push-questions

help:
	@echo "Available commands:"
	@echo "  make push-questions  # Push local question markdown and driver files to GCS"

push-questions:
	@echo "🚀 Pushing questions to GCS bucket: $(GCP_BUCKET_NAME)"
	@node push_questions.js
