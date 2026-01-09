import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSecurePageData } from '../hooks/useSecurePageData';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Camera,
    CreditCard,
    MapPin,
    Bell,
    LogOut,
    UserCheck,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';

const CSDDashboard = () => {
    const {
        student,
        isAuthenticated,
        isLoading: authLoading,
        handleLogout
    } = useSecurePageData();
    const navigate = useNavigate();

    // --- NEW: STATE FOR CUSTOM TEACHER CONFIG ---
    const [portalConfig, setPortalConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        const fetchPortalConfig = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8001/get-config');
                if (response.ok) {
                    const data = await response.json();
                    setPortalConfig(data);
                }
            } catch (err) {
                console.error("Failed to sync faculty configuration");
            } finally {
                setConfigLoading(false);
            }
        };
        fetchPortalConfig();
    }, []);

    if (authLoading || configLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-sns-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold uppercase tracking-widest">Loading Portal...</p>
            </div>
        );
    }

    if (!isAuthenticated || !student) return null;

    const dashboardFeatures = [
        { title: 'Digital Timetable', icon: <Calendar size={24} />, link: '/csd/timetable', color: 'border-sns-primary', desc: 'Daily Schedules' },
        { title: 'Biometric Attendance', icon: <Camera size={24} />, link: '/csd/attendance', color: 'border-red-500', desc: 'Real-time Status' },
        { title: 'Course Materials', icon: <BookOpen size={24} />, link: '/csd/materials', color: 'border-green-500', desc: 'Notes & Quizzes' },
        { title: 'Fees & Status', icon: <CreditCard size={24} />, link: '#', color: 'border-yellow-500', desc: 'Payment Portal' },
        // UPDATED: Now points to the Digital ID route
        { title: 'Digital ID Card', icon: <UserCheck size={24} />, link: '/digital-id', color: 'border-sns-primary', desc: 'Student Identity' },
        { title: 'Room Locator', icon: <MapPin size={24} />, link: '#', color: 'border-gray-600', desc: 'Campus Navigation' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col font-sans">

            {/* CLEAN HEADER */}
            <header className="w-full bg-gray-900 border-b-4 border-sns-primary sticky top-0 z-50 shadow-xl">
                <div className="max-w-full mx-auto px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="text-sns-primary" size={28} />
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight uppercase">SNS STUDENT PORTAL</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">CSD Department</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-lg">
                            <Bell size={18} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg hover:bg-red-900/20 hover:border-red-500 transition-all font-bold text-xs uppercase"
                        >
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-full mx-auto p-8 lg:p-14 w-full flex-grow">

                {/* STUDENT PROFILE CARD */}
                <div className="bg-gray-800 rounded-2xl border-2 border-gray-700 p-8 mb-10 shadow-lg">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <p className="text-sns-primary font-bold text-xs uppercase tracking-widest mb-1">Welcome back,</p>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">
                                {student.name}
                            </h2>
                            <div className="flex gap-4">
                                <span className="text-sm font-bold text-gray-400">Roll No: <span className="text-white">{student.rollNo}</span></span>
                                <span className="text-sm font-bold text-gray-400">Major: <span className="text-white">Design Thinking</span></span>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:w-36 bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-2xl font-bold text-sns-primary mb-1">{student.avgAttendance}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Attendance</p>
                            </div>
                            <div className="flex-1 lg:w-36 bg-gray-900 p-4 rounded-xl border border-gray-700 text-center">
                                <p className="text-2xl font-bold text-white mb-1">{student.currentCGPA}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">CGPA</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODULES TITLE */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-sns-primary rounded-full"></div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">Main Navigation</h2>
                </div>

                {/* MODULES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardFeatures.map((feature, index) => (
                        <Link
                            to={feature.link}
                            key={index}
                            className="group p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-sns-primary transition-all shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-gray-900 rounded-lg text-sns-primary border border-gray-700 mb-4 group-hover:border-sns-primary transition">
                                    {feature.icon}
                                </div>
                                <ChevronRight size={16} className="text-gray-600 group-hover:text-sns-primary group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="text-md font-bold text-white mb-1 uppercase tracking-tight">{feature.title}</h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{feature.desc}</p>
                        </Link>
                    ))}
                </div>

                {/* MENTOR STATUS SECTION */}
                <div className="mt-10 p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-sns-primary/10 rounded-xl text-sns-primary border border-sns-primary/20">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Academic Mentor</h3>
                            <p className="text-lg font-bold text-white uppercase">
                                {portalConfig?.facultyName || student.mentor}
                            </p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-gray-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sns-primary transition-all">
                        Contact Mentor
                    </button>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="w-full bg-gray-900 border-t border-gray-800 py-6">
                <div className="max-w-7xl mx-auto text-center px-6">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                        © 2025 SNS Institutions • Engineering Excellence
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CSDDashboard;