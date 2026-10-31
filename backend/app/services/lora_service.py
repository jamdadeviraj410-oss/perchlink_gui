"""
LoRa Communication Service
Interfaces with the LILYGO T3-S3 SX1262 via PerchLinkLoRa.
CRITICAL SAFETY RULE: When MOCK_LORA is False, NO simulated ACKs are permitted.
Missing hardware or radio timeouts are strictly reported as failures.
"""
import asyncio
import logging
import time
from typing import Callable, Dict, Tuple
from datetime import datetime, timezone
from app.core.config import settings
from app.hardware.perchlink_lora import PerchLinkLoRa

logger = logging.getLogger("perchlink.lora")

class LoRaService:
    def __init__(self):
        self.is_mock = settings.MOCK_LORA
        self.controller = None
        self.pending_acks: Dict[str, Tuple[Callable, Callable]] = {}
        self.event_listener_task = None
        self.hardware_connected = False

    def start(self):
        if self.is_mock:
            logger.warning("[LORA] MOCK_LORA=True. Running in explicit local simulation mode.")
            return

        logger.info(f"[LORA] Starting STRICT HARDWARE mode on {settings.LORA_PORT} ({settings.LORA_BAUD_RATE} baud)...")
        try:
            self.controller = PerchLinkLoRa(
                port=settings.LORA_PORT,
                baud=settings.LORA_BAUD_RATE,
                response_timeout=4.0,
                reconnect_delay=3.0
            )
            self.controller.start()
            self.event_listener_task = asyncio.create_task(self._consume_lora_events())
            logger.info("[LORA] PerchLinkLoRa hardware controller thread started.")
        except Exception as e:
            logger.error(f"[LORA] Hardware initialization failed on {settings.LORA_PORT}: {e}")
            self.hardware_connected = False

    async def _consume_lora_events(self):
        """
        Consume real hardware events from PerchLinkLoRa
        """
        while True:
            try:
                event = await asyncio.to_thread(self.controller.get_event, 0.2)
                if not event:
                    await asyncio.sleep(0.05)
                    continue

                etype = event.get("event")

                if etype == "connected":
                    self.hardware_connected = True
                    logger.info(f"[LORA HW] Physical radio serial connection active on {event.get('port')}")

                elif etype in ("connection_error", "connection_lost"):
                    self.hardware_connected = False
                    logger.warning(f"[LORA HW] Radio serial disconnected: {event.get('error')}")

                elif etype == "sent":
                    logger.info(f"[LORA HW] Broadcasted radio packet: {event.get('command')}")

                elif etype == "sos_result":
                    event_id = event.get("event_id")
                    delivered = event.get("delivered", False)
                    failed = event.get("failed", False)

                    logger.info(f"[LORA HW] Hardware event for {event_id}: delivered={delivered}, failed={failed}")

                    if event_id in self.pending_acks:
                        on_ack, on_operator_ack = self.pending_acks.pop(event_id)
                        if delivered:
                            ack_time = datetime.now(timezone.utc)
                            logger.info(f"[LORA HW] Over-the-air RF_ACK confirmed for {event_id}!")
                            await on_ack(event_id, ack_time)
                        else:
                            logger.warning(f"[LORA HW] Delivery unconfirmed for {event_id}. Keeping record pending.")

                elif etype == "timeout":
                    logger.warning(f"[LORA HW] Timeout: No over-the-air RF_ACK received for {event.get('command')}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[LORA] Error in event consumer: {e}", exc_info=True)
                await asyncio.sleep(0.5)

    async def transmit_packet(self, packet_data: dict, on_ack: Callable, on_operator_ack: Callable):
        """
        Transmit emergency distress packet.
        """
        sos_id = packet_data.get("sos_id")
        lat = packet_data.get("lat") if packet_data.get("lat") is not None else 0.0
        lon = packet_data.get("lon") if packet_data.get("lon") is not None else 0.0
        ts = int(time.time())

        command = f"SOS,{sos_id},{lat:.6f},{lon:.6f},{ts}"

        # 1. STRICT HARDWARE MODE (Production & Real Hardware Testing)
        if not self.is_mock:
            if not self.controller or not self.hardware_connected:
                logger.error(f"[LORA HW] Cannot transmit {sos_id}: Physical LILYGO radio on {settings.LORA_PORT} is not connected!")
                # Strict safety: Do NOT fake an ACK. The request stays pending in SQLite.
                return

            logger.info(f"[LORA HW] Submitting command to radio: {command}")
            self.pending_acks[sos_id] = (on_ack, on_operator_ack)
            self.controller.send_sos_command(command)
            return

        # 2. EXPLICIT MOCK MODE (Only when MOCK_LORA=True in development)
        logger.info(f"[LORA MOCK] Simulating RF propagation for {sos_id} (explicit mock flag enabled)...")
        await asyncio.sleep(4)
        ack_timestamp = datetime.now(timezone.utc)
        await on_ack(sos_id, ack_timestamp)

        await asyncio.sleep(8)
        op_timestamp = datetime.now(timezone.utc)
        await on_operator_ack(sos_id, op_timestamp)

lora_service = LoRaService()
