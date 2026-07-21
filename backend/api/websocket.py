import json
import logging
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.models import models
from backend.database.session import get_db

logger = logging.getLogger("plum.ai.websocket")

class ConnectionManager:
    """Manages WebSocket connections for real-time chat."""
    
    def __init__(self):
        # Store active connections: {session_id: {connection, customer_id, ...}}
        self.active_connections: Dict[str, Dict] = {}
        self.admin_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, session_id: str, user_type: str = "customer"):
        """Register a new WebSocket connection."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        
        self.active_connections[session_id].append({
            "websocket": websocket,
            "type": user_type
        })
        
        if user_type == "admin":
            self.admin_connections.add(websocket)
        
        logger.info(f"{user_type.capitalize()} connected to session {session_id}")

    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection."""
        if session_id in self.active_connections:
            self.active_connections[session_id] = [
                conn for conn in self.active_connections[session_id]
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        
        self.admin_connections.discard(websocket)
        logger.info(f"Connection closed for session {session_id}")

    async def broadcast_to_session(self, session_id: str, message: dict):
        """Broadcast a message to all clients in a session."""
        if session_id not in self.active_connections:
            return
        
        disconnected = []
        for conn in self.active_connections[session_id]:
            try:
                await conn["websocket"].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message: {str(e)}")
                disconnected.append(conn["websocket"])
        
        # Remove disconnected clients
        for ws in disconnected:
            self.disconnect(ws, session_id)

    async def broadcast_to_admins(self, message: dict):
        """Broadcast a message to all admin connections."""
        disconnected = []
        for websocket in self.admin_connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        
        for ws in disconnected:
            self.admin_connections.discard(ws)

    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {str(e)}")

# Global connection manager
manager = ConnectionManager()

async def handle_chat_message(
    session_id: str,
    message_content: str,
    sender_type: str,
    db: Session
):
    """Handle incoming chat message from WebSocket."""
    try:
        # Verify session exists
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == session_id
        ).first()
        
        if not session:
            return False
        
        # Save message to database
        message = models.Message(
            session_id=session_id,
            sender=sender_type,
            content=message_content
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Broadcast to all connected clients in this session
        broadcast_data = {
            "type": "message",
            "session_id": session_id,
            "sender": sender_type,
            "content": message_content,
            "timestamp": message.created_at.isoformat() if message.created_at else None,
            "message_id": message.id
        }
        
        await manager.broadcast_to_session(session_id, broadcast_data)
        
        # Notify admins if it's a customer message
        if sender_type == "user":
            admin_notification = {
                "type": "new_customer_message",
                "session_id": session_id,
                "customer_name": session.customer_name,
                "customer_email": session.customer_email,
                "message_content": message_content,
                "timestamp": message.created_at.isoformat() if message.created_at else None
            }
            await manager.broadcast_to_admins(admin_notification)
        
        logger.info(f"Message saved for session {session_id} from {sender_type}")
        return True
    
    except Exception as e:
        logger.error(f"Error handling chat message: {str(e)}")
        return False

async def handle_typing_indicator(session_id: str, is_typing: bool, user_type: str):
    """Broadcast typing indicator."""
    broadcast_data = {
        "type": "typing",
        "session_id": session_id,
        "user_type": user_type,
        "is_typing": is_typing
    }
    await manager.broadcast_to_session(session_id, broadcast_data)
