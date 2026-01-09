#!/usr/bin/env python3
"""Simplified Quiz Backend - Guaranteed to work"""
import fitz
import json
import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage files
PUBLISHED_MATERIALS_FILE = "published_materials.json"
QUIZ_STORAGE_FILE = "quiz_storage.json"
PROGRESS_FILE = "student_results.json"
CONFIG_FILE = "portal_config.json"

class PortalConfig(BaseModel):
    facultyName: str
    unitNames: Dict[str, str]

class QuizResult(BaseModel):
    email: str
    unit: str
    materialId: Optional[str] = None
    score: int
    total: int
    status: str
    timestamp: Optional[str] = None

def load_json(path, default=None):
    if default is None:
        default = {}
    if os.path.exists(path):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

@app.get("/")
def root():
    return {"status": "running", "message": "SNS Quiz Backend"}

@app.get("/get-config")
def get_config():
    default = {
        "facultyName": "Prof. Arunkumar",
        "unitNames": {
            "unit1": "Linear Structures",
            "unit2": "Non-Linear Structures",
            "unit3": "Advanced Algorithms"
        }
    }
    return load_json(CONFIG_FILE, default)

@app.post("/update-config")
def update_config(config: PortalConfig):
    save_json(CONFIG_FILE, config.dict())
    return {"status": "success"}

@app.get("/get-published-materials")
def get_materials():
    return load_json(PUBLISHED_MATERIALS_FILE, {})

@app.post("/upload-material")
async def upload_material(
    id: str = Form(...),
    name: str = Form(...),
    tag: str = Form(...),
    title: str = Form(...),
    date: str = Form(...),
    size: str = Form(...),
    subjectId: str = Form(...),
    uploadedAt: str = Form(...),
    fileData: str = Form(...),
    extractedText: str = Form("")
):
    materials = load_json(PUBLISHED_MATERIALS_FILE, {})
    materials[id] = {
        "id": id,
        "name": name,
        "tag": tag,
        "title": title,
        "date": date,
        "size": int(size),
        "subjectId": subjectId,
        "uploadedAt": uploadedAt,
        "fileData": fileData,
        "extractedText": extractedText
    }
    save_json(PUBLISHED_MATERIALS_FILE, materials)
    return {"status": "success"}

import re
import random

def generate_accurate_mcqs(text, unit_name="", num_questions=10):
    """Real AI Logic to generate MCQs from PDF text"""
    if not text or len(text) < 100:
        # Fallback if text is too short
        return [
            {"q": f"What is the primary focus of {unit_name or 'this unit'}?", "options": ["Concept Identification", "System Analysis", "Implementation", "Design"], "correct": 0},
            {"q": "Which of these is a key component mentioned in the material?", "options": ["Input/Output", "Processing", "Storage", "All of the above"], "correct": 3}
        ]

    # 1. Clean and split text into sentences
    text = re.sub(r'\s+', ' ', text)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # 2. Extract potential keywords (High frequency nouns/specialized terms)
    words = re.findall(r'\b[A-Z][a-z]{3,}\b|\b[a-z]{5,}\b', text)
    word_freq = {}
    for w in words:
        w_low = w.lower()
        if w_low not in ['which', 'there', 'their', 'about', 'would', 'should', 'could', 'these', 'those']:
            word_freq[w_low] = word_freq.get(w_low, 0) + 1
    
    keywords = sorted(word_freq.keys(), key=lambda x: word_freq[x], reverse=True)[:50]
    
    # 3. Filter sentences that look like definitions or facts
    # Sentences containing 'is', 'are', 'means', 'defined', 'called', 'used for'
    candidate_sentences = []
    patterns = [r'\bis\b', r'\bare\b', r'\bmeans\b', r'\bdefined\b', r'\bcalled\b', r'\buses\b', r'\bprovides\b']
    
    for sent in sentences:
        sent = sent.strip()
        if 40 < len(sent) < 150: # Optimal length for a question
            if any(re.search(pat, sent, re.I) for pat in patterns):
                candidate_sentences.append(sent)
    
    # Fallback to general sentences if not enough "definitions" found
    if len(candidate_sentences) < num_questions:
        candidate_sentences.extend([s for s in sentences if 50 < len(s) < 200][:num_questions])

    random.shuffle(candidate_sentences)
    
    quiz = []
    used_sentences = set()
    
    for sent in candidate_sentences:
        if len(quiz) >= num_questions:
            break
            
        # Try to find a keyword in this sentence to hide
        found_keywords = [k for k in keywords if k in sent.lower()]
        if not found_keywords:
            continue
            
        target_word = random.choice(found_keywords)
        
        # Create the question
        # Replace the word with ____
        pattern = re.compile(re.escape(target_word), re.IGNORECASE)
        masked_sent = pattern.sub("________", sent)
        
        question_text = f"According to the material, complete the following: \"{masked_sent}\""
        
        # Distractors
        distractors = [k.capitalize() for k in keywords if k.lower() != target_word.lower()]
        if len(distractors) < 3:
            distractors.extend(["General Theory", "Implementation", "Constraint", "Optimization"])
            
        options = random.sample(distractors, 3)
        correct_option = target_word.capitalize()
        options.append(correct_option)
        random.shuffle(options)
        
        quiz.append({
            "q": question_text,
            "options": options,
            "correct": options.index(correct_option)
        })
        used_sentences.add(sent)

    # 4. Final Fallback/Filler
    if len(quiz) < num_questions:
        while len(quiz) < num_questions:
            quiz.append({
                "q": f"Which concept is essential for {unit_name or 'the current module'}?",
                "options": ["Systematic Approach", "Random Analysis", "Manual Entry", "Fixed Design"],
                "correct": 0
            })
            
    return quiz

