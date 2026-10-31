"""
SOS Emergency Case Manager
Handles validation, unique ID generation, SQLite storage, and queue dispatch.
"""
import random
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import SOSRecord, SOSUpdateMessage
from app.schemas.sos import SOSCreateRequest, SOSUpdateRequest
from app.services.transmission_queue import transmission_queue
from app.websocket.manager import ws_manager

logger = logging.getLogger("perchlink.sos_manager")

class SOSManager:
    @staticmethod
    def generate_unique_id(db: Session) -> str:
        """
        Generate non-colliding human-readable SOS ID: SOS-XXXX
        """
        for _ in range(50):
            candidate = f"SOS-{random.randint(1000, 9999)}"
            existing = db.query(SOSRecord).filter(SOSRecord.id == candidate).first()
            if not existing:
                return candidate
        # Fallback timestamp suffix
        return f"SOS-{int(datetime.now().timestamp()) % 100000}"

    @staticmethod
    async def create_sos(db: Session, request: SOSCreateRequest) -> SOSRecord:
        """
        Create a new emergency case, store persistently in SQLite, and enqueue.
        """
        sos_id = SOSManager.generate_unique_id(db)
        now = datetime.now(timezone.utc)

        lat = request.location.latitude if request.location else None
        lon = request.location.longitude if request.location else None
        acc = request.location.accuracy if request.location else None

        record = SOSRecord(
            id=sos_id,
            emergency_type=request.emergencyType.upper(),
            people_count=request.peopleCount,
            latitude=lat,
            longitude=lon,
            accuracy=acc,
            landmark=request.landmark,
            message=request.message,
            created_at=now,
            updated_at=now,
            drone_received=True,
            drone_received_at=now,
            transmission_status="PENDING",
            ground_station_acknowledged=False,
            rescue_team_acknowledged=False,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        logger.info(f"[SOS] Created and persisted record {sos_id} in SQLite.")

        # Immediately broadcast receipt confirmation to WebSocket
        await ws_manager.broadcast_to_sos(sos_id, {
            "event": "sos_received_by_drone",
            "sosId": sos_id,
            "status": "RECEIVED_BY_DRONE",
            "timestamp": now.isoformat(),
        })

        # Enqueue for LoRa radio transmission
        await transmission_queue.enqueue(sos_id)

        return record

    @staticmethod
    async def add_update_message(db: Session, sos_id: str, request: SOSUpdateRequest) -> SOSRecord:
        """
        Attach supplemental note to an existing emergency case.
        """
        sos = db.query(SOSRecord).filter(SOSRecord.id == sos_id).first()
        if not sos:
            return None

        now = datetime.now(timezone.utc)
        update_msg = SOSUpdateMessage(
            sos_id=sos_id,
            text=request.message,
            created_at=now
        )
        db.add(update_msg)
        sos.updated_at = now
        db.commit()
        db.refresh(sos)

        logger.info(f"[SOS] Added supplemental update to {sos_id}.")

        # Re-broadcast updated details to connected clients
        await ws_manager.broadcast_to_sos(sos_id, {
            "event": "sos_updated",
            "sosId": sos_id,
            "message": request.message,
            "timestamp": now.isoformat(),
        })

        return sos

    @staticmethod
    def get_sos(db: Session, sos_id: str) -> SOSRecord:
        return db.query(SOSRecord).filter(SOSRecord.id == sos_id).first()

    @staticmethod
    def format_response(record: SOSRecord, is_simulated: bool = False) -> dict:
        """
        Formats SQLAlchemy model to matching Pydantic response dict
        """
        loc = None
        if record.latitude is not None and record.longitude is not None:
            loc = {
                "latitude": record.latitude,
                "longitude": record.longitude,
                "accuracy": record.accuracy,
            }

        status_label = "RECEIVED_BY_DRONE"
        if record.rescue_team_acknowledged:
            status_label = "RESCUE_TEAM_ACKNOWLEDGED"
        elif record.ground_station_acknowledged:
            status_label = "RECEIVED_BY_GROUND_STATION"
        elif record.transmission_status == "TRANSMITTING":
            status_label = "TRANSMITTING_TO_RESCUE_STATION"

        updates = []
        if record.updates:
            for u in record.updates:
                updates.append({
                    "id": u.id,
                    "text": u.text,
                    "createdAt": u.created_at,
                })

        return {
            "id": record.id,
            "emergencyType": record.emergency_type,
            "peopleCount": record.people_count,
            "location": loc,
            "landmark": record.landmark,
            "message": record.message,
            "createdAt": record.created_at,
            "updatedAt": record.updated_at,
            "droneReceived": record.drone_received,
            "droneReceivedAt": record.drone_received_at,
            "status": status_label,
            "transmittingLoRa": record.transmission_status == "TRANSMITTING",
            "groundStationAcknowledged": record.ground_station_acknowledged,
            "groundStationAcknowledgedAt": record.ground_station_acknowledged_at,
            "rescueTeamAcknowledged": record.rescue_team_acknowledged,
            "rescueTeamAcknowledgedAt": record.rescue_team_acknowledged_at,
            "additionalMessages": updates,
            "isSimulated": is_simulated,
        }

sos_manager = SOSManager()
