from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, database
import uuid
import time
from datetime import datetime
from typing import Optional

router = APIRouter()

# --- 🟢 FEATURE 4: GENERATE DYNAMIC QR TOKEN ---
@router.get("/generate-qr/{roll_no}")
async def generate_student_qr(roll_no: str, db: Session = Depends(database.get_db)):
    clean_roll = roll_no.strip().upper()
    student = db.query(models.Student).filter(models.Student.roll_no == clean_roll).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.is_suspended:
        raise HTTPException(status_code=403, detail="ACCOUNT SUSPENDED")

    token = f"LENS_{clean_roll}_{uuid.uuid4().hex[:8]}_{int(time.time())}"
    return {
        "token": token, 
        "student_name": student.name, 
        "dept": student.dept,
        "photo": student.photo_b64,
        "status": student.physical_id_status.upper()
    }

# --- 🟡 FEATURE 9: GET WALLET BALANCE ---
@router.get("/wallet/{roll_no}")
async def get_wallet_balance(roll_no: str, db: Session = Depends(database.get_db)):
    clean_roll = roll_no.strip().upper()
    student = db.query(models.Student).filter(models.Student.roll_no == clean_roll).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {
        "roll_no": student.roll_no,
        "balance": float(student.wallet_balance),
        "currency": "INR"
    }