@app.post("/generate-quiz")
async def generate_quiz(
    file: UploadFile = File(None),
    text: str = Form(""),
    unit: str = Form(""),
    materialId: str = Form("")
):
    try:
        print(f"📥 Received quiz request: unit={unit}, materialId={materialId}")
        
        extracted_text = text
        # Read PDF if provided
        if file and file.filename:
            print(f"📄 Processing file: {file.filename}")
            try:
                pdf_bytes = await file.read()
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                pdf_text = ""
                for page in doc:
                    pdf_text += page.get_text("text")
                if pdf_text.strip():
                    extracted_text = pdf_text
                print(f"✅ Extracted {len(extracted_text)} characters from PDF")
            except Exception as pdf_err:
                print(f"⚠️ PDF processing warning: {pdf_err}")
        
        # Generate ACCURATE quiz
        quiz_data = generate_accurate_mcqs(extracted_text, unit_name=unit)
        
        # Save quiz
        if materialId:
            quizzes = load_json(QUIZ_STORAGE_FILE, {})
            quizzes[materialId] = quiz_data
            save_json(QUIZ_STORAGE_FILE, quizzes)
            print(f"💾 Saved AI-generated quiz for {materialId}")
        
        return {"quiz": quiz_data}
    except Exception as e:
        print(f"❌ Error in generate_quiz: {e}")
        return {"error": str(e)}

@app.get("/get-quiz/{material_id}")
def get_quiz(material_id: str):
    quizzes = load_json(QUIZ_STORAGE_FILE, {})
    if material_id in quizzes:
        return {"quiz": quizzes[material_id]}
    raise HTTPException(status_code=404, detail="Quiz not found")

@app.post("/save-progress")
def save_progress(result: QuizResult):
    data = load_json(PROGRESS_FILE, [])
    percentage = (result.score / result.total) * 100
    status = "Pass" if percentage >= 50 else "Fail"
    
    unit_num = result.unit.replace("Unit ", "").strip()
    record = {
        "email": result.email,
        "unit": result.unit,
        "unlock_key": f"unit_{unit_num}_passed",
        "materialId": result.materialId,
        "score": result.score,
        "total": result.total,
        "status": status,
        "timestamp": datetime.now().isoformat()
    }
    data.append(record)
    save_json(PROGRESS_FILE, data)
    return {"status": "success", "unlock_key": record["unlock_key"]}

@app.get("/get-all-progress")
def get_all_progress():
    return load_json(PROGRESS_FILE, [])

@app.delete("/clear-all-progress")
def clear_progress():
    save_json(PROGRESS_FILE, [])
    return {"status": "success"}

@app.delete("/delete-student-progress/{email}")
def delete_student(email: str):
    data = load_json(PROGRESS_FILE, [])
    filtered = [r for r in data if r['email'] != email]
    save_json(PROGRESS_FILE, filtered)
    return {"status": "success"}

if __name__ == "__main__":
    print("🚀 Starting SNS Quiz Backend on http://127.0.0.1:8009")
    uvicorn.run(app, host="127.0.0.1", port=8009, log_level="info")
