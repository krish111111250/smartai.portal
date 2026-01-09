import fitz  # PyMuPDF
import random
import re
import os
import json
import uvicorn
import ssl # Required for the Mac SSL bypass
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional

# --- 🛠️ MAC SSL & NLTK AUTO-DOWNLOAD ---
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# try:
#     nltk.download('stopwords', quiet=True)
#     nltk.download('punkt', quiet=True)
#     nltk.download('punkt_tab', quiet=True)
# except Exception as e:
#     print(f"NLTK Download Warning: {e}")

print("🚀 Starting Quiz Backend...")

# Initialize local NLP tools
# nlp = None
# try:
#     print("🧠 Loading SpaCy model...")
#     nlp = spacy.load("en_core_web_sm")
#     print("✅ SpaCy loaded.")
# except Exception as e:
#     print(f"❌ SpaCy Load Error: {e}")

# rake = Rake()

app = FastAPI()

print("🔒 Configuring CORS...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
PROGRESS_FILE = "student_results.json"
CONTEXT_FILE = "extracted_context.txt"
CONFIG_FILE = "portal_config.json"
PUBLISHED_MATERIALS_FILE = "published_materials.json"
QUIZ_STORAGE_FILE = "quiz_storage.json"

class QuizResult(BaseModel):
    email: str
    unit: str
    materialId: Optional[str] = None
    score: int
    total: int
    status: str
    timestamp: Optional[str] = None 

class PortalConfig(BaseModel):
    facultyName: str
    unitNames: Dict[str, str]

class MaterialMetadata(BaseModel):
    id: str
    name: str
    tag: str
    title: str
    date: str
    size: int
    subjectId: str
    uploadedAt: str
    fileData: str # We'll store the base64/dataURL for simplicity in this local version

# --- HELPERS ---
def load_json(file_path, default=[]):
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            try: return json.load(f)
            except: return default
    return default

def save_json(file_path, data):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

# --- CONFIGURATION LOGIC ---
def get_initial_config():
    default_config = {
        "facultyName": "Prof. Arunkumar",
        "unitNames": {
            "unit1": "Linear Structures",
            "unit2": "Non-Linear Structures",
            "unit3": "Advanced Algorithms"
        }
    }
    if not os.path.exists(CONFIG_FILE):
        save_json(CONFIG_FILE, default_config)
    return load_json(CONFIG_FILE, default_config)

# --- 🧠 OFFLINE MCQ GENERATION ENGINE ---

def get_distractors_offline(target_word, all_keywords, corpus, n=3):
    """Finds similar technical terms using TF-IDF and Cosine Similarity."""
    if len(all_keywords) < 4:
        return ["Logic Flow", "System Node", "Data Base", "Process Unit"]
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        vectorizer = TfidfVectorizer().fit([corpus])
        vectors = vectorizer.transform(all_keywords)
        target_idx = all_keywords.index(target_word)
        
        scores = cosine_similarity(vectors[target_idx], vectors).flatten()
        related_indices = scores.argsort()[::-1]
        
        distractors = [all_keywords[i] for i in related_indices 
                      if all_keywords[i].lower() != target_word.lower()][:n]
        return distractors
    except:
        return random.sample([k for k in all_keywords if k != target_word], n)

# --- OFFLINE MCQ GENERATION ENGINE (STUB) ---
def generate_teacher_quiz_offline(text, num_questions=10):
    # Temporary stub to ensure server starts
    demo_quiz = [
        {"q": "What is represented by the text provided?", "options": ["Data Structure", "Algorithm", "Operating System", "Network"], "correct": 0},
        {"q": "Which unit does this material belong to?", "options": ["Unit 1", "Unit 2", "Unit 3", "General"], "correct": 3}
    ]
    return demo_quiz

# --- FASTAPI ROUTES ---

@app.get("/get-config")
async def get_config():
    return get_initial_config()

@app.post("/update-config")
async def update_config(config: PortalConfig):
    save_json(CONFIG_FILE, config.dict())
    return {"status": "success", "message": "Configuration updated"}

@app.get("/get-published-materials")
async def get_published_materials():
    return load_json(PUBLISHED_MATERIALS_FILE, {})

@app.post("/upload-material")
async def upload_material(
    id: str = Form(...),
    name: str = Form(...),
    tag: str = Form(...),
    title: str = Form(...),
    date: str = Form(...),
    size: int = Form(...),
    subjectId: str = Form(...),
    uploadedAt: str = Form(...),
    fileData: str = Form(...),
    extractedText: str = Form("")
):
    existing = load_json(PUBLISHED_MATERIALS_FILE, {})
    material_data = {
        "id": id,
        "name": name,
        "tag": tag,
        "title": title,
        "date": date,
        "size": size,
        "subjectId": subjectId,
        "uploadedAt": uploadedAt,
        "fileData": fileData,
        "extractedText": extractedText
    }
    existing[id] = material_data
    save_json(PUBLISHED_MATERIALS_FILE, existing)
    return {"status": "success"}

@app.post("/generate-quiz")
async def generate_quiz(file: UploadFile = File(...), unit: str = Form(...), materialId: str = Form(None)):
    if not materialId:
        materialId = f"unit_{unit.lower().replace(' ', '_')}_{int(time.time())}"
    try:
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        raw_text = ""
        for page in doc:
            raw_text += page.get_text("text") + " "
        
        clean_text = re.sub(r'[^\x00-\x7F]+', ' ', raw_text)
        clean_text = re.sub(r'[\r\n\t]+', ' ', clean_text)
        clean_text = " ".join(clean_text.split())

        with open(CONTEXT_FILE, "w", encoding="utf-8") as f:
            f.write(f"UNIT: {unit}\n\n")
            f.write(clean_text)
            
        quiz_data = generate_teacher_quiz_offline(clean_text, 10)
        
        # Save Quiz for student access
        all_quizzes = load_json(QUIZ_STORAGE_FILE, {})
        all_quizzes[materialId] = quiz_data
        save_json(QUIZ_STORAGE_FILE, all_quizzes)

        return {"quiz": quiz_data}
    except Exception as e:
        return {"error": f"Offline Generation Error: {str(e)}"}

@app.get("/get-quiz/{material_id}")
async def get_quiz(material_id: str):
    all_quizzes = load_json(QUIZ_STORAGE_FILE, {})
    if material_id in all_quizzes:
        return {"quiz": all_quizzes[material_id]}
    # Fallback to general unit key if specific materialId not found
    unit_id = material_id.split('_')[1] if '_' in material_id else "1"
    unit_key = f"unit_{unit_id}"
    if unit_key in all_quizzes:
         return {"quiz": all_quizzes[unit_key]}
         
    raise HTTPException(status_code=404, detail="Quiz not found for this material.")

@app.post("/save-progress")
async def save_progress(result: QuizResult):
    data = load_json(PROGRESS_FILE, [])
    
    percentage = (result.score / result.total) * 100
    current_status = "Pass" if percentage >= 50 else "Fail"
    
    unit_match = re.search(r'\d+', result.unit)
    unit_num = unit_match.group() if unit_match else "1"
    
    new_record = {
        "email": result.email,
        "unit": f"Unit {unit_num}",
        "unlock_key": f"unit_{unit_num}_passed",
        "materialId": result.materialId,
        "score": result.score,
        "total": result.total,
        "status": current_status,
        "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    }
    
    data.append(new_record)
    save_json(PROGRESS_FILE, data)
    return {"status": "success", "unlock_key": new_record["unlock_key"]}

@app.get("/get-all-progress")
async def get_all_progress():
    return load_json(PROGRESS_FILE, [])

@app.delete("/clear-all-progress")
async def clear_all_progress():
    save_json(PROGRESS_FILE, [])
    return {"status": "success"}

@app.delete("/delete-student-progress/{email}")
async def delete_student_progress(email: str):
    data = load_json(PROGRESS_FILE, [])
    filtered_data = [r for r in data if r['email'] != email]
    save_json(PROGRESS_FILE, filtered_data)
    return {"status": "success"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)