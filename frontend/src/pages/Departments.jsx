import React from 'react';
import { Link } from 'react-router-dom';
// Imports the component that provides the full-screen layout (fixed header/footer)
import SecurePageTemplate from '../components/SecurePageTemplate';
// Imports the hook to get authenticated user data
import { useSecurePageData } from '../hooks/useSecurePageData';

const DepartmentSelect = () => {
    // Get student data and authentication status
    const { student, isAuthenticated } = useSecurePageData();

    // Data for the department selection boxes
    const departments = [
        { name: 'Computer Science & Design', code: 'CSD', icon: '💻', status: 'Full Access' },
        { name: 'Computer Science and Engineering', code: 'CSE', icon: '⚙️', status: 'Limited Access' },
        { name: 'Computer Science and Technology', code: 'CST', icon: '💾', status: 'Limited Access' },
        { name: 'Artificial Intelligence & Data Science', code: 'AIDS', icon: '🧠', status: 'Limited Access' },
    ];

    // If not authenticated, the hook will handle redirecting to /login
    if (!isAuthenticated) return null;

    return (
        // The SecurePageTemplate component provides the 'fixed inset-0' and 'flex flex-col' container.
        <SecurePageTemplate 
            title="Department Selection" 
            hideBackButton={true} // Hides the 'Back' button
        >
            
            {/* This internal <div> is placed inside the <main> area of SecurePageTemplate.
                - w-full max-w-5xl mx-auto: ensures correct horizontal centering and max width.
                - flex flex-col justify-center items-center: is the key to achieving vertical centering 
                  of the content block within the available vertical space of the <main> element.
                - flex-grow: ensures this div expands to fill any remaining space.
            */}
            <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center flex-grow">
                
                {/* Header Text Block */}
                <div className="text-center mb-10 w-full">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Select Your Department
                    </h2>
                    <p className="text-lg text-gray-400">
                        Welcome, <span className="text-sns-primary font-semibold">{student.name}</span> ({student.rollNo}). <br/>
                        Please choose your branch to access your personalized student dashboard.
                    </p>
                </div>

                {/* Department Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {departments.map((dept) => (
                        <Link 
                            to={dept.code === 'CSD' ? '/csd-dashboard' : '#'} 
                            key={dept.code}
                            // Styling for the selection box (CSD gets the red border)
                            className={`
                                p-8 rounded-xl shadow-lg transition duration-300 flex flex-col justify-between border-2
                                ${dept.code === 'CSD' 
                                    ? 'bg-gray-800 border-sns-primary hover:bg-gray-700 transform hover:scale-[1.02]' 
                                    : 'bg-gray-800 border-gray-700 opacity-60 cursor-not-allowed hover:bg-gray-750' 
                                }
                            `}
                            onClick={(e) => {
                                // Prevents navigation for departments other than CSD
                                if (dept.code !== 'CSD') e.preventDefault();
                            }}
                        >
                            <div className="flex items-center space-x-4 mb-4">
                                <span className="text-5xl">{dept.icon}</span>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{dept.name}</h2>
                                    <span className="text-sm font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded">Code: {dept.code}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                                <p className={`text-sm font-bold uppercase tracking-wide ${dept.code === 'CSD' ? 'text-sns-primary' : 'text-gray-500'}`}>
                                    Status: {dept.status}
                                </p>
                                {dept.code === 'CSD' && (
                                    <span className="text-white text-sm bg-sns-primary px-3 py-1 rounded-full">Enter Portal &rarr;</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="text-center mt-12 w-full">
                    <p className="text-sm text-gray-500">
                        *Currently, only the CSD module is fully integrated with the secure session ID: {student.authId}.
                    </p>
                </div>
            </div>

        </SecurePageTemplate>
    );
};

export default DepartmentSelect;