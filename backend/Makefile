.PHONY: build run clean fmt install

# Build the Go application
build:
	GOOS=linux \
	GOARCH=amd64 \
	CGO_ENABLED=1 \
	CC=x86_64-unknown-linux-gnu-gcc \
	CGO_CFLAGS="-D_FILE_OFFSET_BITS=64 -D_LARGEFILE64_SOURCE" \
	go build -ldflags="-s -w" -o bin/reduce .

# Run the application
run:
	go run .

# Clean build artifacts
clean:
	rm -rf bin/

# Format code
fmt:
	go fmt ./...

# Install dependencies
install:
	go mod tidy

# Default target
all: clean install build
