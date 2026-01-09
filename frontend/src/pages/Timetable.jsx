// frontend/src/pages/Timetable.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const Timetable = () => {
    // --- CSD 3rd Semester Timetable Data ---
    // This data structure represents a typical college timetable (time slots and subjects)
    const timetableData = [
        { time: '09:00 - 10:00', MON: 'Data Structures (T)', TUE: 'Python Lab (P)', WED: 'DBMS (T)', THU: 'OS (T)', FRI: 'Web Dev (T)' },
        { time: '10:00 - 11:00', MON: 'DBMS (T)', TUE: 'Web Dev Lab (P)', WED: 'Data Structures (T)', THU: 'Python (T)', FRI: 'DBMS (T)' },
        { time: '11:00 - 12:00', MON: 'Python (T)', TUE: 'DBMS (T)', WED: 'OS (T)', THU: 'Elective I (T)', FRI: 'Web Dev (T)' },
        { time: '12:00 - 01:00', MON: '--- LUNCH ---', TUE: '--- LUNCH ---', WED: '--- LUNCH ---', THU: '--- LUNCH ---', FRI: '--- LUNCH ---' },
        { time: '01:00 - 02:00', MON: 'Web Dev Lab (P)', TUE: 'OS (T)', WED: 'Python (T)', THU: 'Data Structures (T)', FRI: 'Elective I (T)' },
        { time: '02:00 - 03:00', MON: 'Web Dev Lab (P)', TUE: 'DBMS Lab (P)', WED: 'Aptitude (T)', THU: 'DBMS Lab (P)', FRI: 'Data Structures (T)' },
        { time: '03:00 - 04:00', MON: 'Library', TUE: 'DBMS Lab (P)', WED: 'Mentoring', THU: 'Sports', FRI: 'NSS' },
    ];

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    return (
        // Main Container - Black Background
        <div className="min-h-screen bg-gray-900 flex flex-col font-sans">
            
            {/* Header (Consistent look) */}
            <header className="w-full bg-gray-900 shadow-lg sticky top-0 z-20 border-b-4 border-sns-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl font-extrabold text-sns-primary">CSD</span>
                        <span className="text-xl font-medium text-white">Digital Timetable</span>
                    </div>
                    <Link 
                        to="/csd-dashboard" 
                        className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-md hover:bg-gray-700 transition duration-300 text-sm"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 lg:p-12 w-full flex-grow">
                
                <h1 className="text-4xl font-extrabold text-white mb-8 border-b border-gray-700 pb-2">
                    CSD 3rd Semester Weekly Timetable
                </h1>
                
                <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-2xl">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-extrabold text-sns-primary uppercase tracking-wider">
                                    Time Slot
                                </th>
                                {days.map((day) => (
                                    <th key={day} className="px-6 py-3 text-center text-sm font-extrabold text-white uppercase tracking-wider">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {timetableData.map((row, index) => (
                                <tr 
                                    key={index} 
                                    className={`
                                        ${row.time.includes('LUNCH') ? 'bg-gray-900 text-sns-primary font-extrabold' : 'bg-gray-800 hover:bg-gray-700'} 
                                        transition duration-150
                                    `}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sns-primary border-r border-gray-700">
                                        {row.time}
                                    </td>
                                    {days.map((day) => (
                                        <td 
                                            key={day} 
                                            className={`
                                                px-6 py-4 whitespace-normal text-center text-sm
                                                ${row.time.includes('LUNCH') ? 'text-sns-primary' : (row[day].includes('(P)') ? 'text-yellow-400' : 'text-gray-300')}
                                            `}
                                        >
                                            {row[day]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 p-4 bg-gray-800 rounded-lg text-center shadow-lg border-l-4 border-sns-primary">
                    <p className="text-sm text-gray-400">
                        Legend: (T) - Theory Class | (P) - Practical/Lab Session | Time is approximate.
                    </p>
                </div>
            </main>

            {/* Footer - Dark Gray */}
            <footer className="w-full bg-gray-800 border-t border-gray-700 py-4 mt-auto">
                <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
                    © 2025 SNS Smart Portal. Timetable data is current for CSD 3rd Semester.
                </div>
            </footer>
        </div>
    );
};

export default Timetable;