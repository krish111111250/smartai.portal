# app.py - Facial Attendance Backend (SECURE & PERSISTENT VERSION)

import face_recognition
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import tempfile 
import time 

# --- Configuration ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 

DATA_DIR = 'face_data'
DB_FILE = os.path.join(DATA_DIR, 'face_db.pkl')
DEBUG_DIR = 'debug_images'

FACE_DB = {}

# --- Database Management ---

def load_face_db():
    """Loads the database and performs a 'self-repair' on records."""
    global FACE_DB
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(DEBUG_DIR, exist_ok=True) 
    
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'rb') as f:
                FACE_DB = pickle.load(f)
            
            # 🛠️ AUTO-REPAIR: Ensure all existing users have the log key
            repaired = False
            for user_id in FACE_DB:
                if 'attendance_log' not in FACE_DB[user_id]:
                    FACE_DB[user_id]['attendance_log'] = []
                    repaired = True
            
            if repaired:
                print("🔧 DB REPAIR: Added missing attendance_log keys to old records.")
                save_face_db()

            print(f"INFO: Successfully loaded Face DB. Users enrolled: {len(FACE_DB)}")
        except Exception as e:
            print(f"ERROR: Database corruption or load error: {e}")
            FACE_DB = {}
    else:
        print("INFO: Initializing new database.")
        FACE_DB = {}

def save_face_db():
    """Atomic save to prevent database corruption."""
    try:
        fd, temp_path = tempfile.mkstemp(dir=DATA_DIR)
        with os.fdopen(fd, 'wb') as tmp:
            pickle.dump(FACE_DB, tmp)
        os.replace(temp_path, DB_FILE)
    except Exception as e:
        print(f"ERROR: Failed to save database: {e}")

load_face_db()

# --- Utility Functions ---

def get_face_encodings(image_file):
    """Reliably extracts face encodings with high-precision settings."""
    try:
        image_file.seek(0)
        # Load and ensure RGB format (some webcams send weird formats)
        image = face_recognition.load_image_file(image_file)
        
        # 🛡️ IMPROVED ACCURACY: num_jitters=2 does 2 rounds of processing for better stability
        # model='large' is more accurate but slightly slower.
        encodings = face_recognition.face_encodings(image, num_jitters=2, model='large')
        
        image_file.seek(0)
        return encodings
    except Exception as e:
        print(f"ERROR: Biometric processing error: {e}")
        return []

# --- API Routes ---

@app.route('/enroll', methods=['POST'])
def enroll_face():
    if 'image' not in request.files or 'name' not in request.form or 'email' not in request.form:
        return jsonify({"success": False, "message": "Missing image, name, or email."}), 400

    image_file = request.files['image']
    name = request.form['name'].strip()
    email = request.form['email'].strip().lower()
    
    if not name or not email:
        return jsonify({"success": False, "message": "Name and Email are required."}), 400

    # 📸 SAVE IMAGE IMMEDIATELY (AUDIT TRAIL)
    timestamp = int(time.time())
    save_path = os.path.join(DEBUG_DIR, f"{name}_{timestamp}_ENROLL_ATTEMPT.jpg")
    try:
        image_file.seek(0)
        image_file.save(save_path)
        image_file.seek(0)
    except Exception as e:
        print(f"Warning: Failed to save debug image: {e}")

    encodings = get_face_encodings(image_file)
    
    if not encodings:
        return jsonify({"success": False, "message": "No face detected. Please ensure your face is clearly visible."}), 400
    
    # 🕵️ SECURITY: Reject if more than one face is in view
    if len(encodings) > 1:
        return jsonify({"success": False, "message": "Multiple faces detected. Please ensure only you are in the frame."}), 400

    new_encoding = encodings[0]

    # 1. Check if Name (RollNo) exists
    if name in FACE_DB:
        return jsonify({"success": False, "message": f"User ID '{name}' is already enrolled."}), 409

    # 2. Check if Email exists (One Email per Face)
    for user_id, data in FACE_DB.items():
        if data.get('email') == email:
             return jsonify({"success": False, "message": f"Email '{email}' is already linked to User ID '{user_id}'."}), 409

    # 3. Check if Face already exists (Global Uniqueness Check)
    all_encodings = [d['encoding'] for d in FACE_DB.values()]
    if all_encodings:
        matches = face_recognition.compare_faces(all_encodings, new_encoding, tolerance=0.5)
        if True in matches:
            match_index = matches.index(True)
            matched_name = list(FACE_DB.keys())[match_index]
            return jsonify({"success": False, "message": f"SCAN REJECTED: This face is already enrolled under '{matched_name}'."}), 409

    # 4. Store and Save
    FACE_DB[name] = {
        'encoding': new_encoding,
        'name': name,
        'email': email,
        'attendance_log': []
    }
    save_face_db()
    
    try:
        os.rename(save_path, os.path.join(DEBUG_DIR, f"{name}_{timestamp}_ENROLL_SUCCESS.jpg"))
    except: pass

    return jsonify({"success": True, "message": f"User '{name}' enrolled successfully!"})

