import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [emailOrRoll, setEmailOrRoll] = useState('');
    const [password, setPassword] = useState('');
    const [isTeacher, setIsTeacher] = useState(false); // Role Toggle
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // 🚀 1. Attempt login via AuthContext
        const result = login(emailOrRoll, password, isTeacher);

        if (result.success) {
            // --- 💡 DYNAMIC SESSION FIX START ---
            
            // 1. Standardize the identifier (clean up spaces/case)
            const identifier = emailOrRoll.trim().toUpperCase();
            
            // 2. Create a global Auth User object that all features will use
            const authUser = {
                identifier: identifier,
                email: isTeacher ? identifier : (identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@sns.edu`),
                roll_no: isTeacher ? 'FACULTY' : (identifier.includes('@') ? identifier.split('@')[0] : identifier),
                role: isTeacher ? 'TEACHER' : 'STUDENT',
                loginTime: new Date().toISOString()
            };

            // 3. Save to LocalStorage for all components to access
            localStorage.setItem("auth_user", JSON.stringify(authUser));
            localStorage.setItem("userEmail", authUser.email); // Keep for Quiz Portal compatibility
            
            // --- 💡 DYNAMIC SESSION FIX END ---

            if (isTeacher) {
                alert(`Welcome Professor. Accessing Subject Analysis Portal.`);
                navigate('/teacher/dashboard');
            } else {
                // Save specific student data for UI
                const studentData = {
                    rollNumber: authUser.roll_no,
                    department: "CSD",
                    name: authUser.roll_no, // Will be replaced by real name from backend
                };
                localStorage.setItem("snsUser", JSON.stringify(studentData));
                
                alert(`Login Successful: Welcome ${authUser.roll_no}`);
                navigate('/select-department');
            }
        } else {
            alert(result.message || "Invalid Credentials. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans p-4">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">

                {/* LEFT PANEL */}
                <div className="w-full lg:w-2/5 p-12 bg-[#dc2626] flex flex-col justify-between text-white">
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tighter mb-4 leading-none">
                            SNS <br/>Digital Access
                        </h1>
                        <div className="h-1 w-20 bg-white mb-6"></div>
                        <p className="text-lg text-red-100 max-w-xs leading-relaxed">
                            Your secure gateway to all academic resources and subject analysis.
                        </p>
                    </div>

                    <div className="mt-10">
                         <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                            <p className="text-xs font-bold uppercase tracking-widest text-red-200 mb-1">Portal Status</p>
                            <p className="text-sm font-medium italic">Teacher-Controlled & Secure</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="w-full lg:w-3/5 p-12 bg-white text-gray-900 flex flex-col justify-center">
                    
                    {/* Role Selection Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-fit border border-gray-200">
                        <button 
                            type="button"
                            onClick={() => setIsTeacher(false)}
                            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${!isTeacher ? 'bg-[#dc2626] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Student
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsTeacher(true)}
                            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${isTeacher ? 'bg-[#dc2626] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Teacher
                        </button>
                    </div>

                    <h2 className="text-3xl font-bold mb-2">
                        {isTeacher ? 'Faculty Authentication' : 'Student Login'}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        {isTeacher 
                            ? 'Check student progress and update unit materials.' 
                            : 'Sign in with your official SNS Roll Number and Password.'}
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {isTeacher ? 'Faculty Email ID' : 'Roll Number / Email'}
                            </label>
                            <input
                                type={isTeacher ? "email" : "text"}
                                value={emailOrRoll}
                                onChange={(e) => setEmailOrRoll(e.target.value)}
                                placeholder={isTeacher ? "e.g., ds_prof@sns.edu" : "e.g., SNS1CSD"}
                                required
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-[#dc2626] text-gray-900"
                            />
                        </div>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-[#dc2626] text-gray-900"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-[#dc2626] text-white text-xl font-bold rounded-lg shadow-lg hover:bg-red-700 transition-all transform active:scale-95"
                        >
                            {isTeacher ? 'Access Progress Analysis' : 'Secure Login'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <Link to="#" className="text-sm text-[#dc2626] hover:text-red-700">
                            Trouble Logging In? Contact IT Support.
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;