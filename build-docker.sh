#!/bin/bash
set -e

echo "🔨 Building Mediator Docker Image"

# Default values
TAG="latest"
IMAGE_NAME="medaitor"
PLATFORM=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag|-t)
            TAG="$2"
            shift 2
            ;;
        --name|-n)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --platform|-p)
            PLATFORM="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: ./build-docker.sh [options]"
            echo ""
            echo "Options:"
            echo "  --tag, -t       Docker image tag (default: latest)"
            echo "  --name, -n      Docker image name (default: medaitor)"
            echo "  --platform, -p  Target platform (e.g., linux/amd64, linux/arm64)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./build-docker.sh"
            echo "  ./build-docker.sh --tag v1.0.0"
            echo "  ./build-docker.sh --platform linux/amd64"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker from https://www.docker.com"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p models logs

# Build the Docker image
echo "🐳 Building Docker image: ${IMAGE_NAME}:${TAG}"

BUILD_CMD="docker build -t ${IMAGE_NAME}:${TAG}"

# Add platform if specified
if [ -n "$PLATFORM" ]; then
    BUILD_CMD="$BUILD_CMD --platform $PLATFORM"
fi

# Add build context
BUILD_CMD="$BUILD_CMD ."

# Show build command
echo "📋 Build command: $BUILD_CMD"
echo ""

# Execute build
$BUILD_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "🏷️  Image tagged as: ${IMAGE_NAME}:${TAG}"
    echo ""
    echo "📌 Next steps:"
    echo "  - Run locally: docker run -p 8000:8000 ${IMAGE_NAME}:${TAG}"
    echo "  - Run with compose: ./run-app-docker.sh"
    echo "  - Push to registry: docker push ${IMAGE_NAME}:${TAG}"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi