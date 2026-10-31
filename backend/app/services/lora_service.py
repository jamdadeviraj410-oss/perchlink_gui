"""
LoRa Communication Service
Integrates the proven PerchLinkLoRa hardware controller (LILYGO T3-S3 SX1262)
with fallback simulation when physical hardware is not plugged in.
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
            logger.warning("[LORA] Configured for MOCK SIMULATION MODE. Physical radio bypassed.")
            return

        logger.info(f"[LORA] Initializing physical PerchLinkLoRa controller on {settings.LORA_PORT} ({settings.LORA_BAUD_RATE} baud)...")
        try:
            self.controller = PerchLinkLoRa(
                port=settings.LORA_PORT,
                baud=settings.LORA_BAUD_RATE,
                response_timeout=4.0,
                reconnect_delay=3.0
            )
            self.controller.start()

            # Start background event consumer in asyncio loop
            self.event_listener_task = asyncio.create_task(self._consume_lora_events())
            logger.info("[LORA] PerchLinkLoRa serial thread and event consumer started.")
        except Exception as e:
            logger.error(f"[LORA] Could not initialize physical serial port: {e}. Falling back to simulation.")
            self.is_mock = True

    async def _consume_lora_events(self):
        """
        Continuously read events produced by PerchLinkLoRa background worker thread
        """
        while True:
            try:
                # Run blocking get_event in thread pool with small timeout
                event = await asyncio.to_thread(self.controller.get_event, 0.2)
                if not event:
                    await asyncio.sleep(0.05)
                    continue

                etype = event.get("event")

                if etype == "connected":
                    self.hardware_connected = True
                    logger.info(f"[LORA HW] Serial connection active on {event.get('port')}")

                elif etype == "connection_error" or etype == "connection_lost":
                    self.hardware_connected = False
                    logger.warning(f"[LORA HW] Serial disconnected: {event.get('error')}")

                elif etype == "sent":
                    logger.info(f"[LORA HW] Radio packet transmitted: {event.get('command')}")

                elif etype == "sos_result":
                    event_id = event.get("event_id")
                    delivered = event.get("delivered", False)
                    failed = event.get("failed", False)

                    logger.info(f"[LORA HW] SOS Result for {event_id}: delivered={delivered}, failed={failed}")

                    if delivered and event_id in self.pending_acks:
                        on_ack, on_operator_ack = self.pending_acks.pop(event_id)
                        ack_time = datetime.now(timezone.utc)
                        # Ground Station radio ACK confirmed over-the-air!
                        await on_ack(event_id, ack_time)

                        # Operator review confirmation simulation / hook
                        await asyncio.sleep(6)
                        op_time = datetime.now(timezone.utc)
                        await on_operator_ack(event_id, op_time)

                elif etype == "timeout":
                    logger.warning(f"[LORA HW] Radio ACK timed out for command: {event.get('command')}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[LORA] Error in event consumer: {e}", exc_info=True)
                await asyncio.sleep(0.5)

    async def transmit_packet(self, packet_data: dict, on_ack: Callable, on_operator_ack: Callable):
        """
        Transmit emergency distress packet over LoRa radio
        Format expected by PerchLink_Drone_V1.ino:
        SOS,event_id,latitude,longitude,timestamp
        """
        sos_id = packet_data.get("sos_id")
        lat = packet_data.get("lat") if packet_data.get("lat") is not None else 0.0
        lon = packet_data.get("lon") if packet_data.get("lon") is not None else 0.0
        ts = int(time.time())

        command = f"SOS,{sos_id},{lat:.6f},{lon:.6f},{ts}"

        # If hardware controller is active and serial is connected:
        if not self.is_mock and self.controller and self.hardware_connected:
            logger.info(f"[LORA HW] Dispatching command to LILYGO SX1262: {command}")
            self.pending_acks[sos_id] = (on_ack, on_operator_ack)
            try:
                self.controller.send_sos_command(command)
                return
            except Exception as e:
                logger.error(f"[LORA HW] Failed to queue command: {e}. Falling back to simulation.")

        # Fallback Simulation if hardware is not connected or in mock mode
        logger.info(f"[LORA SIMULATION] Simulating RF propagation for {sos_id}...")
        await asyncio.sleep(4)
        ack_timestamp = datetime.now(timezone.utc)
        logger.info(f"[LORA SIMULATION] Ground Station returned simulated RF_ACK for {sos_id}.")
        await on_ack(sos_id, ack_timestamp)

        await asyncio.sleep(8)
        op_timestamp = datetime.now(timezone.utc)
        logger.info(f"[LORA SIMULATION] Rescue Operator dispatched simulated acknowledgment for {sos_id}.")
        await on_operator_ack(sos_id, op_timestamp)

lora_service = LoRaService()
