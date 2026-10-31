"""
Pydantic Schemas for Drone Telemetry and Health Status
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DroneStatusResponse(BaseModel):
    wifiAvailable: bool
    ssid: str
    ip: str
    droneStatus: str # PERCHED | HOVERING | SEARCHING | UNKNOWN
    loraStatus: str  # CONNECTED | TRANSMITTING | SEARCHING | DISCONNECTED
    batteryPercentage: Optional[int] = None # null if hardware telemetry unavailable
    groundStationConnected: bool
    isSimulated: bool
    timestamp: datetime

class HealthResponse(BaseModel):
    status: str
    version: str
    uptimeSeconds: float
    timestamp: datetime
    databaseOk: bool
