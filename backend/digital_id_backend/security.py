import jwt
from datetime import datetime, timedelta
from typing import Optional
import hashlib

# Secret key to sign the tokens (Keep this secret!)
SECRET_KEY = "SUPER_SECRET_COLLEGE_KEY_2025"
ALGORITHM = "HS256"

def generate_student_token(student_data: dict, device_id: str):
    """
    Generates a 60-second JWT containing student info 
    and a hash of their device to prevent sharing.
    """
    # Create a unique hash for this specific device
    device_hash = hashlib.sha256(device_id.encode()).hexdigest()
    
    payload = {
        "sub": str(student_data["id"]),
        "name": student_data["name"],
        "roll_no": student_data["roll_no"],
        "dept": student_data["dept"],
        "device": device_hash,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=60) # 60s Expiry
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_student_token(token: str):
    """
    Decodes the QR token. If the 60s are up, 
    it will raise an 'ExpiredSignatureError'.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "QR Code Expired. Please refresh."}
    except jwt.InvalidTokenError:
        return {"error": "Invalid QR Code."}