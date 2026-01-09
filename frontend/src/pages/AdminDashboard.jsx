import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserCheck, Search, CreditCard, History, Clock, TrendingUp, User } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
    const [rollNo, setRollNo] = useState('');
    const [amount, setAmount] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [studentPreview, setStudentPreview] = useState(null);
    const [dailyTotal, setDailyTotal] = useState(0);

    // 🔄 Fetch everything (Logs + Stats)
    const refreshData = async () => {
        try {
            const [logsRes, statsRes] = await Promise.all([
                axios.get('http://127.0.0.1:8002/api/student-id/admin/wallet-logs'),
                axios.get('http://127.0.0.1:8002/api/student-id/admin/collection-stats')
            ]);
            setTransactions(logsRes.data);
            setDailyTotal(statsRes.data.total_today);
        } catch (err) {
            console.error("Refresh failed");
        }
    };

    // 🔍 Live Search Student as you type
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (rollNo.length >= 3) {
                try {
                    const res = await axios.get(`http://127.0.0.1:8002/api/student-id/admin/search-student/${rollNo}`);
                    setStudentPreview(res.data);
                    setStatusMsg(""); // Clear errors if student found
                } catch (err) {
                    setStudentPreview(null);
                }
            } else {
                setStudentPreview(null);
            }
        }, 500); // Wait for user to stop typing
        return () => clearTimeout(delaySearch);
    }, [rollNo]);

    useEffect(() => {
        refreshData();
    }, []);

    // ⏱️ Auto-clear status messages after 3 seconds
    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const handleUpdateStatus = async (newStatus) => {
        if (!rollNo) return setStatusMsg("⚠️ Enter Roll No");
        try {
            const formData = new FormData();
            formData.append('roll_no', rollNo.trim().toUpperCase());
            formData.append('new_status', newStatus);
            await axios.post('http://127.0.0.1:8002/api/student-id/admin/update-status', formData);
            setStatusMsg(`✅ Status: ${newStatus}`);
            refreshData();
        } catch (err) {
            setStatusMsg("❌ Update Failed");
        }
    };

    const handleTopup = async () => {
        if (!rollNo || !amount) return setStatusMsg("⚠️ Enter Roll No & Amount");
        try {
            const formData = new FormData();
            formData.append('roll_no', rollNo.trim().toUpperCase());
            formData.append('amount', amount);
            await axios.post('http://127.0.0.1:8002/api/student-id/admin/wallet-topup', formData);
            setStatusMsg(`✅ Added ₹${amount}`);
            setAmount('');
            refreshData();
        } catch (err) {
            setStatusMsg("❌ Top-up Failed");
        }
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic text-orange-500">Control Center</h1>
                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Administrator Portal</p>
                    </div>
                    {/* 📊 Daily Stat Chip */}
                    <div className="bg-orange-500/10 border-2 border-orange-500/50 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                        <TrendingUp className="text-orange-500" />
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-400">Today's Collection</p>
                            <p className="text-2xl font-black text-white">₹{dailyTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Identity Management */}
                    <div className="bg-gray-800 p-6 rounded-3xl border-2 border-gray-700 shadow-2xl relative overflow-hidden">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Search size={20} className="text-orange-500" /> Identity Management
                        </h2>
                        <input 
                            className="w-full bg-gray-900 border-2 border-gray-700 p-4 rounded-2xl mb-4 outline-none focus:border-orange-500 text-xl font-bold uppercase transition-all"
                            placeholder="ROLL NO"
                            value={rollNo}
                            onChange={(e) => setRollNo(e.target.value)}
                        />
                        
                        {/* 👤 Student Preview Pop-up */}
                        {studentPreview && (
                            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 border-orange-500">
                                    <User className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase">{studentPreview.name}</p>
                                    <p className="text-xs text-gray-400 uppercase">{studentPreview.dept} • Bal: ₹{studentPreview.balance}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleUpdateStatus('ACTIVE')} className="bg-green-600/20 border-2 border-green-500 text-green-500 p-3 rounded-xl font-black hover:bg-green-600 hover:text-white transition text-xs">ACTIVATE</button>
                            <button onClick={() => handleUpdateStatus('SUSPENDED')} className="bg-red-600/20 border-2 border-red-500 text-red-500 p-3 rounded-xl font-black hover:bg-red-600 hover:text-white transition text-xs">SUSPEND</button>
                        </div>
                    </div>

                    {/* Wallet Recharge */}
                    <div className="bg-gray-800 p-6 rounded-3xl border-2 border-gray-700 shadow-2xl flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-orange-500" /> Wallet Recharge
                            </h2>
                            <input 
                                className="w-full bg-gray-900 border-2 border-gray-700 p-4 rounded-2xl mb-4 outline-none focus:border-orange-500 text-xl font-bold"
                                placeholder="AMOUNT (₹)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <button onClick={handleTopup} className="w-full bg-orange-500 text-black p-4 rounded-2xl font-black hover:bg-orange-600 transition shadow-lg shadow-orange-500/20">
                            LOAD CREDITS
                        </button>
                    </div>
                </div>

                {/* Animated Status Message */}
                {statusMsg && (
                    <div className="mb-8 p-4 bg-gray-800 border-l-4 border-orange-500 rounded-xl text-center font-bold animate-pulse shadow-lg">
                        {statusMsg}
                    </div>
                )}

                {/* Transaction History */}
                <div className="bg-gray-800 rounded-3xl border-2 border-gray-700 shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <History size={20} className="text-orange-500" /> Recent Wallet Activity
                        </h2>
                        <button onClick={refreshData} className="text-[10px] font-black uppercase tracking-widest bg-gray-700 px-4 py-2 rounded-full hover:bg-orange-500 hover:text-black transition">Refresh</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-800 shadow-md">
                                <tr className="bg-gray-900/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {transactions.length > 0 ? transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-700/30 transition border-l-4 border-transparent hover:border-orange-500">
                                        <td className="p-4 font-black text-orange-400 text-sm uppercase">{tx.student_roll}</td>
                                        <td className="p-4 text-green-400 font-black text-sm">+₹{parseFloat(tx.amount).toFixed(2)}</td>
                                        <td className="p-4 text-gray-500 text-[10px] font-bold uppercase">
                                            {new Date(tx.timestamp).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="p-8 text-center text-gray-500 uppercase font-black text-xs">No Records Found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;