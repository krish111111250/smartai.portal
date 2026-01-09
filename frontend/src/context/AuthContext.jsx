import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// TEACHER MAPPING: Permanently map emails to subjects
const TEACHER_SUBJECT_MAP = {
    "ds_prof@sns.edu": "Data Structures",
    "ramanikrish133@gmail.com": "Data Structures", // Added your email for testing
    "python_prof@sns.edu": "Python Programming",
    "dbms_prof@sns.edu": "DBMS",
    "os_prof@sns.edu": "Operating Systems"
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'STUDENT' or 'TEACHER'

    // Load user from localStorage on boot
    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setRole(parsed.role);
            // Ensure userEmail is available for the Quiz logic
            localStorage.setItem('userEmail', parsed.email);
        }
    }, []);

    const login = (email, password, isTeacherAccount) => {
        // Simple Auth Logic 
        if (isTeacherAccount) {
            // Check if email exists in our teacher map
            if (TEACHER_SUBJECT_MAP[email]) {
                const userData = { 
                    email: email.toLowerCase(), 
                    role: 'TEACHER', 
                    subjectOwned: TEACHER_SUBJECT_MAP[email] 
                };
                setUser(userData);
                setRole('TEACHER');
                localStorage.setItem('auth_user', JSON.stringify(userData));
                localStorage.setItem('userEmail', userData.email);
                return { success: true };
            }
            return { success: false, message: "Unauthorized Teacher Email" };
        } else {
            // Student Logic
            const userData = { email: email.toLowerCase(), role: 'STUDENT' };
            setUser(userData);
            setRole('STUDENT');
            localStorage.setItem('auth_user', JSON.stringify(userData));
            localStorage.setItem('userEmail', userData.email);
            return { success: true };
        }
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('userEmail');
    };

    return (
        <AuthContext.Provider value={{ user, role, login, logout, TEACHER_SUBJECT_MAP }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);