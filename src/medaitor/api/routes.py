"""REST API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class RoomCreate(BaseModel):
    """Room creation request."""
    name: str
    max_participants: int = 10


class RoomResponse(BaseModel):
    """Room response."""
    id: str
    name: str
    participants: int
    created_at: str


@router.post("/rooms", response_model=RoomResponse)
async def create_room(room: RoomCreate):
    """Create a new chat room."""
    # TODO: Implement room creation logic
    import uuid
    from datetime import datetime
    
    return RoomResponse(
        id=str(uuid.uuid4()),
        name=room.name,
        participants=0,
        created_at=datetime.utcnow().isoformat(),
    )


@router.get("/rooms/{room_id}", response_model=RoomResponse)
async def get_room(room_id: str):
    """Get room details."""
    # TODO: Implement room retrieval logic
    from datetime import datetime
    
    return RoomResponse(
        id=room_id,
        name="Test Room",
        participants=1,
        created_at=datetime.utcnow().isoformat(),
    )


@router.get("/version")
async def get_version():
    """Get application version information."""
    from medaitor import __version__
    return {
        "version": __version__,
        "app": "Mediator",
        "description": "AI-assisted conversation moderator"
    }


@router.get("/rules")
async def get_rules():
    """Get community rules."""
    # TODO: Load rules from Git repository
    return {
        "rules": [
            "Be respectful to all participants",
            "No hate speech or discrimination",
            "Stay on topic",
        ]
    }