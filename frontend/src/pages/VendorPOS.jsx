import React, { useState, useEffect } from 'react';
import { ShoppingCart, QrCode, ArrowRight, CheckCircle2, XCircle, Utensils, IndianRupee, Camera, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import axios from 'axios';

const VendorPOS = () => {
    const [amount, setAmount] = useState('');
    const [qrToken, setQrToken] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [msg, setMsg] = useState('');
    const [vendorStats, setVendorStats] = useState(0);
    const [isScanning, setIsScanning] = useState(false); // Toggle for Camera

    // Fetch total sales for the vendor today
    const fetchStats = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8002/api/student-id/vendor/sales-stats');
            setVendorStats(res.data.total_sales_today || 0);
        } catch (err) {
            console.error("Stats fetch failed");
        }
    };

    useEffect(() => {
        fetchStats();
    }, [status]);

    const handlePurchase = async (e) => {
        if (e) e.preventDefault();
        if (!amount || !qrToken) {
            setMsg("⚠️ Enter Amount & Scan QR");
            return;
        }

        setStatus('loading');
        try {
            const formData = new FormData();
            formData.append('token', qrToken);
            formData.append('amount', amount);

            const res = await axios.post('http://127.0.0.1:8002/api/student-id/vendor/purchase', formData);

            setStatus('success');
            setMsg(`✅ Paid ₹${amount} - ${res.data.student_name}`);
            setAmount('');
            setQrToken('');

            // Reset to idle after 3 seconds
            setTimeout(() => {
                setStatus('idle');
                setMsg('');
            }, 3000);

        } catch (err) {
            setStatus('error');
            setMsg(err.response?.data?.detail || "❌ Transaction Failed");
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    // Handle Camera Scan Success
    const handleScan = (result) => {
        const token = result[0]?.rawValue;
        if (token) {
            setQrToken(token);
            setIsScanning(false);
            // If amount is already there, you can optionally call handlePurchase() here
        }
    };

    return (
        <div className="p-6 bg-slate-950 min-h-screen text-white font-sans flex flex-col items-center justify-center">
            <div className="max-w-md w-full">

                {/* Header & Stats */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase italic text-emerald-500 flex items-center gap-2">
                            <Utensils /> CANTEEN POS
                        </h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Merchant Terminal</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Today's Sales</p>
                        <p className="text-xl font-black text-emerald-400">₹{vendorStats.toFixed(2)}</p>
                    </div>
                </div>

                {/* Main Transaction Card */}
                <div className={`bg-slate-900 p-8 rounded-[2.5rem] border-4 transition-all duration-500 shadow-2xl ${status === 'success' ? 'border-emerald-500 shadow-emerald-500/20' :
                        status === 'error' ? 'border-red-500 shadow-red-500/20' : 'border-slate-800'
                    }`}>

                    {status === 'success' ? (
                        <div className="text-center py-10 animate-in zoom-in">
                            <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-4" />
                            <h2 className="text-2xl font-black uppercase">Payment Received</h2>
                            <p className="text-slate-400 mt-2 font-bold">{msg}</p>
                        </div>
                    ) : status === 'error' ? (
                        <div className="text-center py-10 animate-in shake">
                            <XCircle size={80} className="mx-auto text-red-500 mb-4" />
                            <h2 className="text-2xl font-black uppercase">Payment Failed</h2>
                            <p className="text-slate-400 mt-2 font-bold">{msg}</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePurchase} className="space-y-6">
                            {/* Amount Input */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Sale Amount</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-slate-950 border-2 border-slate-800 p-5 pl-12 rounded-3xl text-3xl font-black outline-none focus:border-emerald-500 transition-all"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* QR Token Input & Scanner */}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Student Verification</label>

                                {isScanning ? (
                                    <div className="relative mt-2 rounded-3xl overflow-hidden border-2 border-emerald-500 aspect-square">
                                        <Scanner onScan={handleScan} />
                                        <button
                                            type="button"
                                            onClick={() => setIsScanning(false)}
                                            className="absolute top-4 right-4 p-2 bg-red-500 rounded-full z-10 text-white"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Scan or Paste Token"
                                                className="w-full bg-slate-950 border-2 border-slate-800 p-5 pl-12 rounded-3xl text-xs font-mono outline-none focus:border-emerald-500 transition-all"
                                                value={qrToken}
                                                onChange={(e) => setQrToken(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setQrToken(''); setIsScanning(true); }}
                                            className="p-5 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <Camera size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading' || isScanning}
                                className="w-full bg-emerald-500 text-slate-950 p-5 rounded-3xl font-black text-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {status === 'loading' ? "PROCESSING..." : (
                                    <>CONFIRM PURCHASE <ArrowRight /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center mt-8 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                    Secure Campus Payment System v2.0
                </p>
            </div>
        </div>
    );
};

export default VendorPOS;