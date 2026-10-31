"""
LoRa Communication Service
Interfaces with LILYGO T3-S3 SX1262 via USB Serial, with transparent Mock mode for Phase 2.
"""
import asyncio
import logging
from typing import Callable, Optional
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("perchlink.lora")

class LoRaService:
    def __init__(self):
        self.is_mock = settings.MOCK_LORA
        self.serial_conn = None
        self.ack_callback: Optional[Callable] = None
        self.operator_ack_callback: Optional[Callable] = None

    def start(self):
        if self.is_mock:
            logger.warning("[LORA] Running in MOCK SIMULATION MODE. No physical radio attached.")
        else:
            logger.info(f"[LORA] Initializing physical serial port {settings.LORA_PORT} at {settings.LORA_BAUD_RATE} baud...")
            try:
                import serial
                self.serial_conn = serial.Serial(
                    port=settings.LORA_PORT,
                    baudrate=settings.LORA_BAUD_RATE,
                    timeout=1
                )
                logger.info("[LORA] Serial link established with LILYGO SX1262.")
            except Exception as e:
                logger.error(f"[LORA] Failed to open serial port: {e}. Falling back to simulation.")
                self.is_mock = True

    async def transmit_packet(self, packet_data: dict, on_ack: Callable, on_operator_ack: Callable):
        """
        Transmit emergency distress packet over LoRa radio.
        """
        sos_id = packet_data.get("sos_id")
        logger.info(f"[LORA] Broadcasting packet for {sos_id}...")

        if self.is_mock:
            # Simulate realistic radio propagation and ground station receipt
            # Delay 1: SX1262 LoRa transmission + Base Station Radio ACK (~4-6 seconds)
            await asyncio.sleep(4)
            ack_timestamp = datetime.now(timezone.utc)
            logger.info(f"[LORA MOCK] Ground Station received LoRa packet for {sos_id} and returned radio ACK.")
            await on_ack(sos_id, ack_timestamp)

            # Delay 2: Human Rescue Operator reviewing & confirming emergency (~8-12 seconds)
            await asyncio.sleep(8)
            op_timestamp = datetime.now(timezone.utc)
            logger.info(f"[LORA MOCK] Rescue Operator dispatched acknowledgment for {sos_id}.")
            await on_operator_ack(sos_id, op_timestamp)
        else:
            # Phase 5: Transmit over PySerial to ESP32 LILYGO firmware
            if self.serial_conn and self.serial_conn.is_open:
                import json
                payload_str = json.dumps(packet_data) + "\n"
                self.serial_conn.write(payload_str.encode("utf-8"))
                logger.info(f"[LORA HW] Wrote {len(payload_str)} bytes to SX1262 serial buffer.")
            else:
                logger.error("[LORA HW] Serial connection not open!")

lora_service = LoRaService()
