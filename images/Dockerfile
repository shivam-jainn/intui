# Build stage
FROM golang:alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc g++ make


# Copy source and build
COPY images/execserver .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o execserver .

# Runtime base stage
FROM alpine:latest AS runtime-base

# Install runtime dependencies in a single layer
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    py3-pip \
    openjdk17 \
    g++ \
    gcc

WORKDIR /app

ENV PORT=8080
ENV LOCAL_QUESTIONS_PATH=/app/questions
ENV ENABLE_EXECUTION_CONSUMER=false
ENV EXECUTION_QUEUE_NAME=execution_requests
ENV EXECUTION_RESULT_QUEUE_NAME=execution_results

# Copy only the binary from builder
COPY --from=builder /app/execserver .

EXPOSE 8080

# Development image: local questions are bundled, and mode defaults to development
FROM runtime-base AS runtime-development
ENV EXECUTOR_MODE=development
ENV ENABLE_EXECUTION_CONSUMER=true
ENV RABBITMQ_URL=amqp://rabbit:rabbit@host.docker.internal:5672/
ENV EXECUTION_WEBHOOK_TOKEN=secret
COPY questions /app/questions

CMD ["./execserver"]

# Production image: mode defaults to production and expects GCS config at runtime
FROM runtime-base AS runtime-production
ENV EXECUTOR_MODE=production
CMD ["./execserver"]

# Default final image remains production
FROM runtime-production