// frontend/src/hooks/useSecurePageData.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Persistent Storage Keys ---
const AUTH_STORAGE_KEY = 'snsUser';
const FACE_ID_KEY = 'student-face-register'; 

// --- MOCK STUDENT DATA GENERATOR ---
const getMockStudentData = (rollId) => {
    // 1. Standardize the ID (convert to uppercase, and use the part before @ if it's an email)
    let key = rollId.toUpperCase();
    if (key.includes('@')) {
        key = key.split('@')[0];
    }
    
    switch (key) {
        case 'CSD1':
            return {
                avgAttendance: '92.5%', 
                currentCGPA: '8.8',
                totalClasses: 120, 
                presentClasses: 111,
            };
        case 'CSD3':
            return {
                avgAttendance: '78.0%', 
                currentCGPA: '7.9',
                totalClasses: 120, 
                presentClasses: 94,
            };
        case 'RAMANIKRISH133': // Matches the username part of the email
            return {
                avgAttendance: '70.5%', 
                currentCGPA: '7.2',
                totalClasses: 120, 
                presentClasses: 85,
            };
        default:
            return {
                avgAttendance: '88.5%', 
                currentCGPA: '8.4',
                totalClasses: 120, 
                presentClasses: 106,
            };
    }
};

export const useSecurePageData = () => {
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedAuthData = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedAuthData) {
            try {
                const userData = JSON.parse(storedAuthData);
                
                // Determine the unique student ID reliably
                const rollId = userData.rollNumber || userData.email || 'GUEST';
                
                // 🔥 CRITICAL SYNC: Ensure the unique identifier is set for Quiz Tracking
                // We use the full email if available, otherwise rollNumber
                const identifier = userData.email || rollId;
                localStorage.setItem('userEmail', identifier);

                // Get the dynamic mock statistics based on the determined ID
                const studentStats = getMockStudentData(rollId); 
                
                setStudent({
                    name: userData.name || "John Doe",
                    rollNo: rollId, 
                    department: userData.department || "CSD",
                    mentor: "Dr. A. Saravanan",
                    authId: rollId,
                    email: userData.email, 
                    ...studentStats,
                });
                
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Error parsing auth data:", e);
                localStorage.removeItem(AUTH_STORAGE_KEY);
                localStorage.removeItem('userEmail');
                setIsAuthenticated(false);
                navigate('/'); 
            }
        } else {
            setIsAuthenticated(false);
            // navigate('/'); // Prevent redirect loop during development
        }
        setIsLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('userEmail'); // Cleanup unique identifier
        setStudent(null);
        setIsAuthenticated(false);
        navigate('/');
    };
    
    const handleLoginSuccess = (data) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        // Set the unique key immediately upon successful login
        const identifier = data.email || data.rollNumber;
        localStorage.setItem('userEmail', identifier);
        navigate('/cd/dashboard'); 
    };

    return { 
        student, 
        isAuthenticated, 
        isLoading,
        handleLogout, 
        handleLoginSuccess,
    };
};