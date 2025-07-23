"""Room management service."""

import logging
import uuid
from datetime import datetime
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class Room:
    """Represents a chat room."""
    
    def __init__(self, name: str, max_participants: int = 10):
        self.id = str(uuid.uuid4())
        self.name = name
        self.max_participants = max_participants
        self.created_at = datetime.utcnow()
        self.participants = set()
        self.transcripts = []
    
    def add_participant(self, participant_id: str) -> bool:
        """Add participant to room."""
        if len(self.participants) >= self.max_participants:
            return False
        self.participants.add(participant_id)
        return True
    
    def remove_participant(self, participant_id: str):
        """Remove participant from room."""
        self.participants.discard(participant_id)
    
    def add_transcript(self, speaker: str, text: str, timestamp: float):
        """Add transcript entry."""
        self.transcripts.append({
            "speaker": speaker,
            "text": text,
            "timestamp": timestamp,
        })
    
    def to_dict(self) -> dict:
        """Convert room to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "participants": len(self.participants),
            "max_participants": self.max_participants,
            "created_at": self.created_at.isoformat(),
        }


class RoomManager:
    """Manages chat rooms."""
    
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
    
    def create_room(self, name: str, max_participants: int = 10) -> Room:
        """Create a new room."""
        room = Room(name, max_participants)
        self.rooms[room.id] = room
        logger.info(f"Created room: {room.id} - {room.name}")
        return room
    
    def get_room(self, room_id: str) -> Optional[Room]:
        """Get room by ID."""
        return self.rooms.get(room_id)
    
    def delete_room(self, room_id: str) -> bool:
        """Delete room."""
        if room_id in self.rooms:
            del self.rooms[room_id]
            logger.info(f"Deleted room: {room_id}")
            return True
        return False
    
    def list_rooms(self) -> list:
        """List all rooms."""
        return [room.to_dict() for room in self.rooms.values()]
    
    def add_participant(self, room_id: str, participant_id: str) -> bool:
        """Add participant to room."""
        room = self.get_room(room_id)
        if room:
            return room.add_participant(participant_id)
        return False
    
    def remove_participant(self, room_id: str, participant_id: str):
        """Remove participant from room."""
        room = self.get_room(room_id)
        if room:
            room.remove_participant(participant_id)
    
    def add_transcript(
        self,
        room_id: str,
        speaker: str,
        text: str,
        timestamp: float,
    ):
        """Add transcript to room."""
        room = self.get_room(room_id)
        if room:
            room.add_transcript(speaker, text, timestamp)