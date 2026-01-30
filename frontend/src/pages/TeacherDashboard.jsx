import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { CSD_DATA, EXAM_GUIDE } from '../data/csdData';
import {
    BarChart3,
    Upload,
    BookOpen,
    AlertCircle,
    LogOut,
    FileText,
    ShieldCheck,
    Users,
    RefreshCw,
    Search,
    Edit3,
    Save,
    Trash2,
    X,
    ScanLine,
    CheckCircle2,
    XCircle,
    Settings,
    Utensils,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const mySubject = CSD_DATA.subjects.find(s => s.ownerEmail === user?.email);

    // --- CONFIG & EDITING STATE ---
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [portalConfig, setPortalConfig] = useState({
        facultyName: mySubject?.teacherName || "Prof. Arunkumar",
        unitNames: {
            unit1: mySubject?.units[0]?.title || "Linear Structures",
            unit2: mySubject?.units[1]?.title || "Non-Linear Structures",
            unit3: mySubject?.units[2]?.title || "Advanced Algorithms"
        }
    });

    const [activeTab, setActiveTab] = useState('upload');
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [selectedUnit, setSelectedUnit] = useState(1);
    const [selectedTag, setSelectedTag] = useState('2M');
    const [fileName, setFileName] = useState('');
    const [fileObject, setFileObject] = useState(null);

    const [studentResults, setStudentResults] = useState([]);
    const [loadingProgress, setLoadingProgress] = useState(false);

    // --- 🔍 SCANNER STATE ---
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Computed effective subject (after all state hooks)
    const effectiveSubject = useMemo(() => mySubject || {
        id: 'DS',
        name: 'Data Structures',
        teacherName: user?.email?.split('@')[0] || 'Faculty',
        ownerEmail: user?.email,
        units: [
            { id: 'DS_U1', title: 'Linear Structures' },
            { id: 'DS_U2', title: 'Non-Linear Structures' },
            { id: 'DS_U3', title: 'Advanced Algorithms' }
        ]
    }, [mySubject, user?.email]);

    // --- 📊 BACKEND SYNC ---
    const fetchConfig = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8009/get-config');
            if (response.ok) {
                const data = await response.json();
                setPortalConfig(data);
            }
        } catch (err) { console.error("Config fetch failed"); }
    };

    const saveConfig = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8009/update-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facultyName: portalConfig.facultyName,
                    unitNames: portalConfig.unitNames
                }),
            });
            if (response.ok) {
                setIsEditingProfile(false);
                alert("✅ Configuration Updated Successfully!");
            } else {
                const errData = await response.json();
                throw new Error(errData.detail || "Mismatched response");
            }
        } catch (err) {
            alert(`❌ Save Failed: ${err.message}`);
        }
    };

    const fetchStudentProgress = async () => {
        setLoadingProgress(true);
        try {
            const response = await fetch('http://127.0.0.1:8009/get-all-progress');
            if (!response.ok) throw new Error("Server error");
            const data = await response.json();
            setStudentResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoadingProgress(false);
        }
    };

    // --- 🛡️ QR VERIFICATION LOGIC ---
    const handleScan = async (scanResult) => {
        // Handle both raw strings and array/object formats from the scanner library
        const text = Array.isArray(scanResult) ? scanResult[0]?.rawValue : (scanResult?.rawValue || scanResult);

        if (!text || text === scanResult?.message) return; // Ignore if no text or if it's already an error message

        console.log("Teacher Scanner Scanned:", text);

        // Show loading state immediately
        setScanResult({ loading: true });

        try {
            const formData = new FormData();
            formData.append('token', text);

            const response = await axios.post(`http://127.0.0.1:8002/api/student-id/verify-qr`, formData);

            // Success! Stop scanning and show result
            setIsScanning(false);
            setScanResult({ success: true, data: response.data.student });
        } catch (err) {
            console.error("Verification Scan Error:", err);
            // Even on error, we stop scanning so the user can see the error message
            setIsScanning(false);
            setScanResult({
                success: false,
                message: err.response?.data?.detail || "Invalid or Expired QR Code. Please regenerate student ID."
            });
        }
    };

    const clearStudentHistory = async (email = null) => {
        const confirmMsg = email ? `Clear history for ${email}?` : "Wipe ALL student records?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const endpoint = email
                ? `http://127.0.0.1:8009/delete-student-progress/${email}`
                : `http://127.0.0.1:8009/clear-all-progress`;

            const response = await fetch(endpoint, { method: 'DELETE' });
            if (response.ok) {
                alert("✅ Deletion successful.");
                fetchStudentProgress();
            }
        } catch (err) {
            alert("❌ Delete failed: Backend unreachable.");
        }
    };

    useEffect(() => {
        fetchConfig();
        if (activeTab === 'progress') fetchStudentProgress();
    }, [activeTab]);

    const cleanedResults = useMemo(() => {
        const studentMap = {};
        studentResults.forEach(res => {
            const key = `${res.email}-${res.unit}`;
            if (!studentMap[key]) {
                studentMap[key] = { ...res, hasEverPassed: res.status === 'Pass' };
            } else {
                if (res.status === 'Pass') studentMap[key].hasEverPassed = true;
                if (new Date(res.timestamp) > new Date(studentMap[key].timestamp)) {
                    const passStatus = studentMap[key].hasEverPassed || res.status === 'Pass';
                    studentMap[key] = { ...res, hasEverPassed: passStatus };
                }
            }
        });
        return Object.values(studentMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [studentResults]);

    // Note: Removed Access Denied check - all teachers can access portal

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!fileObject) return alert("Select a PDF first.");

        setUploadStatus('processing');

        try {
            const materialId = `unit_${selectedUnit}_${Date.now()}`;

            const formData = new FormData();
            formData.append('file', fileObject);
            formData.append('unit', portalConfig.unitNames[`unit${selectedUnit}`]);
            formData.append('materialId', materialId);

            // 1. Generate Quiz on Backend
            const aiResponse = await fetch('http://127.0.0.1:8009/generate-quiz', {
                method: 'POST',
                body: formData
            });

            if (!aiResponse.ok) throw new Error("AI Backend failed to process PDF.");
            const aiData = await aiResponse.json();
            if (aiData.error) throw new Error(aiData.error);

            const reader = new FileReader();
            reader.onload = async () => {
                const dataURL = reader.result;
                const existingMaterials = JSON.parse(localStorage.getItem('published_materials') || '{}');

                const uploadObj = {
                    materialId: materialId,
                    name: fileName,
                    tag: selectedTag,
                    date: new Date().toLocaleDateString(),
                    title: portalConfig.unitNames[`unit${selectedUnit}`],
                    subjectId: effectiveSubject.id,
                    fileData: dataURL,
                    mime: fileObject?.type || 'application/pdf',
                    uploadedAt: new Date().toISOString()
                };

                // 2. Sync Material ID and Metadata to Backend for all students
                const syncFormData = new FormData();
                syncFormData.append('id', uploadObj.materialId);
                syncFormData.append('name', uploadObj.name);
                syncFormData.append('tag', uploadObj.tag);
                syncFormData.append('title', uploadObj.title);
                syncFormData.append('date', uploadObj.date);
                syncFormData.append('size', fileObject.size);
                syncFormData.append('subjectId', uploadObj.subjectId);
                syncFormData.append('uploadedAt', uploadObj.uploadedAt);
                syncFormData.append('fileData', uploadObj.fileData);

                try {
                    await fetch('http://127.0.0.1:8009/upload-material', {
                        method: 'POST',
                        body: syncFormData
                    });
                } catch (syncErr) {
                    console.error("Backend material sync failed:", syncErr);
                }

                // 3. Update Local Storage for immediate UI feedback
                existingMaterials[`unit_${selectedUnit}`] = uploadObj;
                localStorage.setItem('published_materials', JSON.stringify(existingMaterials));
                window.dispatchEvent(new Event('storage'));

                setUploadStatus('success');
                setTimeout(() => {
                    setUploadStatus('idle');
                    setFileName('');
                    setFileObject(null);
                    alert("🚀 Material Published Successfully to Students!");
                }, 1000);
            };
            reader.readAsDataURL(fileObject);

        } catch (err) {
            setUploadStatus('idle');
            alert(`Upload Failed: ${err.message}. Ensure Python backend is running on port 8001.`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans">
            <aside className="w-64 bg-gray-800 border-r-2 border-gray-700 flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b-2 border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="text-red-600" size={24} />
                        <h2 className="text-lg font-bold text-white tracking-tight uppercase">SNS Faculty</h2>
                    </div>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <button onClick={() => setActiveTab('upload')} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold text-sm transition ${activeTab === 'upload' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><Upload size={18} /> <span>Upload Portal</span></button>
                    <button onClick={() => setActiveTab('progress')} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold text-sm transition ${activeTab === 'progress' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><BarChart3 size={18} /> <span>Student Progress</span></button>
                    <button onClick={() => setActiveTab('scanner')} className={`w-full flex items-center space-x-3 p-3 rounded-xl font-bold text-sm transition ${activeTab === 'scanner' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}><ScanLine size={18} /> <span>ID Verification</span></button>
                    <button onClick={() => navigate('/csd/materials')} className="w-full flex items-center space-x-3 text-gray-400 hover:bg-gray-700 p-3 rounded-xl font-bold text-sm transition"><BookOpen size={18} /> <span>Course Preview</span></button>
                </nav>
                <button onClick={() => { logout(); navigate('/'); }} className="p-6 border-t-2 border-gray-700 flex items-center space-x-2 text-red-400 hover:bg-red-900/10 font-bold text-xs uppercase transition"><LogOut size={16} /> <span>Sign Out</span></button>
            </aside>

            <main className="flex-grow p-10 overflow-y-auto w-full">
                {activeTab === 'scanner' ? (
                    <div className="max-w-full mx-auto">
                        <header className="mb-10 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-white uppercase tracking-tight">Smart ID Scanner</h1>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Verify student identity & security status</p>
                            </div>
                        </header>

                        {/* 🆕 STAFF QUICK ACTIONS SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            <button onClick={() => navigate('/admin')} className="flex items-center justify-between bg-orange-600/10 border-2 border-orange-600 p-4 rounded-2xl group hover:bg-orange-600 transition-all">
                                <div className="flex items-center gap-3">
                                    <Settings className="text-orange-600 group-hover:text-white" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-orange-600 group-hover:text-white uppercase tracking-widest">Admin Panel</p>
                                        <p className="text-xs font-bold text-white">Manage Wallet & Status</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-orange-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>

                            <button onClick={() => navigate('/vendor')} className="flex items-center justify-between bg-emerald-600/10 border-2 border-emerald-600 p-4 rounded-2xl group hover:bg-emerald-600 transition-all">
                                <div className="flex items-center gap-3">
                                    <Utensils className="text-emerald-600 group-hover:text-white" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-emerald-600 group-hover:text-white uppercase tracking-widest">Canteen POS</p>
                                        <p className="text-xs font-bold text-white">Process Purchases</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-emerald-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-gray-800 rounded-3xl border-2 border-gray-700 overflow-hidden relative">
                                <div className="p-6 bg-gray-700/50 border-b-2 border-gray-700 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Lens Gateway</span>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isScanning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                </div>

                                <div className="aspect-square bg-black flex items-center justify-center relative">
                                    {isScanning ? (
                                        <Scanner
                                            onScan={handleScan}
                                            onError={(error) => {
                                                console.error("Scanner Error:", error);
                                                alert("Camera Error: " + error?.message);
                                                setIsScanning(false);
                                            }}
                                            components={{ audio: false, torch: false }}
                                        />
                                    ) : (
                                        <div className="text-center p-10">
                                            <ScanLine size={60} className="text-gray-700 mx-auto mb-4" />
                                            <button
                                                onClick={() => { setScanResult(null); setIsScanning(true); }}
                                                className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-orange-700 transition"
                                            >
                                                Activate Camera
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {scanResult?.loading ? (
                                    <div className="bg-gray-800/50 p-12 rounded-3xl border-2 border-orange-500/30 flex flex-col items-center justify-center text-center animate-pulse">
                                        <RefreshCw size={48} className="text-orange-500 animate-spin mb-4" />
                                        <h3 className="text-xl font-black text-white uppercase italic">Verifying ID</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-widest">Checking Campus Database...</p>
                                    </div>
                                ) : scanResult ? (
                                    <div className={`p-8 rounded-3xl border-2 flex flex-col items-center text-center ${scanResult.success ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                        {scanResult.success ? (
                                            <>
                                                <div className="w-24 h-24 rounded-full border-4 border-green-500 overflow-hidden mb-4 bg-gray-900">
                                                    <img src={scanResult.data.photo} alt="Profile" className="w-full h-full object-cover" />
                                                </div>
                                                <h3 className="text-2xl font-black text-white uppercase">{scanResult.data.name}</h3>
                                                <p className="text-sm font-bold text-green-500 uppercase tracking-widest mb-6">Access Granted</p>
                                                <div className="w-full bg-gray-900/50 rounded-2xl p-4 text-left space-y-2 border border-green-500/20">
                                                    <p className="text-[10px] text-gray-500 font-black uppercase">Roll Number: <span className="text-white">{scanResult.data.roll_no}</span></p>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase">Department: <span className="text-white">{scanResult.data.dept}</span></p>
                                                    <p className="text-[10px] text-gray-500 font-black uppercase">ID Status: <span className="text-white">{scanResult.data.status}</span></p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={60} className="text-red-500 mb-4" />
                                                <h3 className="text-xl font-black text-white uppercase">Verification Failed</h3>
                                                <p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">{scanResult.message}</p>
                                            </>
                                        )}
                                        <button
                                            onClick={() => { setScanResult(null); setIsScanning(true); }}
                                            className="mt-8 w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition"
                                        >
                                            Scan Next ID
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-800/50 p-10 rounded-3xl border-2 border-dashed border-gray-700 text-center">
                                        <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed">
                                            Position the student's <span className="text-orange-500">Dynamic QR Code</span> inside the camera frame to verify identity.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="mb-10 border-b-2 border-gray-800 pb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-white uppercase tracking-tight">{effectiveSubject.name}</h1>
                                <div className="flex items-center gap-4 mt-2">
                                    {isEditingProfile ? (
                                        <input className="bg-gray-900 border-2 border-red-600 rounded px-2 py-1 text-sm font-bold text-white" value={portalConfig.facultyName} onChange={(e) => setPortalConfig({ ...portalConfig, facultyName: e.target.value })} />
                                    ) : (
                                        <p className="text-red-600 font-bold text-sm uppercase">Faculty: {portalConfig.facultyName}</p>
                                    )}
                                    <button onClick={isEditingProfile ? saveConfig : () => setIsEditingProfile(true)} className="text-gray-600 hover:text-white transition">
                                        {isEditingProfile ? <Save size={16} /> : <Edit3 size={16} />}
                                    </button>
                                </div>
                            </div>
                            {activeTab === 'progress' && (
                                <div className="flex gap-3">
                                    <button onClick={() => clearStudentHistory()} className="px-4 py-2 bg-gray-800 border-2 border-red-900/30 text-red-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center gap-2">
                                        <Trash2 size={14} /> Clear All
                                    </button>
                                    <button onClick={fetchStudentProgress} className="p-3 bg-gray-800 border-2 border-gray-700 rounded-xl hover:border-red-600 transition-all">
                                        <RefreshCw size={18} className={`text-red-600 ${loadingProgress ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            )}
                        </header>

                        {activeTab === 'upload' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <section className="lg:col-span-2 bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden">
                                    <div className="bg-gray-700/50 px-6 py-4 border-b-2 border-gray-700 flex justify-between items-center">
                                        <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-widest"><Upload size={16} className="text-red-600" /> Publish Exam Materials</h2>
                                    </div>
                                    <form onSubmit={handlePublish} className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase">Unit Customization</label>
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map(num => (
                                                        <div key={num} className="flex items-center gap-3">
                                                            <div className="w-12 h-10 flex items-center justify-center bg-gray-900 rounded-xl text-[10px] font-black text-red-600 border-2 border-gray-700 shrink-0">U{num}</div>
                                                            <input className="flex-grow bg-gray-900 border-2 border-gray-700 rounded-xl p-3 text-xs font-bold outline-none focus:border-red-600 transition" value={portalConfig.unitNames[`unit${num}`]} onChange={(e) => setPortalConfig({ ...portalConfig, unitNames: { ...portalConfig.unitNames, [`unit${num}`]: e.target.value } })} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={saveConfig} className="w-full py-3 bg-gray-700 hover:bg-red-600 rounded-xl text-[9px] font-black uppercase transition">Update Unit Titles</button>
                                                <div className="mt-8 pt-6 border-t border-gray-700">
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase">Target Unit</label>
                                                    <select className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-3 text-sm font-bold focus:border-red-600" value={selectedUnit} onChange={(e) => setSelectedUnit(Number(e.target.value))}>
                                                        {[1, 2, 3].map(num => <option key={num} value={num}>Unit {num}: {portalConfig.unitNames[`unit${num}`]}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">Weightage Focus</label>
                                                <select className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl p-3 text-sm font-bold text-red-600 outline-none focus:border-red-600" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                                                    <option value="2M">2 Marks (Short Questions)</option>
                                                    <option value="6M">6 Marks (Theory)</option>
                                                    <option value="14M">14 Marks (Case Study)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:border-red-600 transition bg-gray-900/30 relative">
                                            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { setFileName(e.target.files[0]?.name); setFileObject(e.target.files[0] || null); }} />
                                            <FileText size={40} className={`mx-auto mb-4 ${fileName ? 'text-green-500' : 'text-gray-600'}`} />
                                            <p className="text-xs font-bold text-gray-300 uppercase">{fileName ? fileName : "Click to select PDF notes"}</p>
                                        </div>
                                        <button type="submit" disabled={uploadStatus !== 'idle'} className={`w-full py-5 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition shadow-xl border-b-4 ${uploadStatus === 'idle' ? 'bg-red-600 hover:bg-red-700 border-red-900 text-white' : 'bg-gray-700 text-gray-400 border-gray-800'}`}>
                                            {uploadStatus === 'idle' ? "Publish to Student Portal" : "Processing AI Quiz..."}
                                        </button>
                                    </form>
                                </section>
                                <aside className="bg-gray-800 p-6 rounded-2xl border-2 border-gray-700 h-fit">
                                    <h3 className="text-[10px] font-bold text-red-600 uppercase mb-4 tracking-widest">Exam Pattern Guide</h3>
                                    <div className="space-y-3">
                                        {Object.keys(EXAM_GUIDE).map((tag) => (
                                            <div key={tag} className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                                                <p className="text-[10px] font-black text-white mb-2 uppercase">{tag} Breakdown</p>
                                                {EXAM_GUIDE[tag].breakdown.map((item, i) => <div key={i} className="flex items-center gap-2 mb-1"><div className="w-1 h-1 bg-red-600 rounded-full"></div><p className="text-[9px] font-bold text-gray-500 uppercase">{item}</p></div>)}
                                            </div>
                                        ))}
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <section className="bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden shadow-2xl">
                                <div className="bg-gray-700/50 px-6 py-4 border-b-2 border-gray-700 flex justify-between items-center">
                                    <h2 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-widest"><Users size={16} className="text-red-600" /> Merit Repository</h2>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cleanedResults.length} Qualified Records</span>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-900/50 border-b-2 border-gray-700">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">Student</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">Module Unit</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase text-center">Recent Accuracy</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase">Result</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {cleanedResults.length > 0 ? cleanedResults.map((res, i) => {
                                                const percentage = Math.round((res.score / res.total) * 100);
                                                return (
                                                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-red-600 font-bold text-xs">{res.email.charAt(0).toUpperCase()}</div>
                                                                <div className="flex flex-col"><span className="text-sm font-bold text-gray-200">{res.email}</span><span className="text-[8px] text-gray-500 uppercase font-black">{res.timestamp ? new Date(res.timestamp).toLocaleString() : 'Recent'}</span></div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">{res.unit}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs font-black text-white">{percentage}%</span>
                                                                <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${res.status === 'Pass' ? 'bg-green-500' : 'bg-red-600'}`} style={{ width: `${percentage}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${res.hasEverPassed ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-600/10 text-red-600 border-red-600/20'}`}>
                                                                {res.hasEverPassed ? 'Qualified' : 'Failed'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => clearStudentHistory(res.email)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan="5" className="px-6 py-20 text-center"><Search size={40} className="text-gray-700 mx-auto mb-4" /><p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No activity detected yet</p></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;