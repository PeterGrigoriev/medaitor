#!/bin/bash
set -e

echo "🐳 Starting Mediator (Docker Development)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker from https://www.docker.com"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    # Try docker compose (newer syntax)
    if ! docker compose version &> /dev/null; then
        echo "❌ Error: Docker Compose is not installed"
        echo "Please install Docker Compose"
        exit 1
    fi
    # Use newer docker compose syntax
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p models logs

# Build if requested
if [ "$1" = "--build" ] || [ "$1" = "-b" ]; then
    echo "🔨 Building Docker images..."
    $COMPOSE_CMD build
fi

# Pull latest Redis image
echo "📥 Pulling Redis image..."
docker pull redis:7-alpine

# Start services
echo "🚀 Starting services..."
$COMPOSE_CMD up

# Note: Use Ctrl+C to stop services