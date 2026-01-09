import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from .database import Base

class Student(Base):
    __tablename__ = "students"

    # SQLite uses String(36) to store UUIDs as text
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    apaar_id = Column(String(50), unique=True, index=True) # Feature 8
    roll_no = Column(String(20), unique=True, index=True)
    name = Column(String(100))
    dept = Column(String(50))
    photo_b64 = Column(Text) # For instant verification (Feature 2)
    
    # ID Status Tracking (Feature 3)
    physical_id_status = Column(String(20), default="active") # active|lost|disabled
    is_suspended = Column(Boolean, default=False)
    
    # Wallet (Feature 8)
    wallet_balance = Column(Numeric(10, 2), default=0.00)
    email = Column(String(100), unique=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TokenLog(Base):
    """Tracks the 60s Dynamic JWTs (Feature 1)"""
    __tablename__ = "tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id"))
    device_hash = Column(String(128)) # Feature 7 (Misuse detection)
    expires_at = Column(DateTime)
    is_used = Column(Boolean, default=False)

class ScanLog(Base):
    """Logs every time an ID is scanned (Feature 4 & 7)"""
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id"))
    staff_id = Column(String(50))
    location = Column(String(100))
    status = Column(String(20)) # valid|invalid|expired
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# 🆕 TABLE: Track Wallet Recharges & Purchases
class WalletTransaction(Base):
    """Records every money top-up and purchase for audit purposes"""
    __tablename__ = "wallet_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_roll = Column(String(20)) # Storing roll_no for easier lookup
    amount = Column(Numeric(10, 2))
    transaction_type = Column(String(20), default="CREDIT") # CREDIT (Recharge) or DEBIT (Purchase)
    reason = Column(String(255), default="Campus Payment")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())