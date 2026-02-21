## Executor image modes

The executor now supports two explicit build targets:

- `runtime-development`: reads testcases/drivers from local `questions/` files.
- `runtime-production`: reads testcases/drivers from GCS.

Build from the repository root (important so `questions/` is in build context):

```bash
docker build -f images/Dockerfile --target runtime-development -t executor:dev .
docker build -f images/Dockerfile --target runtime-production -t executor:prod .
```

Run development mode:

```bash
docker run --rm -p 8080:8080 executor:dev
```

Run development mode with consumer enabled (RabbitMQ):

```bash
docker run --rm -p 8080:8080 \
	-e PORT=8080 \
	-e ENABLE_EXECUTION_CONSUMER=true \
	-e RABBITMQ_URL=amqp://rabbit:rabbit@host.docker.internal:5672/ \
	-e EXECUTION_QUEUE_NAME=execution_requests \
	-e EXECUTION_RESULT_QUEUE_NAME=execution_results \
	executor:dev
```

Required local assets per question in development mode:

```text
questions/<question>/testcases.txt
questions/<question>/testcases_submission.txt
questions/<question>/drivers/python/driver.py
questions/<question>/drivers/cpp/driver.cpp
```

If any of these are missing locally, the executor will try GCS only when `GCS_BUCKET` is configured.

Run production mode:

```bash
docker run --rm -p 8080:8080 \
	-e PORT=8080 \
	-e GCS_BUCKET=<bucket-name> \
	-e ENABLE_EXECUTION_CONSUMER=true \
	-e RABBITMQ_URL=amqp://rabbit:rabbit@host.docker.internal:5672/ \
	-e EXECUTION_QUEUE_NAME=execution_requests \
	-e EXECUTION_RESULT_QUEUE_NAME=execution_results \
	-e GOOGLE_APPLICATION_CREDENTIALS=/creds/key.json \
	-v /absolute/path/key.json:/creds/key.json:ro \
	executor:prod
```

Notes:

- You can override mode at runtime with `-e EXECUTOR_MODE=development|production`.
- `EXECUTOR_MODE` takes precedence over `ENV_MODE`.
- In development, local files are resolved from `LOCAL_QUESTIONS_PATH` (default `/app/questions`).
- Server port is configurable via `PORT` (default `8080`).
- Consumer uses `EXECUTOR_URL` if set, else defaults to `http://127.0.0.1:${PORT}/execute`.