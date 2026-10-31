"""
PerchLink MAVLink GPS interface.

Supports:
- ArduPilot USB serial connection
- GPS fix and satellite validation
- Stale-data protection
- Simulated GPS testing without an FC

Simulation never represents a real GPS fix.
"""

import argparse
import time
from dataclasses import dataclass, asdict

from pymavlink import mavutil


@dataclass
class GPSData:
    latitude: float
    longitude: float
    altitude_m: float
    fix_type: int
    satellites: int
    timestamp: float
    source: str

    @property
    def age_seconds(self):
        return max(0.0, time.monotonic() - self.timestamp)

    @property
    def valid(self):
        return (
            self.fix_type >= 3
            and self.satellites >= 4
            and self.age_seconds <= 3.0
            and -90 <= self.latitude <= 90
            and -180 <= self.longitude <= 180
            and not (
                self.latitude == 0.0
                and self.longitude == 0.0
            )
        )


class PerchLinkGPS:

    def __init__(self, device=None, baud=115200, stale_after=3.0):
        self.device = device
        self.baud = baud
        self.stale_after = stale_after
        self.connection = None
        self.latest = None

    def connect(self):
        if not self.device:
            raise ValueError(
                "Specify the FC serial device, e.g. /dev/ttyACM1"
            )

        print(f"Connecting to FC: {self.device}")

        self.connection = mavutil.mavlink_connection(
            self.device,
            baud=self.baud,
            autoreconnect=True
        )

        heartbeat = self.connection.wait_heartbeat(timeout=15)

        if heartbeat is None:
            raise TimeoutError("No MAVLink heartbeat received")

        print(
            "FC connected:",
            f"system={self.connection.target_system}",
            f"component={self.connection.target_component}"
        )

    def read(self, timeout=1.0):
        if self.connection is None:
            raise RuntimeError("FC is not connected")

        deadline = time.monotonic() + timeout

        while time.monotonic() < deadline:
            msg = self.connection.recv_match(
                type="GPS_RAW_INT",
                blocking=True,
                timeout=0.5
            )

            if msg is None:
                continue

            now = time.monotonic()

            if msg.get_type() == "GPS_RAW_INT":
                self.latest = GPSData(
                    latitude=msg.lat / 1e7,
                    longitude=msg.lon / 1e7,
                    altitude_m=msg.alt / 1000.0,
                    fix_type=msg.fix_type,
                    satellites=msg.satellites_visible,
                    timestamp=now,
                    source="GPS_RAW_INT"
                )

            elif msg.get_type() == "GLOBAL_POSITION_INT":
                if self.latest is None:
                    continue

                self.latest = GPSData(
                    latitude=msg.lat / 1e7,
                    longitude=msg.lon / 1e7,
                    altitude_m=msg.relative_alt / 1000.0,
                    fix_type=self.latest.fix_type,
                    satellites=self.latest.satellites,
                    timestamp=now,
                    source="GLOBAL_POSITION_INT"
                )

            if self.latest and self.latest.valid:
                return self.latest

        return None

    def close(self):
        if self.connection:
            self.connection.close()
            self.connection = None


def simulate():
    """Test the GPS data interface without transmitting anything."""

    gps = GPSData(
        latitude=19.0760,
        longitude=72.8777,
        altitude_m=25.0,
        fix_type=3,
        satellites=12,
        timestamp=time.monotonic(),
        source="SIMULATED"
    )

    print("SIMULATION MODE — NOT REAL GPS")
    print(asdict(gps))
    print("GPS VALID:", gps.valid)
    print("SOS TRANSMISSION: DISABLED")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--device", default=None)
    parser.add_argument("--baud", type=int, default=115200)
    args = parser.parse_args()

    if args.simulate:
        simulate()
        return

    gps = PerchLinkGPS(args.device, args.baud)

    try:
        gps.connect()

        while True:
            data = gps.read()

            if data:
                print(asdict(data))
                print("GPS VALID:", data.valid)
            else:
                print("GPS UNAVAILABLE — DO NOT SEND SOS")

    except KeyboardInterrupt:
        print("\nStopping GPS reader")

    finally:
        gps.close()


if __name__ == "__main__":
    main()
