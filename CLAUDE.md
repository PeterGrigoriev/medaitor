# CLAUDE.md - AI Assistant Context

## Project Overview

Mediator is an AI-assisted moderator/mediator for spoken conversations. The system transcribes real-time voice conversations, identifies speakers, and will eventually enforce community guidelines.

## Current State

- **Phase**: MVP Development
- **Architecture**: Monolithic Python application
- **Stack**: FastAPI + Whisper + WebSockets + HTMX

## Key Design Decisions

1. **Monolithic First**: Single Python service for simplicity
2. **Local-First**: Docker Compose for development, runs completely offline
3. **Whisper Integration**: Using faster-whisper for better performance
4. **Simple UI**: Server-side rendering with HTMX instead of React/Vue

## 🚨 CRITICAL: Package Management

**ALWAYS use `uv` for ALL Python package operations:**
- ❌ NEVER use `pip install`
- ❌ NEVER use `pip freeze`
- ❌ NEVER use `poetry`
- ❌ NEVER use `pipenv`
- ✅ ALWAYS use `uv pip install`
- ✅ ALWAYS use `uv pip freeze`
- ✅ ALWAYS use `uv venv`

## Development Guidelines

### Code Style
- Use `uv` for package management (MANDATORY - see above)
- Follow PEP 8 with Black formatting
- Type hints for all functions
- Async/await for all I/O operations

### Testing
- Run tests with: `pytest`
- Maintain test coverage above 80%
- Test WebSocket connections with pytest-asyncio

### Quick Start Commands
```bash
# Use provided scripts (they handle uv correctly)
./run-app.sh          # Local development
./run-app-docker.sh   # Docker development
./build-docker.sh     # Build Docker image

# Manual commands (ALWAYS with uv)
uv venv                      # Create virtual environment
source .venv/bin/activate    # Activate venv
uv pip install -e .          # Install dependencies
uv pip install -e ".[dev]"   # Install with dev dependencies

# Lint and format
black src tests
ruff check src tests

# Type checking
mypy src

# Run tests
pytest
```

## Project Structure

```
src/medaitor/
├── main.py          # FastAPI app entry point
├── config.py        # Settings management
├── api/            # HTTP and WebSocket endpoints
├── services/       # Business logic
├── templates/      # Jinja2 HTML templates
└── static/         # CSS, JS files
```

## Current TODO

1. Basic WebSocket room functionality
2. Audio stream capture from browser
3. Whisper integration for transcription
4. Speaker diarization
5. Git-based rules loading

## Technical Constraints

- Must run locally with Docker
- Optimize for development speed over performance
- Keep dependencies minimal
- Prefer standard library over external packages

## Future Considerations

- May split into microservices later
- Could add cloud transcription as alternative
- Might need dedicated GPU for production Whisper