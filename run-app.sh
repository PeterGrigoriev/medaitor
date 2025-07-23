#!/bin/bash
set -e

echo "🚀 Starting Mediator (Local Development)"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed"
    echo "Please install uv first: pip install uv"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    uv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
uv pip install -e .

# Install dev dependencies if in development
if [ "$1" = "--dev" ]; then
    echo "📚 Installing development dependencies..."
    uv pip install -e ".[dev]"
fi

# Create necessary directories
mkdir -p models logs

# Start Redis if not running (macOS/Linux)
if command -v redis-cli &> /dev/null; then
    if ! redis-cli ping &> /dev/null; then
        echo "🔴 Redis is not running. Please start Redis:"
        echo "  macOS: brew services start redis"
        echo "  Linux: sudo systemctl start redis"
        echo "  Or run: redis-server"
    else
        echo "✅ Redis is running"
    fi
else
    echo "⚠️  Redis not found. Please install Redis for full functionality"
fi

# Run the application
echo "🎯 Starting FastAPI application..."
echo "📍 Access the app at: http://localhost:8000"
echo "📍 API docs at: http://localhost:8000/docs"
echo ""

# Set Python path and run
export PYTHONPATH="${PYTHONPATH}:${PWD}/src"
uvicorn medaitor.main:app --reload --host 0.0.0.0 --port 8000