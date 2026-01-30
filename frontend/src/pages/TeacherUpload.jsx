import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, LogOut,
  ShieldCheck, Edit3, Trash2, Database, Eye, Sparkles
} from 'lucide-react';
import { openDB } from 'idb';

import { useAuth } from '../context/AuthContext';
import { CSD_DATA } from '../data/csdData';

/* -------------------- DATABASE CONFIG -------------------- */
const initDB = async () => {
  return openDB('SNS_Portal_DB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('materials')) {
        db.createObjectStore('materials', { keyPath: 'id' });
      }
    },
  });
};

const TeacherUpload = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mySubject = CSD_DATA.subjects.find((s) => s.ownerEmail === user?.email);

  // --- UPDATED: SYNCED PORTAL CONFIG ---
  const [portalConfig, setPortalConfig] = useState({
    facultyName: mySubject?.teacherName || "Prof. Arunkumar",
    unitNames: { unit1: 'Linear Structures', unit2: 'Non-Linear Structures', unit3: 'Advanced Algorithms' }
  });

  const [publishedMaterials, setPublishedMaterials] = useState({});
  const [uploadData, setUploadData] = useState({ unitNo: 1, tag: '2M', fileName: '', fileObject: null });
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingState, setLoadingState] = useState('loading'); // loading | ready | error

  // 1. Fetch Config from Backend
  const fetchConfig = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8009/get-config');
      if (!response.ok) {
        throw new Error(`Config API returned ${response.status}`);
      }
      const data = await response.json();
      setPortalConfig(data);
      return true;
    } catch (err) {
      console.error("Config fetch failed:", err);
      setErrorMessage("Failed to connect to AI Quiz Backend (Port 8009). Please ensure the Python backend is running.");
      setLoadingState('error');
      return false;
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8009/get-published-materials');
      if (!response.ok) {
        throw new Error(`Materials API returned ${response.status}`);
      }
      const data = await response.json();
      const map = {};
      Object.values(data).forEach(file => {
        const match = file.id.match(/^unit_(\d+)/);
        if (match) map[`unit_${match[1]}`] = file;
      });
      setPublishedMaterials(map);
      return true;
    } catch (err) {
      console.error("Load materials failed", err);
      // Fallback to IndexedDB
      try {
        const db = await initDB();
        const all = await db.getAll('materials');
        const map = {};
        all.forEach(item => { map[item.id] = item; });
        setPublishedMaterials(map);
        return true;
      } catch (dbErr) {
        console.error("IndexedDB fallback failed:", dbErr);
        return false;
      }
    }
  };

  useEffect(() => {
    const initializePortal = async () => {
      setLoadingState('loading');
      const configSuccess = await fetchConfig();
      const materialsSuccess = await loadMaterials();

      if (configSuccess && materialsSuccess) {
        setLoadingState('ready');
      }

      // Load PDF.js library
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.0/pdf.min.js';
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.0/pdf.worker.min.js';
        };
        document.head.appendChild(script);
      }
    };

    initializePortal();
  }, []);

  const notifyStorageChange = () => {
    localStorage.setItem('sns_db_update', Date.now().toString());
    window.dispatchEvent(new Event('storage'));
  };

  /* -------------------- REAL TEXT EXTRACTION -------------------- */
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + " ";
    }
    return text;
  };

  /* -------------------- UPLOAD PROCESS (FIXED) -------------------- */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.fileObject) {
      alert('Please select a PDF file first');
      return;
    }

    setStatus('uploading');

    try {
      const materialId = `unit_${uploadData.unitNo}_${Date.now()}`;

      // 1. SEND TO BACKEND FIRST (AI Quiz generation)
      const formData = new FormData();
      formData.append('file', uploadData.fileObject);
      formData.append('unit', portalConfig.unitNames[`unit${uploadData.unitNo}`]);
      formData.append('materialId', materialId);

      const backendResponse = await fetch('http://127.0.0.1:8009/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      if (!backendResponse.ok) throw new Error("Backend failed to process quiz");

      // 2. EXTRACT TEXT
      const extractedText = await extractTextFromPDF(uploadData.fileObject);

      // 3. READ FILE DATA
      const reader = new FileReader();
      reader.onload = async () => {
        const dataURL = reader.result;

        const uploadObj = {
          id: materialId,
          name: uploadData.fileName,
          tag: uploadData.tag,
          title: portalConfig.unitNames[`unit${uploadData.unitNo}`],
          date: new Date().toLocaleDateString(),
          fileData: dataURL,
          extractedText: extractedText,
          size: uploadData.fileObject.size,
          subjectId: mySubject?.id || 'DS_01',
          uploadedAt: new Date().toISOString()
        };

        // Save to Backend for everyone (Using FormData to handle large payload)
        const materialFormData = new FormData();
        materialFormData.append('id', uploadObj.id);
        materialFormData.append('name', uploadObj.name);
        materialFormData.append('tag', uploadObj.tag);
        materialFormData.append('title', uploadObj.title);
        materialFormData.append('date', uploadObj.date);
        materialFormData.append('fileData', uploadObj.fileData);
        materialFormData.append('extractedText', uploadObj.extractedText);
        materialFormData.append('size', uploadObj.size.toString());
        materialFormData.append('subjectId', uploadObj.subjectId);
        materialFormData.append('uploadedAt', uploadObj.uploadedAt);

        try {
          await fetch('http://127.0.0.1:8009/upload-material', {
            method: 'POST',
            body: materialFormData,
          });
        } catch (e) {
          console.error("Backend material sync failed, proceeding with local save", e);
        }

        // Save to Local for immediate UI update
        const existing = JSON.parse(localStorage.getItem('published_materials') || '{}');
        existing[`unit_${uploadData.unitNo}`] = uploadObj;
        localStorage.setItem('published_materials', JSON.stringify(existing));

        const db = await initDB();
        await db.put('materials', { ...uploadObj, fileBlob: uploadData.fileObject });

        await loadMaterials();
        notifyStorageChange();
        setStatus('success');
        setUploadData({ ...uploadData, fileName: '', fileObject: null });
        setTimeout(() => setStatus(null), 3000);
      };
      reader.readAsDataURL(uploadData.fileObject);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to process PDF.');
      alert("Error: " + (err.message || "Could not connect to Python backend"));
    }
  };

  // UPDATED: Sync rename to Backend
  const handleRename = async (unitNo, newName) => {
    const updatedConfig = {
      ...portalConfig,
      unitNames: { ...portalConfig.unitNames, [`unit${unitNo}`]: newName }
    };
    setPortalConfig(updatedConfig);

    try {
      await fetch('http://127.0.0.1:8009/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      notifyStorageChange();
    } catch (err) { console.error("Config save failed"); }
  };

  const handleDelete = async (unitNo) => {
    if (!window.confirm(`Delete Unit ${unitNo}?`)) return;
    const db = await initDB();
    await db.delete('materials', `unit_${unitNo}`);

    const existing = JSON.parse(localStorage.getItem('published_materials') || '{}');
    delete existing[`unit_${unitNo}`];
    localStorage.setItem('published_materials', JSON.stringify(existing));

    await loadMaterials();
    notifyStorageChange();
  };

  if (!mySubject) return null;

  // LOADING STATE
  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Connecting to AI Backend...</p>
      </div>
    );
  }

  // ERROR STATE
  if (loadingState === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-3xl border border-red-600/50">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-black uppercase text-center mb-4">Backend Connection Failed</h2>
          <p className="text-sm text-gray-400 text-center mb-6">{errorMessage}</p>
          <div className="bg-gray-950 p-4 rounded-xl mb-6">
            <p className="text-xs font-mono text-gray-500 mb-2">Expected Backend: http://127.0.0.1:8009</p>
            <p className="text-xs font-mono text-yellow-500">Please start: python backend/quiz_backend/main.py</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-red-600" size={26} />
          <h1 className="text-lg font-black uppercase italic tracking-tighter text-white">SNS Faculty Portal</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { logout(); navigate('/login'); }} className="p-2.5 bg-gray-800 rounded-xl hover:bg-red-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8 w-full grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 shadow-2xl">
            <h2 className="text-[10px] uppercase font-black text-gray-500 mb-6 flex items-center gap-2">
              <Edit3 size={14} className="text-red-600" /> Curriculum Configuration
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((u) => (
                <div key={u} className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase">Unit 0{u} Name</label>
                  <input
                    value={portalConfig.unitNames[`unit${u}`]}
                    onChange={(e) => handleRename(u, e.target.value)}
                    className="w-full p-4 bg-black/50 border border-gray-800 rounded-2xl text-xs font-bold uppercase focus:border-red-600 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-black">
              <div>
                <h2 className="text-xl font-black uppercase italic">Publish AI Resource</h2>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Sync document to student quiz portal</p>
              </div>
              <Database size={24} className="text-red-600" />
            </div>

            <form onSubmit={handleUpload} className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase ml-2">Select Unit</label>
                  <select
                    value={uploadData.unitNo}
                    onChange={(e) => setUploadData({ ...uploadData, unitNo: Number(e.target.value) })}
                    className="w-full p-4 bg-black/40 rounded-2xl border border-gray-800 text-sm font-bold outline-none focus:border-red-600"
                  >
                    {[1, 2, 3].map((n) => <option key={n} value={n}>Unit 0{n}: {portalConfig.unitNames[`unit${n}`]}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase ml-2">Assessment Type</label>
                  <select
                    value={uploadData.tag}
                    onChange={(e) => setUploadData({ ...uploadData, tag: e.target.value })}
                    className="w-full p-4 bg-black/40 rounded-2xl border border-gray-800 text-red-600 text-sm font-black outline-none"
                  >
                    <option value="2M">Standard (2 Marks)</option>
                    <option value="6M">Intermediate (6 Marks)</option>
                    <option value="14M">Advanced (14 Marks)</option>
                  </select>
                </div>
              </div>

              <div className="relative group">
                <div className="border-2 border-dashed border-gray-800 rounded-[2rem] p-12 text-center group-hover:border-red-600/50 transition-all bg-black/20">
                  <input
                    type="file"
                    accept=".pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setUploadData({
                      ...uploadData,
                      fileName: e.target.files[0]?.name || '',
                      fileObject: e.target.files[0] || null
                    })}
                  />
                  <FileText size={40} className="mx-auto mb-4 text-gray-700 group-hover:text-red-600 transition-colors" />
                  <p className="text-xs font-black uppercase text-gray-400">
                    {uploadData.fileName || 'Drop Lecture PDF here or Click to Browse'}
                  </p>
                  <p className="text-[9px] text-gray-600 mt-2 uppercase">PDF format only • Max 10MB</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'uploading'}
                className="w-full py-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 rounded-3xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 active:scale-95"
              >
                {status === 'uploading' ? (
                  <>Processing AI Sync... <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /></>
                ) : (
                  <>Sync & Prepare AI Quiz <Sparkles size={18} /></>
                )}
              </button>

              {status === 'success' && (
                <div className="flex items-center justify-center gap-2 text-green-500 font-black text-[10px] uppercase animate-bounce">
                  <CheckCircle size={14} /> Repository Updated Successfully
                </div>
              )}
            </form>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-[2rem] border border-gray-800 p-6 shadow-xl">
            <h3 className="text-[10px] font-black uppercase text-gray-500 mb-6 px-2">Live Repository</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((u) => (
                <div key={u} className="p-4 bg-black/40 rounded-2xl border border-gray-800 flex justify-between items-center group hover:border-gray-600 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${publishedMaterials[`unit_${u}`] ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`} />
                    <div>
                      <span className="text-[9px] font-black text-gray-600 uppercase">Unit 0{u}</span>
                      <p className="text-[11px] font-bold text-gray-300 truncate w-32">
                        {publishedMaterials[`unit_${u}`]?.name || 'Empty Slot'}
                      </p>
                    </div>
                  </div>
                  {publishedMaterials[`unit_${u}`] && (
                    <button onClick={() => handleDelete(u)} className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherUpload;