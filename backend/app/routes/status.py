"""
Drone Status & Telemetry Endpoints
"""
from fastapi import APIRouter
from app.schemas.status import DroneStatusResponse
from app.services.drone_status import drone_status_service

router = APIRouter(prefix="/drone", tags=["Drone"])

@router.get("/status", response_model=DroneStatusResponse)
def get_drone_status():
    """
    Returns live drone operational parameters, link health, and battery if available.
    """
    return drone_status_service.get_status()
