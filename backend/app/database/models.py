"""
SQLAlchemy Models for Persistent Emergency Records
"""
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class SOSRecord(Base):
    __tablename__ = "sos_records"

    # Unique SOS identifier e.g. SOS-1024
    id = Column(String(32), primary_key=True, index=True)
    emergency_type = Column(String(50), nullable=False)
    people_count = Column(Integer, default=1)
    
    # Coordinates (nullable if survivor couldn't acquire GPS fix)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    
    # Manual landmark / floor description
    landmark = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    # Truthful Delivery Pipeline States
    drone_received = Column(Boolean, default=True, nullable=False)
    drone_received_at = Column(DateTime, default=utc_now, nullable=False)
    
    # Transmission status: PENDING, TRANSMITTING, ACKNOWLEDGED, FAILED
    transmission_status = Column(String(50), default="PENDING", nullable=False)
    
    # Ground station LoRa radio packet ACK
    ground_station_acknowledged = Column(Boolean, default=False, nullable=False)
    ground_station_acknowledged_at = Column(DateTime, nullable=True)
    
    # Human rescue coordinator confirmation
    rescue_team_acknowledged = Column(Boolean, default=False, nullable=False)
    rescue_team_acknowledged_at = Column(DateTime, nullable=True)
    
    # Supplemental updates
    updates = relationship("SOSUpdateMessage", back_populates="sos", cascade="all, delete-orphan", order_by="SOSUpdateMessage.created_at")


class SOSUpdateMessage(Base):
    __tablename__ = "sos_update_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sos_id = Column(String(32), ForeignKey("sos_records.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    sos = relationship("SOSRecord", back_populates="updates")
