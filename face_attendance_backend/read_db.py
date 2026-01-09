import pickle
import os
import numpy as np

# Define the path to your database file
DB_FILE = os.path.join('face_data', 'face_db.pkl')

print("--- Face Database Reader Tool ---")

if not os.path.exists(DB_FILE):
    print(f"ERROR: Database file not found at {DB_FILE}")
else:
    try:
        with open(DB_FILE, 'rb') as f:
            face_db = pickle.load(f)
        
        print(f"\nSuccessfully loaded database from {DB_FILE}.")
        print(f"Total Enrolled Users: {len(face_db)}\n")
        
        for user_id, data in face_db.items():
            print("===================================================")
            print(f"User ID (The Name): {user_id}")
            
            # Check if encoding is a NumPy array before printing its size
            encoding = data.get('encoding')
            if isinstance(encoding, np.ndarray):
                print(f"Face Encoding Vector Size: {len(encoding)}")
                
                # Print the full list of 128 numbers
                # We use numpy.array2string for clean formatting
                print("\n--- Full 128-Dimensional Face Encoding ---")
                print(np.array2string(encoding, precision=8, separator=', ', suppress_small=True))
                print("------------------------------------------\n")
            else:
                print("Encoding data is missing or corrupted.")

    except Exception as e:
        print(f"ERROR: Could not read or process the database file: {e}")