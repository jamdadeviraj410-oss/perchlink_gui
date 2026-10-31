"""
SOS Emergency Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.sos import SOSCreateRequest, SOSUpdateRequest, SOSResponse
from app.services.sos_manager import sos_manager
from app.core.config import settings

router = APIRouter(prefix="/sos", tags=["SOS"])

@router.post("", response_model=SOSResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_sos(request: SOSCreateRequest, db: Session = Depends(get_db)):
    """
    Submit a new emergency SOS distress beacon.
    Persists immediately in SQLite on Raspberry Pi.
    """
    record = await sos_manager.create_sos(db, request)
    return sos_manager.format_response(record, is_simulated=settings.MOCK_LORA)

@router.get("/{sos_id}", response_model=SOSResponse)
def get_emergency_sos(sos_id: str, db: Session = Depends(get_db)):
    """
    Retrieve emergency case details and truthful delivery state.
    """
    record = sos_manager.get_sos(db, sos_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency case {sos_id} not found on drone storage."
        )
    return sos_manager.format_response(record, is_simulated=settings.MOCK_LORA)

@router.post("/{sos_id}/update", response_model=SOSResponse)
async def update_emergency_sos(
    sos_id: str,
    request: SOSUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Attach supplemental details to an ongoing emergency record.
    """
    record = await sos_manager.add_update_message(db, sos_id, request)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency case {sos_id} not found."
        )
    return sos_manager.format_response(record, is_simulated=settings.MOCK_LORA)
