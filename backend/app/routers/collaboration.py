"""
Real-time WebSocket & Chat Collaboration Router
Endpoints:
- WebSocket /ws/collaboration/{room_id}
- GET /api/collaboration/rooms
- GET /api/collaboration/messages/{room_id}
- POST /api/collaboration/messages
"""
import json
import logging
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db, SessionLocal
from app.models import DBCollaborationRoom, DBCollaborationMessage, DBCollaborationApproval
from app.routers.audit import create_audit_entry

logger = logging.getLogger("urjanetra.collaboration")

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # Maps room_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        logger.info(f"WebSocket client connected to room: {room_id}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        logger.info(f"WebSocket client disconnected from room: {room_id}")

    async def broadcast(self, room_id: str, message_data: dict):
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message_data)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, room_id)


manager = ConnectionManager()

# WebSocket router - mounted at root (no /api prefix)
ws_router = APIRouter()

# REST router - mounted under /api prefix
router = APIRouter()


@ws_router.websocket("/ws/collaboration/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Process received payload
            sender = data.get("sender", "Operator Arjun Mehta")
            role = data.get("role", "Defense & Energy Strategist")
            msg_text = data.get("message", "")
            msg_type = data.get("type", "CHAT")

            ts = datetime.now(timezone.utc).strftime("%H:%M:%S")

            # Persist message to DB
            db = SessionLocal()
            try:
                msg_obj = DBCollaborationMessage(
                    room_id=room_id,
                    sender=sender,
                    sender_role=role,
                    message=msg_text,
                    timestamp=ts,
                    avatar=data.get("avatar")
                )
                db.add(msg_obj)
                db.commit()
                db.refresh(msg_obj)
                msg_id = msg_obj.id
            finally:
                db.close()

            broadcast_payload = {
                "id": msg_id,
                "room_id": room_id,
                "sender": sender,
                "role": role,
                "message": msg_text,
                "type": msg_type,
                "timestamp": ts,
                "avatar": data.get("avatar")
            }

            await manager.broadcast(room_id, broadcast_payload)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as err:
        logger.error(f"WebSocket error in room {room_id}: {err}")
        manager.disconnect(websocket, room_id)


@router.get("/collaboration/rooms")
def get_collaboration_rooms(db: Session = Depends(get_db)):
    rooms = db.query(DBCollaborationRoom).all()
    if not rooms:
        # Provide fallback default war rooms
        default_rooms = [
            {"id": "war-room", "name": "National Crisis War Room", "description": "Strategic escalation and joint operational command"},
            {"id": "spr-tactical", "name": "SPR Tactical Release Channel", "description": "Real-time drawdowns and site logistics coordination"},
            {"id": "compliance-shield", "name": "Sanctions & Compliance Operations", "description": "OFAC, vessel tracking, and trade risk legal team"},
        ]
        return {"rooms": default_rooms}
    return {"rooms": [{"id": r.id, "name": r.name, "description": r.description} for r in rooms]}


@router.get("/collaboration/messages/{room_id}")
def get_room_messages(room_id: str, db: Session = Depends(get_db)):
    msgs = db.query(DBCollaborationMessage).filter(DBCollaborationMessage.room_id == room_id).order_by(DBCollaborationMessage.id.asc()).all()
    return {
        "room_id": room_id,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "role": m.sender_role,
                "message": m.message,
                "timestamp": m.timestamp,
                "avatar": m.avatar
            }
            for m in msgs
        ]
    }


@router.post("/collaboration/messages")
async def post_room_message(payload: dict, db: Session = Depends(get_db)):
    room_id = payload.get("room_id", "war-room")
    sender = payload.get("sender", "Operator Arjun Mehta")
    role = payload.get("role", "Defense & Energy Strategist")
    msg_text = payload.get("message", "")
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")

    msg_obj = DBCollaborationMessage(
        room_id=room_id,
        sender=sender,
        sender_role=role,
        message=msg_text,
        timestamp=ts,
        avatar=payload.get("avatar")
    )
    db.add(msg_obj)
    db.commit()
    db.refresh(msg_obj)

    broadcast_data = {
        "id": msg_obj.id,
        "room_id": room_id,
        "sender": sender,
        "role": role,
        "message": msg_text,
        "type": "CHAT",
        "timestamp": ts,
        "avatar": msg_obj.avatar
    }

    await manager.broadcast(room_id, broadcast_data)

    return {"success": True, "message": broadcast_data}
