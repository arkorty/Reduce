FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 \
    CGO_CFLAGS="-D_FILE_OFFSET_BITS=64 -D_LARGEFILE64_SOURCE" \
    CGO_LDFLAGS="-lm" \
    go build -ldflags="-s -w" .

FROM alpine:latest

COPY --from=builder /app/reduce /reduce

EXPOSE 8080

CMD ["/reduce"]
