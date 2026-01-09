import React from 'react';
import { Link } from 'react-router-dom';
import { useSecurePageData } from '../hooks/useSecurePageData.js'; // Ensure the path is correct

// --- MOCK GRADES DATA ---
const MOCK_GRADES_DATA = {
    // Data for John Doe (22CSD005)
    '22CSD005': [
        {
            semester: 1,
            gpa: 8.8,
            status: 'Promoted',
            subjects: [
                { code: 'HS3171', name: 'English', grade: 'A+', points: 9.0 },
                { code: 'MA3171', name: 'Maths I', grade: 'A', points: 8.5 },
                { code: 'CY3171', name: 'Chemistry', grade: 'B+', points: 7.5 },
                { code: 'CS3171', name: 'Programming in C', grade: 'S', points: 10.0 },
            ],
        },
        {
            semester: 2,
            gpa: 8.0,
            status: 'Promoted',
            subjects: [
                { code: 'HS3271', name: 'Professional English', grade: 'A', points: 8.5 },
                { code: 'MA3271', name: 'Maths II', grade: 'B', points: 7.0 },
                { code: 'PH3271', name: 'Physics', grade: 'A+', points: 9.0 },
                { code: 'CS3271', name: 'Data Structures', grade: 'A', points: 8.5 },
            ],
        },
    ],
    // Data for Jane Smith (713323cd040)
    '713323cd040': [
        {
            semester: 1,
            gpa: 9.1,
            status: 'Promoted',
            subjects: [
                { code: 'HS3171', name: 'English', grade: 'S', points: 10.0 },
                { code: 'MA3171', name: 'Maths I', grade: 'A+', points: 9.0 },
                { code: 'CY3171', name: 'Chemistry', grade: 'A', points: 8.5 },
                { code: 'CS3171', name: 'Programming in C', grade: 'A+', points: 9.0 },
            ],
        },
    ],
};

const Grades = () => {
    // 1. Get authenticated student data
    const { student, isAuthenticated } = useSecurePageData();

    // 2. Security Check (Hook handles redirect)
    if (!isAuthenticated) return null;

    // 3. Fetch specific student's grades using rollNo or authId
    const studentGrades = MOCK_GRADES_DATA[student.authId] || MOCK_GRADES_DATA[student.rollNo] || [];

    // Utility function for grade color
    const getGradeColor = (grade) => {
        if (grade === 'S' || grade === 'A+') return 'text-green-400 font-bold';
        if (grade === 'A' || grade === 'B+') return 'text-yellow-400 font-bold';
        return 'text-red-400 font-bold';
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
            
            {/* Header */}
            <header className="w-full bg-gray-900 shadow-lg border-b-4 border-yellow-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
                    <Link to="/csd-dashboard" className="text-xl font-medium text-white hover:text-yellow-500 transition">
                        ← Back to Dashboard
                    </Link>
                    <div className="text-right text-sm">
                        <p className="text-gray-400">Student: <span className="text-white font-semibold">{student.name}</span></p>
                        <p className="text-gray-500">CGPA: <span className="text-yellow-500 font-bold">{student.currentCGPA || 'N/A'}</span></p>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-7xl mx-auto p-8 lg:p-12 w-full flex-grow">
                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Academic Marks & Grades
                </h1>
                <p className="text-gray-400 mb-8 border-b border-gray-700 pb-2">
                    Detailed results for all completed semesters.
                </p>

                {studentGrades.length === 0 && (
                    <div className="text-center p-10 bg-gray-800 rounded-xl shadow-lg">
                        <p className="text-xl text-yellow-400 font-semibold">
                            No grade records found for this student ID ({student.authId}).
                        </p>
                        <p className="text-gray-500 mt-2">
                            Please contact the Examination Cell if this is incorrect.
                        </p>
                    </div>
                )}

                {studentGrades.map((sem, semIndex) => (
                    <div key={semIndex} className="bg-gray-800 p-6 rounded-xl shadow-xl border-t-4 border-yellow-500 mb-8">
                        
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                            <h2 className="text-2xl font-bold text-yellow-400">
                                Semester {sem.semester} Results
                            </h2>
                            <div className="text-right">
                                <p className="text-lg font-extrabold text-white">GPA: {sem.gpa.toFixed(2)}</p>
                                <p className={`text-sm font-semibold ${sem.status === 'Promoted' ? 'text-green-500' : 'text-red-500'}`}>{sem.status}</p>
                            </div>
                        </div>

                        {/* Subject Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject Code</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Grade Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {sem.subjects.map((sub, subIndex) => (
                                        <tr key={subIndex} className="hover:bg-gray-700 transition duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-400">{sub.code}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{sub.name}</td>
                                            <td className={`px-4 py-3 whitespace-nowrap text-sm ${getGradeColor(sub.grade)}`}>{sub.grade}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{sub.points.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </main>
            
            {/* Footer */}
            <footer className="w-full bg-gray-800 border-t border-gray-700 py-4 mt-auto">
                <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
                    © 2024 SNS Smart Portal. Grades provided by Examination Cell.
                </div>
            </footer>
        </div>
    );
};

export default Grades;