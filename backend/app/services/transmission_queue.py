"""
Emergency Transmission Queue Service
Coordinates FIFO dispatch, retries, database persistence, and WebSocket status broadcasts.
"""
import asyncio
import logging
from datetime import datetime, timezone
from app.database.database import SessionLocal
from app.database.models import SOSRecord
from app.websocket.manager import ws_manager
from app.services.lora_service import lora_service

logger = logging.getLogger("perchlink.queue")

class TransmissionQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.running = False
        self.active_tasks = set()

    def start(self):
        if not self.running:
            self.running = True
            asyncio.create_task(self._worker())
            logger.info("[QUEUE] Emergency transmission worker started.")

    async def enqueue(self, sos_id: str):
        """
        Enqueue an SOS ID for radio transmission
        """
        await self.queue.put(sos_id)
        logger.info(f"[QUEUE] Enqueued SOS {sos_id}. Queue size: {self.queue.qsize()}")

    async def _worker(self):
        while self.running:
            sos_id = await self.queue.get()
            try:
                await self._process_sos(sos_id)
            except Exception as e:
                logger.error(f"[QUEUE] Error processing SOS {sos_id}: {e}", exc_info=True)
            finally:
                self.queue.task_done()

    async def _process_sos(self, sos_id: str):
        db = SessionLocal()
        try:
            sos = db.query(SOSRecord).filter(SOSRecord.id == sos_id).first()
            if not sos:
                logger.warning(f"[QUEUE] SOS {sos_id} not found in database.")
                return

            if sos.rescue_team_acknowledged:
                logger.info(f"[QUEUE] SOS {sos_id} already confirmed by rescue team.")
                return

            # Update status to TRANSMITTING
            sos.transmission_status = "TRANSMITTING"
            db.commit()

            # Broadcast transmission started
            await ws_manager.broadcast_to_sos(sos_id, {
                "event": "sos_transmission_started",
                "sosId": sos_id,
                "status": "TRANSMITTING_TO_RESCUE_STATION",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            packet_data = {
                "sos_id": sos.id,
                "type": sos.emergency_type,
                "people": sos.people_count,
                "lat": sos.latitude,
                "lon": sos.longitude,
                "landmark": sos.landmark,
                "msg": sos.message,
            }

            # Define callbacks for asynchronous radio acknowledgements
            async def on_station_ack(ack_sos_id: str, ack_time: datetime):
                sdb = SessionLocal()
                try:
                    target = sdb.query(SOSRecord).filter(SOSRecord.id == ack_sos_id).first()
                    if target:
                        target.ground_station_acknowledged = True
                        target.ground_station_acknowledged_at = ack_time
                        target.transmission_status = "STATION_ACKNOWLEDGED"
                        sdb.commit()

                    await ws_manager.broadcast_to_sos(ack_sos_id, {
                        "event": "sos_received_by_ground_station",
                        "sosId": ack_sos_id,
                        "status": "RECEIVED_BY_GROUND_STATION",
                        "timestamp": ack_time.isoformat(),
                    })
                finally:
                    sdb.close()

            async def on_operator_ack(ack_sos_id: str, op_time: datetime):
                sdb = SessionLocal()
                try:
                    target = sdb.query(SOSRecord).filter(SOSRecord.id == ack_sos_id).first()
                    if target:
                        target.rescue_team_acknowledged = True
                        target.rescue_team_acknowledged_at = op_time
                        target.transmission_status = "COMPLETED"
                        sdb.commit()

                    await ws_manager.broadcast_to_sos(ack_sos_id, {
                        "event": "rescue_team_acknowledged",
                        "sosId": ack_sos_id,
                        "status": "RESCUE_TEAM_ACKNOWLEDGED",
                        "timestamp": op_time.isoformat(),
                    })
                finally:
                    sdb.close()

            # Transmit packet through LoRa service
            await lora_service.transmit_packet(packet_data, on_station_ack, on_operator_ack)

        finally:
            db.close()

    def recover_pending_records(self):
        """
        Recover uncompleted SOS records from database upon drone restart
        """
        db = SessionLocal()
        try:
            pending = db.query(SOSRecord).filter(
                SOSRecord.rescue_team_acknowledged == False
            ).all()
            if pending:
                logger.info(f"[QUEUE] Recovered {len(pending)} unacknowledged SOS records after startup.")
                for record in pending:
                    asyncio.create_task(self.enqueue(record.id))
        except Exception as e:
            logger.error(f"[QUEUE] Failed to recover pending records: {e}")
        finally:
            db.close()

transmission_queue = TransmissionQueue()
