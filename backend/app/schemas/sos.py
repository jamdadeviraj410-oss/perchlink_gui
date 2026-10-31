"""
Pydantic Schemas for SOS validation and serialization
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class LocationSchema(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy: Optional[float] = Field(None, ge=0.0)

class SOSCreateRequest(BaseModel):
    emergencyType: str = Field(..., min_length=2, max_length=50)
    peopleCount: int = Field(1, ge=1, le=500)
    location: Optional[LocationSchema] = None
    landmark: Optional[str] = Field(None, max_length=255)
    message: Optional[str] = Field(None, max_length=1000)

class SOSUpdateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)

class SOSUpdateMessageOut(BaseModel):
    id: int
    text: str
    createdAt: datetime

    class Config:
        from_attributes = True

class SOSResponse(BaseModel):
    id: str
    emergencyType: str
    peopleCount: int
    location: Optional[LocationSchema] = None
    landmark: Optional[str] = None
    message: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    droneReceived: bool
    droneReceivedAt: datetime
    status: str
    transmittingLoRa: bool
    groundStationAcknowledged: bool
    groundStationAcknowledgedAt: Optional[datetime] = None
    rescueTeamAcknowledged: bool
    rescueTeamAcknowledgedAt: Optional[datetime] = None
    additionalMessages: List[SOSUpdateMessageOut] = []
    isSimulated: bool = False

    class Config:
        from_attributes = True
