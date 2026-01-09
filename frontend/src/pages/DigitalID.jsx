import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { Wallet, ArrowLeft, ShieldCheck, CreditCard, RefreshCw, AlertTriangle, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const DigitalID = () => {
    const [studentData, setStudentData] = useState(null);
    const [wallet, setWallet] = useState({ balance: 0 });
    const [transactions, setTransactions] = useState([]); // New state for history
    const [qrToken, setQrToken] = useState("");
    const [timeLeft, setTimeLeft] = useState(55);
    const [error, setError] = useState(null);

    // Pulling student roll from local storage (snsUser) or default for testing
    const rollNo = (() => {
        try {
            const data = JSON.parse(localStorage.getItem('snsUser') || '{}');
            return data.rollNumber || "22CSE01";
        } catch (e) { return "22CSE01"; }
    })();

    const fetchIDData = async () => {
        try {
            setError(null);
            // Feature 1 & 7: Dynamic QR and Misuse Check
            const res = await axios.get(`http://127.0.0.1:8002/api/student-id/generate-qr/${rollNo}`);
            setStudentData(res.data);
            setQrToken(res.data.token);

            // Feature 8: Canteen Wallet Balance Sync
            const walletRes = await axios.get(`http://127.0.0.1:8002/api/student-id/wallet/${rollNo}`);
            setWallet(walletRes.data);

            // NEW: Fetch Transaction History
            const historyRes = await axios.get(`http://127.0.0.1:8002/api/student-id/wallet-logs/${rollNo}`);
            setTransactions(historyRes.data);

            setTimeLeft(55);
        } catch (err) {
            console.error("Sync Error:", err);
            setError(err.response?.data?.detail || "ID Record Not Found in Campus DB");
        }
    };

    useEffect(() => {
        fetchIDData();
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchIDData();
                    return 55;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ERROR STATE UI
    if (error) return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-white uppercase mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6 max-w-xs">{error}</p>
            <button
                onClick={fetchIDData}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase text-xs"
            >
                <RefreshCw size={14} /> Retry Connection
            </button>
        </div>
    );

    // LOADING STATE UI
    if (!studentData) return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-orange-500 font-bold">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="tracking-widest uppercase text-xs">Syncing with Campus Server...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-start p-6 pt-20 font-sans text-slate-900 overflow-y-auto">

            {/* BACK NAVIGATION */}
            <button
                onClick={() => window.history.back()}
                className="fixed top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-all group z-50"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Portal</span>
            </button>

            {/* THE SMART ID CARD */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-full max-w-[360px] relative border-t-[12px] border-orange-500 flex-shrink-0">

                {/* BRANDING HEADER */}
                <div className="p-8 pb-4 text-center">
                    {/* STUDENT PHOTO - NEW FEATURE */}
                    <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 bg-orange-500 rounded-2xl rotate-6 opacity-20"></div>
                        <img
                            src={studentData.photo || "https://static.vecteezy.com/system/resources/previews/005/544/718/original/university-student-graduate-icon-free-vector.jpg"}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-2xl border-4 border-white shadow-lg relative z-10"
                        />
                    </div>
                    <h2 className="text-xl font-black tracking-tighter uppercase leading-none">{studentData.student_name}</h2>
                    <p className="text-[9px] font-bold text-orange-600 mt-1 tracking-[0.2em] uppercase">{studentData.dept || "Department of Engineering"}</p>
                </div>

                {/* DYNAMIC QR CODE BOX */}
                <div className="px-8 flex flex-col items-center">
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 relative group">
                        <QRCodeCanvas
                            value={qrToken}
                            size={190}
                            level="H"
                            includeMargin={false}
                        />
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]"></div>
                    </div>

                    {/* REFRESH TIMER INDICATOR */}
                    <div className="mt-5 py-2 px-5 bg-orange-50 rounded-full border border-orange-100">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                            Refreshes in {timeLeft}s
                        </p>
                    </div>
                </div>

                {/* STUDENT PROFILE & WALLET SECTION */}
                <div className="p-8 mt-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Registration ID</p>
                            <h4 className="text-lg font-black text-slate-800 uppercase mt-1">{rollNo}</h4>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ring-2 ${studentData.status === 'ACTIVE' ? 'bg-green-100 text-green-700 ring-green-50' : 'bg-red-100 text-red-700 ring-red-50'
                            }`}>
                            {studentData.status}
                        </div>
                    </div>

                    {/* FEATURE 8: CANTEEN WALLET DISPLAY */}
                    <div className="bg-slate-900 rounded-3xl p-6 flex items-center justify-between border-b-8 border-orange-500 shadow-2xl group hover:scale-[1.03] transition-all cursor-pointer">
                        <div className="flex items-center gap-5">
                            <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-xl shadow-orange-500/40 group-hover:rotate-12 transition-transform">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Balance</p>
                                <p className="text-2xl font-black text-white leading-none">
                                    ₹{(wallet?.balance || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg text-white">
                            <CreditCard size={16} />
                        </div>
                    </div>

                    {/* NEW: TRANSACTION HISTORY SECTION */}
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <History size={14} className="text-gray-400" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</p>
                        </div>

                        <div className="space-y-3">
                            {transactions.length > 0 ? transactions.map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${tx.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                            {tx.transaction_type === 'CREDIT' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{tx.reason || 'Campus Payment'}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase">{new Date(tx.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className={`text-xs font-black ${tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {tx.transaction_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(0)}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-[10px] text-center text-gray-400 py-4 font-bold uppercase italic">No recent transactions</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ENCRYPTION FOOTER */}
            <div className="mt-8 mb-8 flex items-center gap-2 text-gray-600">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5em]">End-to-End Encrypted</p>
            </div>
        </div>
    );
};

export default DigitalID;