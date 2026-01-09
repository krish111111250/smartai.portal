import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Timer, Award, ShieldCheck, AlertTriangle, ChevronRight, Lightbulb, RotateCcw, Coins } from 'lucide-react';
import axios from 'axios';

const UnitQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const hasRequested = useRef(false);

    const unitFromUrl = Number((quizId || '').match(/\d+/)?.[0] || 1);
    const queryParams = new URLSearchParams(location.search);
    const materialId = queryParams.get('mid') || `unit_${unitFromUrl}_default`;

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600);
    const [showHint, setShowHint] = useState(false);
    const [rewardStatus, setRewardStatus] = useState('idle'); // idle | credited | already_claimed

    // --- 💰 THE REWARD BRIDGE ---
    const triggerWalletReward = async (userEmail) => {
        try {
            // Check if already rewarded for this specific material to prevent farming
            const rewardKey = `reward_claimed_${userEmail}_${materialId}`;
            if (localStorage.getItem(rewardKey)) {
                setRewardStatus('already_claimed');
                return;
            }

            const formData = new FormData();
            formData.append('email', userEmail);
            formData.append('amount', '10.00');
            formData.append('reason', `Academic Reward: Passed Unit ${unitFromUrl}`);

            // This calls your Python Wallet Backend
            const res = await axios.post('http://127.0.0.1:8002/api/student-id/admin/credit-wallet', formData);

            if (res.status === 200) {
                localStorage.setItem(rewardKey, 'true');
                setRewardStatus('credited');
            }
        } catch (err) {
            console.error("Wallet Reward Failed:", err);
        }
    };

    // --- 🛠️ REINFORCED SYNC LOGIC ---
    const syncProgressToBackend = async (finalScoreValue) => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            const userEmail = storedUser.email || localStorage.getItem('userEmail') || "guest@sns.edu";

            const totalQs = quiz?.questions?.length || 10;
            const percentage = (finalScoreValue / totalQs) * 100;
            const passStatus = percentage >= 50 ? "Pass" : "Fail";

            const payload = {
                email: userEmail,
                unit: `Unit ${unitFromUrl}`,
                materialId: materialId,
                score: finalScoreValue,
                total: totalQs,
                status: passStatus,
                timestamp: new Date().toISOString()
            };

            // 1. Save to Quiz Backend
            await fetch('http://127.0.0.1:8001/save-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // 2. TRIGGER REWARD IF PASSED
            if (passStatus === "Pass") {
                triggerWalletReward(userEmail);
            }

            // 3. Update Local Progress
            const progressKey = `csd_progress_${userEmail}`;
            const localProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');

            if (passStatus === "Pass") {
                localProgress[`pass_${materialId}`] = true;
                localProgress[`unit_${unitFromUrl}_passed`] = true;
                localProgress[`DS_U${unitFromUrl}_passed`] = true;
                localProgress[`pass_unit_${unitFromUrl}`] = true;
            } else {
                localProgress[`pass_${materialId}`] = false;
            }

            localProgress[`recent_${materialId}`] = {
                score: finalScoreValue,
                status: passStatus,
                date: new Date().toLocaleDateString()
            };

            localStorage.setItem(progressKey, JSON.stringify(localProgress));
            window.dispatchEvent(new Event('storage'));
            localStorage.setItem('sns_db_update', Date.now().toString());

        } catch (err) {
            console.error("❌ Sync failed:", err);
        }
    };

    const handleRetry = () => {
        setCurrentQ(0);
        setSelected(null);
        setScore(0);
        setIsFinished(false);
        setTimeLeft(quiz?.questions?.length * 60 || 600);
        setShowHint(false);
        setRewardStatus('idle');
    };

    useEffect(() => {
        if (hasRequested.current) return;
        hasRequested.current = true;

        const runGeneration = async () => {
            try {
                // 🛠️ NEW: TRY TO FETCH PRE-GENERATED QUIZ FIRST
                const fetchRes = await fetch(`http://127.0.0.1:8001/get-quiz/${materialId}`);
                if (fetchRes.ok) {
                    const data = await fetchRes.json();
                    if (data.quiz && Array.isArray(data.quiz)) {
                        setQuiz({ questions: data.quiz });
                        setTimeLeft(data.quiz.length * 60);
                        setLoading(false);
                        return;
                    }
                }

                // FALLBACK: Generate if not found
                const published = JSON.parse(localStorage.getItem('published_materials') || '{}');
                const fileEntry = published[`unit_${unitFromUrl}`];
                if (!fileEntry || !fileEntry.fileData) {
                    setError(`Material for Unit ${unitFromUrl} is not published.`);
                    setLoading(false); return;
                }
                const res = await fetch(fileEntry.fileData);
                const blob = await res.blob();
                const file = new File([blob], "study_material.pdf", { type: "application/pdf" });
                const formData = new FormData();
                formData.append('file', file);
                formData.append('unit', unitFromUrl.toString());
                formData.append('materialId', materialId);

                const aiResponse = await fetch('http://127.0.0.1:8001/generate-quiz', {
                    method: 'POST',
                    body: formData
                });
                const data = await aiResponse.json();

                if (data.quiz && Array.isArray(data.quiz)) {
                    setQuiz({ questions: data.quiz });
                    setTimeLeft(data.quiz.length * 60);
                } else { setError(data.error || "Generation failed."); }
            } catch (e) { setError("Local server unreachable."); } finally { setLoading(false); }
        };
        runGeneration();
    }, [unitFromUrl]);

    useEffect(() => {
        if (timeLeft > 0 && !isFinished && quiz) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && quiz && !isFinished) {
            setIsFinished(true);
            syncProgressToBackend(score);
        }
    }, [timeLeft, isFinished, quiz, score]);

    if (loading) return (
        <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center overflow-hidden font-sans">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Generating 10 MCQs...</p>
        </div>
    );

    if (error) return (
        <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-6 overflow-hidden">
            <div className="bg-gray-800 p-8 rounded-2xl border-2 border-gray-700 text-center max-w-sm shadow-2xl">
                <AlertTriangle className="text-red-600 mx-auto mb-4" size={32} />
                <h2 className="text-white font-bold uppercase tracking-tight mb-2 text-lg">Process Error</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">Go Back</button>
            </div>
        </div>
    );

    if (isFinished) {
        const isPassed = (score / (quiz?.questions?.length || 10)) >= 0.5;
        return (
            <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-6 text-white overflow-hidden font-sans">
                <div className={`bg-gray-800 p-10 rounded-3xl border-2 ${isPassed ? 'border-green-600' : 'border-red-600'} text-center max-w-sm w-full shadow-2xl relative overflow-hidden`}>

                    {/* Confetti-like effect for rewards */}
                    {isPassed && rewardStatus === 'credited' && (
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-emerald-500 to-yellow-400 animate-pulse"></div>
                    )}

                    {isPassed ? (
                        <Award className="text-green-500 mx-auto mb-4" size={48} />
                    ) : (
                        <AlertTriangle className="text-red-600 mx-auto mb-4" size={48} />
                    )}

                    <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">
                        {quiz ? Math.round((score / quiz.questions.length) * 100) : 0}%
                    </h2>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${isPassed ? 'text-green-500' : 'text-red-600'}`}>
                        {isPassed ? "UNIT UNLOCKED • PASS" : "FAILED ATTEMPT • PASS MARK 50%"}
                    </p>

                    {/* REWARD UI BOX */}
                    {isPassed && (
                        <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Coins className="text-yellow-500" size={16} />
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                                    {rewardStatus === 'credited' ? '₹10.00 Credited!' : rewardStatus === 'already_claimed' ? 'Incentive Claimed' : 'Processing Reward...'}
                                </span>
                            </div>
                            <p className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-[0.1em]">SNS Academic Merit Program</p>
                        </div>
                    )}

                    {isPassed ? (
                        <button onClick={() => navigate('/csd/materials')} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-[0.3em] hover:bg-green-700 transition-all">Continue to Repository</button>
                    ) : (
                        <button onClick={handleRetry} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-[0.3em] hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={14} /> Retry Assessment
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden font-sans">
            <header className="flex-none bg-gray-900 border-b-2 border-red-600 z-50">
                <div className="max-w-full mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="text-red-600" size={20} />
                        <h1 className="text-[11px] font-black text-white tracking-[0.2em] uppercase">SNS UNIT {unitFromUrl} • 10 MCQS</h1>
                    </div>
                    <div className="bg-gray-800 px-4 py-1.5 rounded-lg border border-gray-700 flex items-center gap-2">
                        <Timer size={14} className="text-red-600" />
                        <span className="text-sm font-bold font-mono text-red-500">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
                <div className="w-full h-1 bg-gray-800">
                    <div
                        className="h-full bg-red-600 transition-all duration-700 ease-in-out shadow-[0_0_8px_#dc2626]"
                        style={{ width: `${((currentQ + 1) / (quiz?.questions?.length || 10)) * 100}%` }}
                    ></div>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto px-6 py-10 flex justify-center custom-scrollbar">
                <div className="max-w-5xl w-full flex flex-col">
                    <div className="mb-3 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-red-600/10 border border-red-600/30 rounded-full text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">
                            QUESTION {currentQ + 1} OF {quiz?.questions?.length || 10}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-white uppercase tracking-tight leading-snug whitespace-pre-wrap mb-4">
                        {quiz?.questions[currentQ]?.q}
                    </h2>

                    <div className="mb-8">
                        {showHint ? (
                            <div className="p-4 bg-blue-900/10 border-l-4 border-blue-500 rounded-r-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <Lightbulb size={14} className="text-blue-400" />
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Intelligence Clue</span>
                                </div>
                                <p className="text-[13px] italic text-gray-300 leading-snug font-medium">
                                    Hint: The correct answer relates to {quiz?.questions[currentQ]?.options[quiz.questions[currentQ].correct]?.substring(0, 4)}...
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowHint(true)}
                                className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-blue-400 transition-colors"
                            >
                                <Lightbulb size={12} /> View Clue
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-8">
                        {quiz?.questions[currentQ]?.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelected(idx)}
                                className={`group p-4 bg-gray-800/40 rounded-xl border-2 transition-all flex items-center gap-4 ${selected === idx ? 'border-red-600 bg-gray-800' : 'border-gray-800'}`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black border-2 ${selected === idx ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className={`text-[13.5px] font-bold uppercase tracking-wide ${selected === idx ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pb-10">
                        <button
                            disabled={selected === null}
                            onClick={() => {
                                const isCorrect = selected === quiz.questions[currentQ].correct;
                                const updatedScore = isCorrect ? score + 1 : score;

                                if (isCorrect) setScore(updatedScore);

                                if (currentQ < quiz.questions.length - 1) {
                                    setCurrentQ(currentQ + 1);
                                    setSelected(null);
                                    setShowHint(false);
                                } else {
                                    setIsFinished(true);
                                    syncProgressToBackend(updatedScore);
                                }
                            }}
                            className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all ${selected === null ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white'}`}
                        >
                            {currentQ === (quiz?.questions?.length || 10) - 1 ? "Complete Assessment" : "Proceed Next"} <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UnitQuiz;