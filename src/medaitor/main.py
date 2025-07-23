"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from medaitor.config import settings
from medaitor.api.routes import router as api_router
from medaitor.api.websocket import router as ws_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Mediator application...")
    # Initialize services here (Redis, Whisper model loading, etc.)
    yield
    logger.info("Shutting down Mediator application...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-assisted conversation moderator",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=settings.static_path), name="static")

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

# Templates
templates = Jinja2Templates(directory=settings.templates_path)


@app.get("/")
async def index():
    """Home page."""
    from fastapi import Request
    from fastapi.responses import HTMLResponse
    
    request = Request({"type": "http", "app": app})
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "app_name": settings.app_name},
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "app": settings.app_name}