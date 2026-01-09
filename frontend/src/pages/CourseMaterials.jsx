import React, { useState, useEffect } from 'react';
import {
    Download, Lock, CheckCircle, ShieldCheck, FileText,
    AlertCircle, RefreshCw, Eye, Sparkles, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EXAM_GUIDE } from '../data/csdData';
import { useAuth } from '../context/AuthContext';

const CourseMaterials = () => {
    const { role } = useAuth();
    const navigate = useNavigate();

    const [portalConfig, setPortalConfig] = useState(null);
    const [publishedFiles, setPublishedFiles] = useState({});
    const [progress, setProgress] = useState({});
    const [activeStudyGuide, setActiveStudyGuide] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchConfig = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8001/get-config');
            if (response.ok) {
                const data = await response.json();
                setPortalConfig(data);
            }
        } catch (err) {
            console.error("Config fetch failed");
        }
    };

    const syncData = async () => {
        setIsRefreshing(true);
        fetchConfig();
        try {
            let backendFiles = {};

            // 1. Try to fetch from Backend
            try {
                const response = await fetch('http://127.0.0.1:8001/get-published-materials');
                if (response.ok) {
                    const data = await response.json();
                    // Map materials to UI slots
                    Object.values(data).forEach(file => {
                        // Try to extract unit number from ID (supports: unit_1, unit_1_timestamp, etc.)
                        const match = file.id.match(/unit_(\d+)/);
                        if (match) {
                            backendFiles[`unit_${match[1]}`] = file;
                        }
                    });
                }
            } catch (fetchErr) {
                console.log('Backend fetch failed, using localStorage', fetchErr);
            }

            // 2. Fallback: Also check localStorage for materials
            const localData = localStorage.getItem('published_materials');
            if (localData) {
                const localMaterials = JSON.parse(localData);
                // Merge local materials (localStorage takes priority for immediate updates)
                Object.keys(localMaterials).forEach(key => {
                    if (!backendFiles[key] || localMaterials[key].uploadedAt > (backendFiles[key]?.uploadedAt || '')) {
                        backendFiles[key] = localMaterials[key];
                    }
                });
            }

            const userEmail = localStorage.getItem('userEmail') || "guest@sns.edu";
            const progressKey = `csd_progress_${userEmail}`;
            const progressData = localStorage.getItem(progressKey);

            setPublishedFiles(backendFiles);
            setProgress(progressData ? JSON.parse(progressData) : {});
        } catch (err) {
            console.error('Sync error:', err);
        }
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        syncData();
        window.addEventListener('storage', syncData);
        return () => window.removeEventListener('storage', syncData);
    }, []);

    const handleDownload = (file) => {
        if (!file || !file.fileData) {
            alert("❌ File content missing.");
            return;
        }

        try {
            const base64Parts = file.fileData.split(',');
            const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);

            const viewer = window.open('', '_blank');
            if (!viewer) {
                alert("Please allow popups to view the PDF");
                return;
            }

            const html = `
                <html>
                <head>
                    <title>SNS Preview: ${file.name}</title>
                    <style>
                        body { margin: 0; background: #09090b; color: white; font-family: sans-serif; overflow: hidden; }
                        header { display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; background: #18181b; border-bottom: 4px solid #dc2626; }
                        .btn { background: #dc2626; color: white; border-radius: 8px; padding: 10px 18px; text-decoration: none; font-size: 11px; font-weight: 800; border: none; cursor: pointer; }
                        main { height: calc(100vh - 70px); width: 100vw; }
                        iframe { width: 100%; height: 100%; border: none; }
                    </style>
                </head>
                <body>
                    <header>
                        <button class="btn" onclick="window.close()">CLOSE PREVIEW</button>
                        <div style="font-weight: 900; font-size: 12px; letter-spacing: 2px;">SNS ACADEMY SECURE VIEWER</div>
                        <a class="btn" href="${blobUrl}" download="${file.name}">DOWNLOAD PDF</a>
                    </header>
                    <main>
                        <iframe src="${blobUrl}"></iframe>
                    </main>
                </body>
                </html>
            `;
            viewer.document.write(html);
        } catch (error) {
            console.error("Preview failed", error);
            window.open(file.fileData, '_blank');
        }
    };

    const isUnitLocked = (unitNo) => {
        if (role === 'TEACHER') return false;
        if (unitNo === 1) return false;

        const prevUnitNo = unitNo - 1;
        const prevFile = publishedFiles[`unit_${prevUnitNo}`];
        const prevMid = prevFile?.materialId;

        // CHECK: Lock logic looks for the pass of the specific FILE in the previous unit
        const hasPassedPrev = progress[`pass_${prevMid}`];

        return !hasPassedPrev;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
            <header className="bg-gray-900 border-b-4 border-red-600 sticky top-0 z-50 p-6 shadow-xl">
                <div className="max-w-full mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={32} className="text-red-600" />
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight uppercase">SNS STUDENT PORTAL</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Course Repository</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={syncData} className={`p-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-red-600 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={18} className="text-red-600" />
                        </button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-gray-800 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-gray-700 hover:bg-gray-700">
                            Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-full mx-auto px-10 py-12 w-full flex-grow">
                <div className="mb-10 flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-red-600 rounded-full"></div>
                    <div>
                        <h2 className="text-3xl font-bold uppercase tracking-tight text-white leading-none">Data Structures</h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">AI Assessment Repository Sync Active</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((unitNo) => {
                        const locked = isUnitLocked(unitNo);
                        const file = publishedFiles[`unit_${unitNo}`];
                        const materialId = file?.materialId || `unit_${unitNo}_default`;

                        // --- 🛠️ FIXED PASS LOGIC: Only check the current unique Material ID ---
                        const passedThisFile = progress[`pass_${materialId}`];

                        const recent = progress[`recent_${materialId}`];
                        const title = portalConfig?.unitNames[`unit${unitNo}`] || (unitNo === 1 ? 'Linear Structures' : unitNo === 2 ? 'Non-Linear Structures' : 'Advanced Algorithms');

                        return (
                            <div key={unitNo} className={`relative p-8 rounded-2xl border-2 flex flex-col min-h-[520px] transition-all duration-300 ${locked ? 'bg-gray-800/20 border-gray-800 opacity-50' : 'bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-red-600 shadow-lg'}`}>

                                {locked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-2xl z-20 backdrop-blur-md">
                                        <Lock size={40} className="text-red-600 mb-4" />
                                        <p className="text-[12px] uppercase font-black text-white tracking-[0.3em]">Unlock Unit {unitNo - 1} First</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">Module 0{unitNo}</span>
                                    {passedThisFile && <div className="flex items-center gap-1 text-green-500 font-bold text-[10px] uppercase tracking-widest"><CheckCircle size={16} /> Passed</div>}
                                </div>

                                <h3 className="text-2xl font-bold uppercase mb-8 leading-tight text-white tracking-tight">{title}</h3>

                                <div className="grid grid-cols-3 gap-2 mb-10">
                                    {['2M', '6M', '14M'].map((tag) => (
                                        <button key={tag} onClick={() => setActiveStudyGuide({ tag })} className="bg-gray-900 border border-gray-700 rounded-xl py-3 hover:border-red-600 transition-all text-[10px] font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest">
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-auto space-y-4">
                                    {file ? (
                                        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 group hover:border-red-600 transition-all">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-red-600/10 rounded-lg border border-red-600/20"><FileText size={20} className="text-red-600" /></div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Material Ready</p>
                                                    <p className="text-xs font-bold text-gray-300 truncate uppercase">{file.name}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDownload(file)} className="w-full py-3 bg-gray-800 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-gray-700">
                                                <Eye size={14} /> Preview Material
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-700 rounded-2xl py-10 text-center bg-gray-900/50">
                                            <AlertCircle size={24} className="mx-auto mb-2 text-gray-700" />
                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Pending Upload</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate(`/quiz/DS_Q${unitNo}?mid=${materialId}`)}
                                        disabled={locked || (passedThisFile && role !== 'TEACHER') || !file}
                                        className={`w-full py-5 rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 shadow-lg ${passedThisFile && role !== 'TEACHER' ? 'bg-green-600/10 text-green-500 border border-green-600/20' : !file || locked ? 'bg-gray-800 text-gray-600 border border-gray-700 opacity-50' : 'bg-red-600 text-white hover:bg-red-700'
                                            }`}
                                    >
                                        {passedThisFile && role !== 'TEACHER' ? 'Module Completed' : (!file ? 'Quiz Not Ready' : recent?.status === "Fail" ? 'Retry Assessment' : 'Start Assessment')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default CourseMaterials;