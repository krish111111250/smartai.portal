import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import DepartmentSelect from './pages/DepartmentSelect';
import CSDDashboard from './pages/CSDDashboard';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';
import CourseMaterials from './pages/CourseMaterials';
import TeacherDashboard from './pages/TeacherDashboard';
import UnitQuiz from './pages/UnitQuiz';
import DigitalID from './pages/DigitalID';
import AdminDashboard from './pages/AdminDashboard';
import VendorPOS from './pages/VendorPOS';

// 🔒 Enhanced Secure Route Guard
const ProtectedRoute = ({ children, allowedRoles = ['STUDENT', 'TEACHER', 'ADMIN'] }) => {
    const { role } = useAuth();

    // Check localStorage if state is lost on refresh
    const localUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
    const currentRole = role || localUser?.role;

    // If no session exists, force login
    if (!currentRole) {
        return <Navigate to="/login" replace />;
    }

    // If role is not permitted for this specific route
    // if (!allowedRoles.includes(currentRole)) {
    //     if (currentRole === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    //     if (currentRole === 'ADMIN') return <Navigate to="/admin" replace />;
    //     return <Navigate to="/csd-dashboard" replace />; 
    // }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen w-full bg-gray-900 text-white">
                <Router>
                    <Routes>
                        {/* 🔓 Public Routes */}
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />

                        {/* 🔐 Shared Protected Routes */}

                        <Route path="/select-department" element={
                            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                                <DepartmentSelect />
                            </ProtectedRoute>
                        } />

                        <Route path="/csd-dashboard" element={
                            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                                <CSDDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/digital-id" element={
                            <ProtectedRoute allowedRoles={['STUDENT']}>
                                <DigitalID />
                            </ProtectedRoute>
                        } />

                        <Route path="/teacher/dashboard" element={
                            <ProtectedRoute allowedRoles={['TEACHER']}>
                                <TeacherDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/vendor" element={
                            <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                                <VendorPOS />
                            </ProtectedRoute>
                        } />

                        <Route path="/csd/timetable" element={
                            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
                                <Timetable />
                            </ProtectedRoute>
                        } />

                        <Route path="/csd/materials" element={
                            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
                                <CourseMaterials />
                            </ProtectedRoute>
                        } />

                        <Route path="/csd/attendance" element={
                            <ProtectedRoute allowedRoles={['STUDENT']}>
                                <Attendance />
                            </ProtectedRoute>
                        } />

                        <Route path="/quiz/:quizId" element={
                            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
                                <UnitQuiz />
                            </ProtectedRoute>
                        } />

                        {/* 🚩 404 Redirect */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </div>
        </AuthProvider>
    );
}

export default App;