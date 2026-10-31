"""
WebSocket Connection Manager for Real-Time Survivor Status Updates
Maintains isolated client connection pools per SOS ID.
"""
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("perchlink.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps sos_id -> Set of connected WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, sos_id: str, websocket: WebSocket):
        await websocket.accept()
        if sos_id not in self.active_connections:
            self.active_connections[sos_id] = set()
        self.active_connections[sos_id].add(websocket)
        logger.info(f"Client connected for SOS {sos_id}. Total listeners: {len(self.active_connections[sos_id])}")

    def disconnect(self, sos_id: str, websocket: WebSocket):
        if sos_id in self.active_connections:
            self.active_connections[sos_id].discard(websocket)
            if not self.active_connections[sos_id]:
                del self.active_connections[sos_id]
        logger.info(f"Client disconnected for SOS {sos_id}.")

    async def broadcast_to_sos(self, sos_id: str, message: dict):
        """
        Broadcast delivery updates specifically to clients tracking this SOS ID
        """
        if sos_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[sos_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Error sending to client {sos_id}: {e}")
                    dead_connections.add(connection)
            
            for dead in dead_connections:
                self.disconnect(sos_id, dead)

ws_manager = ConnectionManager()