@app.route('/attendance', methods=['POST'])
def take_attendance():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No image provided."}), 400
    
    if 'name' not in request.form or 'email' not in request.form:
         return jsonify({"success": False, "message": "Security Error: User ID or Email missing."}), 400

    image_file = request.files['image']
    claimed_name = request.form['name'].strip()
    claimed_email = request.form['email'].strip().lower()
    timestamp = int(time.time())

    # 📸 SAVE IMAGE IMMEDIATELY
    save_path = os.path.join(DEBUG_DIR, f"{claimed_name}_{timestamp}_SCAN_ATTEMPT.jpg")
    try:
        image_file.seek(0)
        image_file.save(save_path)
        image_file.seek(0)
    except Exception as e:
        print(f"Warning: Failed to save debug image: {e}")
    
    if claimed_name not in FACE_DB:
         return jsonify({"success": False, "message": f"User '{claimed_name}' not enrolled."}), 404
         
    # 🔒 SECURITY: Verify Email Matches ID
    registered_email = FACE_DB[claimed_name].get('email')
    if registered_email and registered_email != claimed_email:
        return jsonify({"success": False, "message": f"Security Alert: Email mismatch for ID '{claimed_name}'."}), 403

    test_encodings = get_face_encodings(image_file)
    
    if not test_encodings:
        return jsonify({"success": False, "message": "No face found. Please face the camera directly."}), 400

    # 🕵️ SECURITY: Reject if more than one person is in the shot
    if len(test_encodings) > 1:
        return jsonify({"success": False, "message": "SCAN REJECTED: Multiple faces detected. Use single-person view."}), 400

    test_enc = test_encodings[0]
    registered_enc = FACE_DB[claimed_name]['encoding']
    
    # 🎯 PRECISION MATCHING
    distance = face_recognition.face_distance([registered_enc], test_enc)[0]
    confidence = round((1 - distance) * 100, 2)
    
    print(f"Biometric Log: ID {claimed_name} | Email {claimed_email} | Distance: {distance:.4f} | Confidence: {confidence}%")

    if distance < 0.5:
        # ✅ VERIFIED
        try:
            os.rename(save_path, os.path.join(DEBUG_DIR, f"{claimed_name}_{timestamp}_SUCCESS.jpg"))
        except: pass
        
        now = time.time()
        if 'attendance_log' not in FACE_DB[claimed_name]:
            FACE_DB[claimed_name]['attendance_log'] = []
            
        log = FACE_DB[claimed_name]['attendance_log']
        if not log or (now - log[-1] > 60):
            log.append(now)
            save_face_db()
            
        return jsonify({
            "success": True, 
            "user": claimed_name, 
            "message": f"Verified: {claimed_name}",
            "confidence": round((1 - distance) * 100, 2)
        })
    else:
        # ❌ MATCH FAIL (POSSIBLE FRAUD)
        try:
            os.rename(save_path, os.path.join(DEBUG_DIR, f"{claimed_name}_{timestamp}_MISMATCH.jpg"))
        except: pass
        
        return jsonify({
            "success": False, 
            "message": f"SCAN REJECTED: Face does not match registered profile for '{claimed_name}'."
        })

@app.route('/get_attendance_log/<user_id>', methods=['GET'])
def get_log(user_id):
    if user_id not in FACE_DB:
        return jsonify({"success": False, "message": "User not found."}), 404
    
    return jsonify({
        "success": True,
        "user_id": user_id,
        "logs": FACE_DB[user_id].get('attendance_log', [])
    })

if __name__ == '__main__':
    print(f" Server started. {len(FACE_DB)} users loaded.")
    app.run(debug=True, host='0.0.0.0', port=5001)


