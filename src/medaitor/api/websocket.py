"""WebSocket handlers for real-time communication."""

import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        """Accept connection and add to room."""
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)
        logger.info(f"Client connected to room {room_id}")
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        """Remove connection from room."""
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"Client disconnected from room {room_id}")
    
    async def broadcast(self, message: dict, room_id: str, exclude: WebSocket = None):
        """Broadcast message to all connections in room."""
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting message: {e}")


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """WebSocket endpoint for room communication."""
    await manager.connect(websocket, room_id)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "system",
            "message": f"Connected to room {room_id}",
        })
        
        # Broadcast join event
        await manager.broadcast(
            {
                "type": "user_joined",
                "room_id": room_id,
            },
            room_id,
            exclude=websocket,
        )
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "offer":
                # WebRTC offer
                await manager.broadcast(data, room_id, exclude=websocket)
            elif data.get("type") == "answer":
                # WebRTC answer
                await manager.broadcast(data, room_id, exclude=websocket)
            elif data.get("type") == "ice-candidate":
                # ICE candidate
                await manager.broadcast(data, room_id, exclude=websocket)
            elif data.get("type") == "transcript":
                # Transcription result
                await manager.broadcast(
                    {
                        "type": "transcript",
                        "speaker": data.get("speaker", "Unknown"),
                        "text": data.get("text", ""),
                        "timestamp": data.get("timestamp"),
                    },
                    room_id,
                )
            else:
                # Unknown message type
                logger.warning(f"Unknown message type: {data.get('type')}")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            {
                "type": "user_left",
                "room_id": room_id,
            },
            room_id,
        )
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id)