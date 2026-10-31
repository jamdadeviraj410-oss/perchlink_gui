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
    # Set MOCK_LORA=false when physical LILYGO T3-S3 SX1262 is plugged in
    MOCK_LORA: bool = os.getenv("MOCK_LORA", "true").lower() in ("true", "1", "yes")
    LORA_PORT: str = os.getenv("LORA_PORT", "COM3" if os.name == "nt" else "/dev/ttyUSB0")
    LORA_BAUD_RATE: int = int(os.getenv("LORA_BAUD_RATE", "115200"))
    
    # Network
    DRONE_SSID: str = "PERCHLINK_SOS"
    DRONE_IP: str = "192.168.4.1"

settings = Settings()
