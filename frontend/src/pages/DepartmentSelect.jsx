// frontend/src/pages/DepartmentSelect.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const DepartmentSelect = () => {
    const departments = [
        { name: 'Computer Science & Design', code: 'CSD', icon: '💻', status: 'Full Access' },
        { name: 'Computer Science and Engineering', code: 'CSE', icon: '⚙️', status: 'Limited Access' },
        { name: 'Computer Science and Technology', code: 'CST', icon: '💾', status: 'Limited Access' },
        { name: 'Artificial Intelligence & Data Science', code: 'AIDS', icon: '🧠', status: 'Limited Access' },
    ];

    return (
        <div className="min-h-screen w-full bg-gray-900 text-white font-sans flex flex-col">

            {/* HEADER */}
            <header className="w-full bg-gray-900 shadow-xl border-b-4 border-sns-primary py-5">
                <div className="max-w-full mx-auto px-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-extrabold text-sns-primary">SNS</span>
                        <span className="text-xl font-medium">Digital Portal</span>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CENTERED FULL PAGE */}
            <main className="flex-grow flex items-center justify-center w-full px-4 py-10">
                <div className="w-full max-w-full lg:max-w-7xl bg-gray-800 rounded-2xl shadow-2xl border-t-4 border-sns-primary p-12">

                    <h1 className="text-4xl font-extrabold text-center mb-3">
                        Select Your Department
                    </h1>
                    <p className="text-center text-gray-400 text-lg mb-12">
                        Choose your branch to access your personalized student dashboard.
                    </p>

                    {/* GRID FIXED FOR FULL WIDTH */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">

                        {departments.map((dept) => (
                            <Link
                                to={dept.code === 'CSD' ? '/csd-dashboard' : '#'}
                                key={dept.code}
                                className={`
                                    p-8 rounded-xl shadow-lg transition-all duration-300 flex flex-col justify-between
                                    ${dept.code === 'CSD'
                                        ? 'bg-gray-700 border-2 border-sns-primary hover:bg-gray-600'
                                        : 'bg-gray-800 border-2 border-gray-700 opacity-60 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div>
                                    <span className="text-5xl mb-3 block text-sns-primary">{dept.icon}</span>
                                    <h2 className="text-2xl font-bold">{dept.name} ({dept.code})</h2>
                                </div>

                                <p className={`text-sm font-semibold mt-6 ${dept.code === 'CSD' ? 'text-sns-primary' : 'text-gray-500'}`}>
                                    Status: {dept.status}
                                </p>
                            </Link>
                        ))}

                    </div>

                    <p className="text-center text-gray-500 text-sm mt-10">
                        *Only CSD features are fully operational at this time.
                    </p>

                </div>
            </main>
        </div>
    );
};

export default DepartmentSelect;
