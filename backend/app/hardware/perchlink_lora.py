
"""
PerchLink LoRa Controller
Raspberry Pi 4B <-> LILYGO T3-S3 SX1262

Version 1.0
- Background serial worker
- Non-blocking command submission
- PING / STATUS / SOS commands
- Serial reconnection
- Event queue for responses
"""
import json
import uuid
from datetime import datetime, timezone

import time
import threading
import queue
import itertools

import serial


class PerchLinkLoRa:

    def __init__(
        self,
        port="/dev/ttyACM0",
        baud=115200,
        response_timeout=3.0,
        reconnect_delay=2.0
    ):
        self.port = port
        self.baud = baud
        self.response_timeout = response_timeout
        self.reconnect_delay = reconnect_delay

        self.command_queue = queue.Queue()
        self.event_queue = queue.Queue()

        self.running = False
        self.connected = False

        self.worker = None
        self.command_ids = itertools.count(1)

    # ----------------------------------
    # Start background worker
    # ----------------------------------

    def start(self):

        if self.running:
            return

        self.running = True

        self.worker = threading.Thread(
            target=self._serial_worker,
            daemon=True
        )

        self.worker.start()

    # ----------------------------------
    # Submit commands without blocking
    # ----------------------------------

    def send_command(self, command):

        command = command.strip()

        allowed = {"PING", "STATUS"}

        if command not in allowed:
            raise ValueError(
                "Allowed commands: PING, STATUS. "
                "Use send_sos() for SOS messages."
            )

        command_id = next(self.command_ids)

        self.command_queue.put(
            (command_id, command, time.monotonic())
        )

        self._event(
            "queued",
            command_id=command_id,
            command=command
        )

        return command_id

    def send_sos(self, message):

        message = message.strip()

        if not message:
            raise ValueError("SOS message cannot be empty")

        if "\n" in message or "\r" in message:
            raise ValueError("SOS message cannot contain newlines")

        if len(message) > 150:
            raise ValueError("SOS message too long")

        command_id = next(self.command_ids)

        command = "SOS " + message

        self.command_queue.put(
            (command_id, command, time.monotonic())
        )

        self._event(
            "queued",
            command_id=command_id,
            command="SOS",
            message=message
        )

        return command_id

    def send_sos_payload(self, payload):
        """
        Queue a structured SOS JSON message.
        RF transmission remains controlled by firmware.
        """
        required = {
            "device_id",
            "event_id",
            "event_type",
            "timestamp",
            "latitude",
            "longitude"
        }

        if not isinstance(payload, dict):
            raise TypeError("SOS payload must be a dictionary")

        if not required.issubset(payload):
            raise ValueError("SOS payload is missing required fields")

        encoded = json.dumps(payload, separators=(",", ":"))

        if len(encoded) > 150:
            raise ValueError("Structured SOS payload exceeds 150 characters")

        command_id = next(self.command_ids)
        command = "SOS " + encoded

        self.command_queue.put(
            (command_id, command, time.monotonic())
        )

        self._event(
            "queued",
            command_id=command_id,
            command="SOS",
            payload=payload
        )

        return command_id

    def send_sos_command(self, command):
        """
        Queue the exact comma-separated command expected by
        PerchLink Drone V1 firmware:

        SOS,event_id,latitude,longitude,timestamp
        """
        parts = command.strip().split(",")

        if len(parts) != 5 or parts[0] != "SOS":
            raise ValueError("Expected SOS,event_id,latitude,longitude,timestamp")

        event_id = parts[1]

        if not event_id or not event_id.replace("_", "").isalnum():
            raise ValueError("Invalid SOS event ID")

        try:
            latitude = float(parts[2])
            longitude = float(parts[3])
            timestamp = int(parts[4])
        except ValueError:
            raise ValueError("Invalid SOS coordinates or timestamp")

        if not -90 <= latitude <= 90:
            raise ValueError("Latitude out of range")

        if not -180 <= longitude <= 180:
            raise ValueError("Longitude out of range")

        if timestamp <= 0:
            raise ValueError("Invalid timestamp")

        command_id = next(self.command_ids)

        self.command_queue.put(
            (command_id, command.strip(), time.monotonic())
        )

        self._event(
            "queued",
            command_id=command_id,
            command="SOS",
            event_id=event_id
        )

        return command_id

    def _event(self, event_type, **details):

        self.event_queue.put({
            "event": event_type,
            "time": time.time(),
            **details
        })

    def get_event(self, timeout=0):

        try:
            return self.event_queue.get(timeout=timeout)

        except queue.Empty:
            return None

    # ----------------------------------
    # Serial worker
    # ----------------------------------

    def _serial_worker(self):

        ser = None

        while self.running:

            # Connect or reconnect
            if ser is None:

                try:
                    ser = serial.Serial(
                        self.port,
                        self.baud,
                        timeout=0.2,
                        write_timeout=2
                    )

                    time.sleep(1)

                    ser.reset_input_buffer()
                    ser.reset_output_buffer()

                    self.connected = True

                    self._event(
                        "connected",
                        port=self.port
                    )

                except serial.SerialException as error:

                    self.connected = False

                    self._event(
                        "connection_error",
                        error=str(error)
                    )

                    time.sleep(self.reconnect_delay)
                    continue

            try:

                try:
                    command_id, command, created = (
                        self.command_queue.get(timeout=0.1)
                    )

                except queue.Empty:
                    continue

                # Never transmit an old queued command after reconnect.
                if time.monotonic() - created > 10:
                    self._event(
                        "expired",
                        command_id=command_id,
                        command=command
                    )
                    continue

                ser.write((command + "\n").encode("utf-8"))
                ser.flush()

                self._event(
                    "sent",
                    command_id=command_id,
                    command=command
                )

                # Read responses. SOS commands must wait for the
                # matching RF_ACK, not merely the first status line.
                is_sos = command.startswith("SOS,")
                expected_event_id = command.split(",")[1] if is_sos else None

                wait_time = max(self.response_timeout, 18.0) if is_sos else self.response_timeout
                deadline = time.monotonic() + wait_time
                got_response = False
                acknowledged = False
                delivery_failed = False

                while self.running and time.monotonic() < deadline:

                    line = ser.readline().decode(
                        "utf-8",
                        errors="replace"
                    ).strip()

                    if not line:
                        continue

                    got_response = True

                    self._event(
                        "response",
                        command_id=command_id,
                        command=command,
                        response=line,
                        acknowledged=(
                            line == f"RF_ACK:{expected_event_id}"
                            if is_sos else line.startswith("ACK:")
                        )
                    )

                    if is_sos:
                        if line == f"RF_ACK:{expected_event_id}":
                            acknowledged = True
                            break

                        if line.startswith("DELIVERY_FAILED"):
                            delivery_failed = True
                            break

                    else:
                        break

                if is_sos:
                    self._event(
                        "sos_result",
                        command_id=command_id,
                        event_id=expected_event_id,
                        delivered=acknowledged,
                        failed=delivery_failed
                    )

                if not got_response:
                    self._event(
                        "timeout",
                        command_id=command_id,
                        command=command
                    )

                elif is_sos and not acknowledged and not delivery_failed:
                    self._event(
                        "timeout",
                        command_id=command_id,
                        command=command,
                        reason="Matching RF acknowledgement not received"
                    )

            except (
                serial.SerialException,
                OSError
            ) as error:

                self.connected = False

                self._event(
                    "connection_lost",
                    error=str(error)
                )

                try:
                    ser.close()
                except Exception:
                    pass

                ser = None

        if ser is not None:
            try:
                ser.close()
            except Exception:
                pass

        self.connected = False

        self._event("stopped")

    # ----------------------------------
    # Stop controller
    # ----------------------------------

    def stop(self):

        self.running = False

        if self.worker is not None:
            self.worker.join(timeout=3)

        self.worker = None


# ======================================
# Standalone testing
# ======================================

if __name__ == "__main__":

    lora = PerchLinkLoRa()

    print("Starting PerchLink LoRa controller...")

    lora.start()

    try:

        time.sleep(2)

        lora.send_command("PING")
        lora.send_command("STATUS")
        lora.send_sos("SOS TEST")

        print("Commands queued. Waiting for events...")

        while True:

            event = lora.get_event(timeout=1)

            if event:
                print(event)

    except KeyboardInterrupt:
        print("\nStopping controller...")

    finally:
        lora.stop()
