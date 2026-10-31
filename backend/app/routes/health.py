"""
Backend System Health Endpoint
"""
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.database import get_db
from app.schemas.status import HealthResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])
START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "uptimeSeconds": round(time.time() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc),
        "databaseOk": db_ok,
    }
