# Multi-stage build for efficient container
FROM python:3.11-slim as builder

# Install uv
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml README.md ./
COPY src/ ./src/

# Create virtual environment and install dependencies
RUN uv venv
RUN uv pip install -e .

# Runtime stage
FROM python:3.11-slim

# Install ffmpeg for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv ./.venv

# Copy application code
COPY src/ ./src/
COPY rules/ ./rules/

# Set Python path
ENV PYTHONPATH=/app/src
ENV PATH="/app/.venv/bin:$PATH"

# Create non-root user
RUN useradd -m -u 1000 medaitor && chown -R medaitor:medaitor /app
USER medaitor

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "medaitor.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]