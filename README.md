# Mediator

AI-assisted moderator/mediator for spoken conversations of 2 or more people.

## Overview

Mediator is a real-time voice chat application that:
- Transcribes spoken conversations using OpenAI Whisper
- Identifies who said what
- Enforces community rules (stored as Markdown files in Git)
- Provides a web-based interface for voice chat rooms

## Tech Stack

- **Backend**: Python with FastAPI
- **Transcription**: Whisper/Faster-whisper
- **Real-time**: WebSockets
- **UI**: Jinja2 templates + HTMX
- **Cache**: Redis
- **Package Manager**: uv
- **Deployment**: Docker

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up
```

Visit http://localhost:8000

### Local Development

1. Install uv:
```bash
pip install uv
```

2. Create virtual environment and install dependencies:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

3. Run the application:
```bash
uvicorn medaitor.main:app --reload
```

## Project Structure

```
medaitor/
├── src/medaitor/       # Application source code
│   ├── api/           # API endpoints and WebSocket handlers
│   ├── services/      # Business logic (transcription, rooms)
│   ├── static/        # CSS, JavaScript files
│   └── templates/     # HTML templates
├── rules/             # Community rules (Markdown files)
├── models/            # Whisper model storage
└── tests/             # Test suite
```

## Features

### Version 1.0 (Current)
- [x] Voice chat rooms with WebRTC
- [x] Real-time transcription
- [x] Speaker identification
- [x] Basic web interface
- [ ] Community rules integration

### Planned Features
- [ ] AI-powered moderation
- [ ] Multiple language support
- [ ] Recording capabilities
- [ ] Analytics dashboard

## Configuration

Environment variables:
- `WHISPER_MODEL`: Whisper model size (tiny, base, small, medium, large)
- `REDIS_URL`: Redis connection URL
- `LOG_LEVEL`: Logging level (debug, info, warning, error)

## Community Rules

Rules are stored as Markdown files in the `rules/` directory. The system automatically reloads rules when files are updated.

Example rule file (`rules/default.md`):
```markdown
# Default Community Rules

1. Be respectful to all participants
2. No hate speech or discrimination
3. Stay on topic
```

## Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black src tests

# Lint
ruff check src tests

# Type checking
mypy src
```

## License

[Add your license here]