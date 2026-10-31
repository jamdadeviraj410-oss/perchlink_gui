"""
PerchLink Backend Configuration Settings
Core principles: Local-first, lightweight for Raspberry Pi 4B, offline-ready.
"""
import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "PerchLink Emergency SOS Relay"
    APP_VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./perchlink.db")
    
    # Hardware / Serial configuration
    # LILYGO T3-S3 SX1262: COM4 on Windows, /dev/ttyACM0 on Raspberry Pi 4B
    MOCK_LORA: bool = os.getenv("MOCK_LORA", "false").lower() in ("true", "1", "yes")
    LORA_PORT: str = os.getenv("LORA_PORT", "COM4" if os.name == "nt" else "/dev/ttyACM0")
    LORA_BAUD_RATE: int = int(os.getenv("LORA_BAUD_RATE", "115200"))
    
    # Drone Flight Controller MAVLink (Optional telemetry)
    MAVLINK_CONNECTION: str = os.getenv("MAVLINK_CONNECTION", "/dev/ttyAMA0" if os.name != "nt" else "udp:127.0.0.1:14550")
    MAVLINK_BAUD: int = int(os.getenv("MAVLINK_BAUD", "57600"))

    # Network
    DRONE_SSID: str = "PERCHLINK_SOS"
    DRONE_IP: str = "192.168.4.1"

settings = Settings()
