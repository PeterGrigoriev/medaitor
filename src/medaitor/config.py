"""Configuration management for Mediator."""

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    app_name: str = "Mediator"
    debug: bool = False
    log_level: str = "info"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Whisper
    whisper_model: str = "base"
    whisper_device: str = "cpu"  # or "cuda"
    whisper_compute_type: str = "int8"  # for faster-whisper
    
    # Paths
    rules_path: Path = Path("rules")
    models_path: Path = Path("models")
    static_path: Path = Path("src/medaitor/static")
    templates_path: Path = Path("src/medaitor/templates")
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    cors_origins: list[str] = ["*"]
    
    # WebRTC
    ice_servers: list[dict] = [
        {"urls": "stun:stun.l.google.com:19302"},
    ]


settings = Settings()