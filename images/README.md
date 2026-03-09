# Executor Image

This folder builds the Go execution service used by Intui.

## Endpoints

- `GET /health` -> health check
- `POST /execute` -> run user code with test cases

## Build and Run (Local)

From repo root:

```bash
docker build -t executor:dev ./images
docker run --rm -p 8080:8080 \
	-e EXECUTOR_STORAGE_MODE=local \
	-e EXECUTOR_LOCAL_ROOT=/workspace/question-pipeline/output \
	-v "$PWD":/workspace:ro \
	executor:dev
```

## Storage Modes

- `EXECUTOR_STORAGE_MODE=local`:
	- Reads artifacts from local filesystem.
	- Uses `EXECUTOR_LOCAL_ROOT` (default `/workspace/question-pipeline/output`).
	- No GCS credentials required.

- `EXECUTOR_STORAGE_MODE=gcs`:
	- Reads artifacts from GCS bucket.
	- Requires `GCS_BUCKET` and valid Google credentials in the runtime environment.

## Artifact Contract

For each question slug, the executor expects:

- `{slug}/drivers/python/driver.py` or `{slug}/drivers/cpp/driver.cpp`
- test cases from either:
	- `{slug}/testcases.txt` and `{slug}/testcases_submission.txt`, or
	- `{slug}/tests/run.json` and `{slug}/tests/submission.json`

The executor accepts both local and GCS layouts and also supports namespaced objects under `questions/{slug}/...` in GCS.

## Runtime Environment Variables

- `PORT` (default `8080`)
- `EXECUTOR_STORAGE_MODE` (`local` or `gcs`, default `local`)
- `EXECUTOR_LOCAL_ROOT` (used in local mode)
- `EXECUTOR_TIMEOUT_SECONDS` (default `10`)
- `GCS_BUCKET` (required only for `gcs` mode)