FROM golang:alpine AS builder

WORKDIR /app

RUN apk update && apk add --no-cache gcc g++ make

COPY ./execserver/go.mod ./execserver/go.sum ./

RUN go mod download

COPY ./execserver .

RUN go build -o execserver .

FROM alpine:latest

RUN apk update && \
    apk add --no-cache nodejs npm python3 py3-pip openjdk17 g++ gcc

WORKDIR /app

COPY --from=builder /app/execserver .

# COPY ./execserver/.env .env

EXPOSE 8080

CMD ["./execserver"]
