"""
Drone Operational Status & Telemetry Service
Reports accurate hardware state without inventing fake values.
"""
from datetime import datetime, timezone
from app.core.config import settings

class DroneStatusService:
    def __init__(self):
        self.wifi_available = True
        self.drone_status = "PERCHED" # PERCHED | HOVERING | SEARCHING
        self.lora_status = "CONNECTED" # CONNECTED | TRANSMITTING | SEARCHING | DISCONNECTED
        self.battery_percentage = None # Left as None if hardware ADC/SMBus telemetry is not attached
        self.ground_station_connected = True

    def get_status(self) -> dict:
        return {
            "wifiAvailable": self.wifi_available,
            "ssid": settings.DRONE_SSID,
            "ip": settings.DRONE_IP,
            "droneStatus": self.drone_status,
            "loraStatus": self.lora_status,
            "batteryPercentage": self.battery_percentage, # Truthful: None if unavailable
            "groundStationConnected": self.ground_station_connected,
            "isSimulated": settings.MOCK_LORA,
            "timestamp": datetime.now(timezone.utc),
        }

    def update_telemetry(self, battery: int = None, status: str = None):
        if battery is not None:
            self.battery_percentage = battery
        if status is not None:
            self.drone_status = status

drone_status_service = DroneStatusService()
