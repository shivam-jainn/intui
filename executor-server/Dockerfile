# Build stage
FROM golang:alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc g++ make


# Copy source and build
COPY ./execserver .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o execserver .

# Runtime stage
FROM alpine:latest

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

# Copy only the binary from builder
COPY --from=builder /app/execserver .

EXPOSE 8080

CMD ["./execserver"]