# --- 🟢 FEATURE 5: VERIFY QR CODE ---
@router.post("/verify-qr")
async def verify_student_qr(token: str = Form(...), db: Session = Depends(database.get_db)):
    try:
        if not token.startswith("LENS_"):
            raise HTTPException(status_code=400, detail="Invalid QR Format")

        parts = token.split("_")
        if len(parts) < 4:
             raise HTTPException(status_code=400, detail="Invalid QR Structure")
             
        roll_no = parts[1]
        timestamp = int(parts[3])
        
        # 60 second expiry
        if int(time.time()) - timestamp > 60:
            raise HTTPException(status_code=400, detail="QR Code Expired")

        student = db.query(models.Student).filter(models.Student.roll_no == roll_no).first()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")
        
        if student.is_suspended:
            raise HTTPException(status_code=403, detail="ACCESS DENIED: Student is Suspended")

        return {
            "valid": True,
            "student": {
                "name": student.name,
                "roll_no": student.roll_no,
                "dept": student.dept,
                "photo": student.photo_b64,
                "status": student.physical_id_status.upper()
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail="Verification Failed")

# --- 🟠 FEATURE 8: WALLET REWARD / TOP-UP (BY ROLL NO) ---
@router.post("/admin/wallet-topup")
async def admin_topup(
    roll_no: str = Form(...), 
    amount: float = Form(...), 
    db: Session = Depends(database.get_db)
):
    clean_roll = roll_no.strip().upper()
    student = db.query(models.Student).filter(models.Student.roll_no == clean_roll).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.wallet_balance = float(student.wallet_balance) + amount

    new_tx = models.WalletTransaction(
        student_roll=clean_roll,
        amount=amount,
        transaction_type="CREDIT",
        reason="Admin Manual Topup"
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(student)
    
    return {"new_balance": float(student.wallet_balance), "roll_no": clean_roll}

# --- 🎁 NEW: ACADEMIC REWARD BRIDGE (BY EMAIL) ---
@router.post("/admin/credit-wallet")
async def credit_wallet_by_email(
    email: str = Form(...), 
    amount: float = Form(...), 
    reason: str = Form(...),
    db: Session = Depends(database.get_db)
):
    """Credits wallet based on email (Used by AI Quiz Portal)"""
    # Assuming email is stored in the Student model or matches a roll no logic
    # In this logic, we lookup by email. If your model uses roll_no, we find student by email.
    student = db.query(models.Student).filter(models.Student.email == email).first()
    
    if not student:
        # Fallback: if email is not found, try to extract roll from email (e.g. 22cse01@sns.edu)
        potential_roll = email.split('@')[0].upper()
        student = db.query(models.Student).filter(models.Student.roll_no == potential_roll).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student account not linked to wallet")

    student.wallet_balance = float(student.wallet_balance) + amount

    new_tx = models.WalletTransaction(
        student_roll=student.roll_no,
        amount=amount,
        transaction_type="CREDIT",
        reason=reason
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(student)
    
    return {"status": "SUCCESS", "reward": amount, "new_balance": float(student.wallet_balance)}

# --- 🔵 FEATURE 6: ADMIN CONTROL PANEL ---
@router.post("/admin/update-status")
async def update_student_status(
    roll_no: str = Form(...), 
    new_status: str = Form(...), 
    db: Session = Depends(database.get_db)
):
    clean_roll = roll_no.strip().upper()
    student = db.query(models.Student).filter(models.Student.roll_no == clean_roll).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.physical_id_status = new_status.upper()
    student.is_suspended = (new_status.upper() == "SUSPENDED")
        
    db.commit()
    db.refresh(student)
    return {"message": f"SUCCESS: {clean_roll} is now {new_status}"}

# --- 🟣 FEATURE 7: AUDIT LOGS ---
@router.get("/admin/audit-logs")
async def get_audit_logs(db: Session = Depends(database.get_db)):
    logs = db.query(models.ScanLog).order_by(models.ScanLog.timestamp.desc()).limit(50).all()
    return logs

# --- 💸 WALLET TRANSACTION LOGS ---
@router.get("/admin/wallet-logs")
async def get_wallet_logs(db: Session = Depends(database.get_db)):
    logs = db.query(models.WalletTransaction).order_by(models.WalletTransaction.timestamp.desc()).limit(20).all()
    return logs

@router.get("/wallet-logs/{roll_no}")
async def get_student_wallet_logs(roll_no: str, db: Session = Depends(database.get_db)):
    clean_roll = roll_no.strip().upper()
    logs = db.query(models.WalletTransaction).filter(models.WalletTransaction.student_roll == clean_roll).order_by(models.WalletTransaction.timestamp.desc()).limit(10).all()
    return logs

# --- 🔍 STUDENT LOOKUP ---
@router.get("/admin/search-student/{roll_no}")
async def search_student(roll_no: str, db: Session = Depends(database.get_db)):
    student = db.query(models.Student).filter(models.Student.roll_no == roll_no.strip().upper()).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "name": student.name,
        "roll_no": student.roll_no,
        "dept": student.dept,
        "balance": float(student.wallet_balance),
        "status": student.physical_id_status,
        "photo": student.photo_b64
    }

# --- 📊 COLLECTION STATS ---
@router.get("/admin/collection-stats")
async def get_collection_stats(db: Session = Depends(database.get_db)):
    today = datetime.now().date()
    total = db.query(func.sum(models.WalletTransaction.amount)).filter(
        func.date(models.WalletTransaction.timestamp) == today,
        models.WalletTransaction.transaction_type == "CREDIT"
    ).scalar() or 0
    return {"total_today": float(total)}

# --- 📊 VENDOR SALES STATS ---
@router.get("/vendor/sales-stats")
async def get_vendor_stats(db: Session = Depends(database.get_db)):
    today = datetime.now().date()
    total = db.query(func.sum(models.WalletTransaction.amount)).filter(
        func.date(models.WalletTransaction.timestamp) == today,
        models.WalletTransaction.transaction_type == "DEBIT"
    ).scalar() or 0
    return {"total_sales_today": float(total)}

# --- 🛒 NEW: CANTEEN PURCHASE (DEBIT) ---
@router.post("/vendor/purchase")
async def process_purchase(
    token: str = Form(...), 
    amount: float = Form(...), 
    db: Session = Depends(database.get_db)
):
    """Deducts money from student wallet after scanning QR"""
    if not token.startswith("LENS_"):
        raise HTTPException(status_code=400, detail="Invalid QR")
    
    parts = token.split("_")
    if len(parts) < 4:
        raise HTTPException(status_code=400, detail="Broken Token")
        
    roll_no = parts[1]
    timestamp = int(parts[3])

    # Expiry Check
    if int(time.time()) - timestamp > 60:
        raise HTTPException(status_code=400, detail="QR Expired! Refresh ID.")

    student = db.query(models.Student).filter(models.Student.roll_no == roll_no).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student.is_suspended:
        raise HTTPException(status_code=403, detail="ID SUSPENDED")

    if float(student.wallet_balance) < amount:
        raise HTTPException(status_code=400, detail="Insufficient Balance")

    student.wallet_balance = float(student.wallet_balance) - amount

    new_tx = models.WalletTransaction(
        student_roll=roll_no,
        amount=amount,
        transaction_type="DEBIT",
        reason="Canteen Purchase"
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(student)

    return {
        "status": "SUCCESS",
        "remaining_balance": float(student.wallet_balance),
        "student_name": student.name
    }