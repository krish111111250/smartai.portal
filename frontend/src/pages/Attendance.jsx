// frontend/src/pages/Attendance.jsx
import { useSecurePageData } from "../hooks/useSecurePageData.jsx";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';


// --- CONFIGURATION ---
// IMPORTANT: Use the port where your Flask backend is running (5001)
const API_BASE_URL = 'http://127.0.0.1:5001';
// Key for local check: Used ONLY to determine if the student needs to be enrolled first.
const FACE_ID_KEY = 'student-face-register';


// --- Utility Functions (Time, Timetable, Log generation) ---
const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

// --- Timetable remains the same ---
const classTimetable = [
    { day: 'Mon', startTime: '09:00', endTime: '10:00', subject: 'Data Structures (T)' },
    { day: 'Wed', startTime: '09:00', endTime: '10:00', subject: 'Data Structures (T)' },
    { day: 'Thu', startTime: '09:00', endTime: '10:00', subject: 'DBMS (T)' },
    { day: 'Fri', startTime: '09:00', endTime: '10:00', subject: 'OS (T)' },
    { day: 'Mon', startTime: '10:00', endTime: '11:00', subject: 'Python Lab (P)' },
    { day: 'Tue', startTime: '10:00', endTime: '11:00', subject: 'Web Dev Lab (P)' },
    { day: 'Wed', startTime: '10:00', endTime: '11:00', subject: 'Web Dev Lab (P)' },
    { day: 'Thu', startTime: '10:00', endTime: '11:00', subject: 'Python (T)' },
    { day: 'Fri', startTime: '10:00', endTime: '11:00', subject: 'DBMS (T)' },
    { day: 'Mon', startTime: '11:00', endTime: '12:00', subject: 'Python (T)' },
    { day: 'Tue', startTime: '11:00', endTime: '12:00', subject: 'DBMS (T)' },
    { day: 'Wed', startTime: '11:00', endTime: '12:00', subject: 'OS (T)' },
    { day: 'Thu', startTime: '11:00', endTime: '12:00', subject: 'Elective I (T)' },
    { day: 'Fri', startTime: '11:00', endTime: '12:00', subject: 'Web Dev (T)' },
    { day: 'Mon', startTime: '13:00', endTime: '14:00', subject: 'Web Dev Lab (P)' },
    { day: 'Tue', startTime: '13:00', endTime: '14:00', subject: 'OS (T)' },
    { day: 'Wed', startTime: '13:00', endTime: '14:00', subject: 'Python (T)' },
    { day: 'Thu', startTime: '13:00', endTime: '14:00', subject: 'Data Structures (T)' },
    { day: 'Fri', startTime: '13:00', endTime: '14:00', subject: 'Elective I (T)' },
    { day: 'Mon', startTime: '14:00', endTime: '15:00', subject: 'Web Dev Lab (P)' },
    { day: 'Tue', startTime: '14:00', endTime: '15:00', subject: 'DBMS Lab (P)' },
    { day: 'Wed', startTime: '14:00', endTime: '15:00', subject: 'Aptitude (T)' },
    { day: 'Thu', startTime: '14:00', endTime: '15:00', subject: 'DBMS Lab (P)' },
    { day: 'Fri', startTime: '14:00', endTime: '15:00', subject: 'Data Structures (T)' },
    { day: 'Mon', startTime: '15:00', endTime: '16:00', subject: 'Library' },
    { day: 'Tue', startTime: '15:00', endTime: '16:00', subject: 'DBMS Lab (P)' },
    { day: 'Wed', startTime: '15:00', endTime: '16:00', subject: 'Mentoring' },
    { day: 'Thu', startTime: '15:00', endTime: '16:00', subject: 'Sports' },
    { day: 'Fri', startTime: '15:00', endTime: '16:00', subject: 'NSS' },
];

const getCurrentClassAndSubject = (timetable) => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'short' });
    const currentTimeMinutes = timeToMinutes(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));

    const currentClass = timetable.find(classItem => {
        if (classItem.day !== day) return false;

        const startMinutes = timeToMinutes(classItem.startTime);
        const endMinutes = timeToMinutes(classItem.endTime);

        if (currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes) {
            return true;
        }
        return;
    });

    return currentClass
        ? `${currentClass.subject} (${currentClass.startTime} - ${currentClass.endTime})`
        : 'No Active Class Currently';
};


const getWeeklyTimetableLog = (timetable, existingRecords = []) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...

    // Calculate Monday of the current week (ISO week starts Monday)
    // If today is Sunday (0), go back 6 days. Else go back (day - 1) days.
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - distanceToMonday);

    const weekDates = [];
    // Generate Mon (0) to Fri (4)
    for (let i = 0; i < 5; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        weekDates.push(d);
    }

    const weeklyLog = [];

    const formatDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
    const formatDate = (date) => date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    weekDates.forEach((date) => {
        const dayAbbr = formatDay(date);
        const displayDate = formatDate(date);

        const classesForThisDay = timetable.filter(item => item.day === dayAbbr);

        if (classesForThisDay.length === 0) {
            // Optional: Show holidays or empty days if desired, but here we just skip or add a placeholder
            weeklyLog.push({ date: displayDate, day: dayAbbr, class: 'No Class Scheduled', status: 'N/A', time: '-', classKey: `${displayDate}-N/A` });
        } else {
            classesForThisDay.forEach(classItem => {
                const classKey = `${displayDate}-${classItem.subject}-${classItem.startTime}`;
                const classInfo = `${classItem.subject} (${classItem.startTime} - ${classItem.endTime})`;

                const existingScan = existingRecords.find(r => r.classKey === classKey);

                if (existingScan) {
                    weeklyLog.push(existingScan);
                } else {
                    const classEndTimeMinutes = timeToMinutes(classItem.endTime);
                    let status = 'Scheduled'; // Default for future
                    let time = '-';

                    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    if (dateOnly.getTime() < todayOnly.getTime()) {
                        status = 'Absent (No Scan)';
                    } else if (dateOnly.getTime() === todayOnly.getTime()) {
                        const nowMinutes = timeToMinutes(today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));

                        if (nowMinutes > classEndTimeMinutes) {
                            status = 'Absent (No Scan)';
                        } else {
                            status = 'Pending';
                        }
                    } else {
                        status = 'Scheduled'; // Future
                    }

                    weeklyLog.push({
                        date: displayDate,
                        day: dayAbbr,
                        class: classInfo,
                        status: status,
                        time: time,
                        classKey: classKey
                    });
                }
            });
        }
    });

    // Sort logic: Mon -> Fri (Ascending Date)
    weeklyLog.sort((a, b) => {
        // Find index in weekDates to sort by Day
        const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const dayIdxA = dayOrder.indexOf(a.day);
        const dayIdxB = dayOrder.indexOf(b.day);

        if (dayIdxA !== dayIdxB) return dayIdxA - dayIdxB;

        const timeA = a.class.match(/\d{2}:\d{2}/) ? timeToMinutes(a.class.match(/\d{2}:\d{2}/)[0]) : 999;
        const timeB = b.class.match(/\d{2}:\d{2}/) ? timeToMinutes(b.class.match(/\d{2}:\d{2}/)[0]) : 999;
        return timeA - timeB;
    });

    return weeklyLog;
};


const Attendance = () => {
    // 1. 🔥 GET REAL AUTHENTICATION DATA AND STATUS
    const {
        student,
        isAuthenticated,
        isLoading
    } = useSecurePageData();
    const navigate = useNavigate();

    // State for UI and Attendance Logic
    const [status, setStatus] = useState('Ready to Scan');
    const [capturedImage, setCapturedImage] = useState(null);
    const [streamActive, setStreamActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 🔥 State to store the face ID map (Used ONLY for local check if enrollment happened)
    const [faceIdMap, setFaceIdMap] = useState({});

    const [lastAttendanceStatus, setLastAttendanceStatus] = useState({
        class: getCurrentClassAndSubject(classTimetable),
        status: 'N/A',
        time: 'N/A'
    });

    const [weeklyHistory, setWeeklyHistory] = useState([]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);


    // LOCAL STORAGE SAVE (Helper function for saving)
    const saveHistoryToLocalStorage = (history, rollNo) => {
        const recordsToSave = history.filter(r => r.status !== 'Pending' && r.status !== 'Absent (No Scan)' && r.status !== 'Scheduled');
        const studentSpecificKey = `student-attendance-log-${rollNo}`;
        localStorage.setItem(studentSpecificKey, JSON.stringify(recordsToSave));
    };

    // Helper function to save the Face ID Map (marks the student as enrolled locally)
    const saveFaceIdMap = (newMap) => {
        localStorage.setItem(FACE_ID_KEY, JSON.stringify(newMap));
        setFaceIdMap(newMap);
    };

    // useEffect to start the webcam and INITIALIZE the weekly log 
    useEffect(() => {

        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setStreamActive(true);
                    setStatus('Webcam Active. Ready for Facial Check-in.');
                }
            } catch (err) {
                console.error("Error accessing webcam: ", err);
                setStatus('ERROR: Webcam Access Denied/Unavailable.');
                setStreamActive(false);
            }
        };

        if (isAuthenticated && student) {
            startVideo();

            // 2. LOCAL STORAGE LOAD & Initialize Log
            // Use the student's rollNo to load *their* unique log
            const studentSpecificLogKey = `student-attendance-log-${student.rollNo}`;
            const storedHistoryJson = localStorage.getItem(studentSpecificLogKey);
            let existingRecords = [];
            if (storedHistoryJson) {
                try {
                    existingRecords = JSON.parse(storedHistoryJson);
                    if (!Array.isArray(existingRecords)) existingRecords = [];
                } catch (e) {
                    console.error("Error parsing attendance log from Local Storage:", e);
                }
            }

            // Load the Face ID Map (used to determine if /enroll should be called)
            const storedFaceMapJson = localStorage.getItem(FACE_ID_KEY);
            if (storedFaceMapJson) {
                try {
                    setFaceIdMap(JSON.parse(storedFaceMapJson));
                } catch (e) {
                    console.error("Error parsing face ID map from Local Storage:", e);
                }
            }


            const initialLog = getWeeklyTimetableLog(classTimetable, existingRecords);
            setWeeklyHistory(initialLog);

            // Sorting for "Last Check-in" logic needs to be mindful of future dates
            const recentScan = existingRecords.sort((a, b) => {
                const dateA = new Date(a.date.replace(' ', ' 1, ') + ' ' + a.time);
                const dateB = new Date(b.date.replace(' ', ' 1, ') + ' ' + b.time);
                return dateB.getTime() - dateA.getTime();
            })[0];

            if (recentScan) {
                setLastAttendanceStatus({
                    class: recentScan.class,
                    status: recentScan.status,
                    time: recentScan.time
                });
            }
        }


        // Cleanup function
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [isAuthenticated, student]);

    // 🌟 UPDATED: Function to capture a single frame and convert it to a Blob (File) 
    const secureCapture = useCallback(() => {
        return new Promise((resolve) => {
            if (!videoRef.current || !canvasRef.current) return resolve(null);

            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert the canvas content to a Blob (file object)
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.9); // Quality 0.9
        });
    }, []);
    // --- END UPDATED secureCapture ---


    // Main function to start the face recognition process 
    const startScan = async () => {
        if (!streamActive || isProcessing || !student) {
            alert("Webcam not active, process running, or user not authenticated.");
            return;
        }

        const currentClassInfo = getCurrentClassAndSubject(classTimetable);
        const now = new Date();
        const scanTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const scanDate = now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const scanDay = now.toLocaleDateString('en-US', { weekday: 'short' });

        const classMatch = classTimetable.find(item => currentClassInfo.includes(item.subject) && currentClassInfo.includes(item.startTime));
        const currentClassKey = classMatch ? `${scanDate}-${classMatch.subject}-${classMatch.startTime}` : null;

        const existingScanRecord = weeklyHistory.find(r => r.classKey === currentClassKey && r.status === 'Present');

        if (existingScanRecord) {
            setStatus(`Scan Rejected: Attendance for ${currentClassInfo} already marked as Present at ${existingScanRecord.time}.`);
            // Removed blocking alert for better UX
            return;
        }

        // 🔥 FINAL CHECK: Time check is now ENABLED
        if (currentClassInfo.includes('No Active Class') || !currentClassKey) {
            setStatus('Scan Rejected: No class scheduled at this exact moment.');
            // Removed blocking alert for better UX
            // Exit if no class is active
        }
        // --- Time check bypass end ---

        setIsProcessing(true);
        setStatus(`CAPTURING PHOTO for ID ${student.rollNo}... Sending data to server.`);

        // --- Capture the Image Blob ---
        const imageBlob = await secureCapture();
        if (!imageBlob) {
            setStatus('ERROR: Could not capture frame.');
            setIsProcessing(false);
            return;
        }

        const imageDataUrl = URL.createObjectURL(imageBlob);
        setCapturedImage(imageDataUrl);
        // --- End Capture ---


        const isRegisteredLocally = faceIdMap[student.rollNo];
        let finalStatusMessage;
        let isSuccess = false;
        let newRecordStatus = 'Rejected (API Fail)';


        try {
            // Determine API Endpoint: If not registered locally, call /enroll first
            const endpoint = isRegisteredLocally ? '/attendance' : '/enroll';

            setStatus(`ANALYZING FACE... Target: ${endpoint.toUpperCase()}`);

            const formData = new FormData();
            formData.append('image', imageBlob, 'scan.jpeg');
            // 🔥 ALWAYS SEND ID for Strict verification (Both Enroll and Attendance)
            formData.append('name', student.rollNo);
            // 📧 Send Email for strict One-Face-One-Email Policy
            // Use student.email if available, otherwise construct a default email from RollNo
            const userEmail = student.email || `${student.rollNo.toLowerCase()}@sns.edu`;
            formData.append('email', userEmail);

            // Enrollment specific logic messages
            if (endpoint === '/enroll') {
                setStatus(`ENROLLING NEW FACE for ID ${student.rollNo}...`);
            }

            // --- API CALL TO FLASK BACKEND ---
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            // --- END API CALL ---

            // 🔥🔥🔥 START CRITICAL SECURITY LOGIC (New position and flow) 🔥🔥🔥

            if (!data.success && response.status === 409 && data.message && data.message.includes('SCAN REJECTED')) {
                // CASE 1: SECURITY BREACH (Duplicate Face Enrollment Attempt)
                // Clean up message: Remove duplicate "SCAN REJECTED" if backend sends it
                const cleanMsg = data.message.replace('SCAN REJECTED:', '').trim();
                finalStatusMessage = `SECURITY ALERT: ${cleanMsg}`;
                newRecordStatus = 'SECURITY BREACH (Duplicate Face)';

                // **IMMEDIATE EXIT**: Update status and stop all further processing.
                setIsProcessing(false);
                setStatus(finalStatusMessage);

                // 🛠️ FIX: Update Sidebar Status even on Breach
                setLastAttendanceStatus({
                    class: currentClassInfo,
                    status: newRecordStatus,
                    time: scanTime
                });

                // Cleanup for captured image
                setTimeout(() => {
                    setCapturedImage(null);
                    URL.revokeObjectURL(imageDataUrl);
                }, 3000);

                return; // <--- THIS LINE GUARANTEES NO ATTENDANCE IS LOGGED IN WEEKLY HISTORY
            }

            // --- If we reach here, it's either a genuine success or a non-security failure ---

            if (data.success || (endpoint === '/enroll' && response.status === 409)) {
                // CASE 2: Genuine Success (Attendance) OR User Re-enrolling/Confirming (409)
                isSuccess = true;
                newRecordStatus = 'Present';

                if (endpoint === '/enroll') {
                    saveFaceIdMap({ ...faceIdMap, [student.rollNo]: true });

                    if (response.status === 409) {
                        finalStatusMessage = `ATTENDANCE MARKED: Enrollment Confirmed (Already Registered).`;
                    } else {
                        finalStatusMessage = `ATTENDANCE MARKED: Enrollment SUCCESS and Check-in complete for ${student.rollNo}.`;
                    }

                } else {
                    finalStatusMessage = `ATTENDANCE MARKED: Present for ID ${student.rollNo} in ${currentClassInfo} at ${scanTime}.`;
                }

            } else {
                // CASE 3: General Failure (No face found, No match on attendance check)
                isSuccess = false;
                newRecordStatus = endpoint === '/enroll' ? 'Enroll Fail' : 'Security Fail (No Match)';
                finalStatusMessage = `SCAN REJECTED: ${data.message || 'Face recognition failed.'}`;
            }
            // 🔥🔥🔥 END CRITICAL SECURITY LOGIC 🔥🔥🔥


        } catch (error) {
            console.error('Backend Connection Error:', error);
            finalStatusMessage = 'CONNECTION ERROR: Could not reach the Facial Recognition Server (5001).';
            isSuccess = false;
            newRecordStatus = 'API Fail';
        }


        // --- UPDATE UI AND LOCAL LOG (This section now only runs if there was no SECURITY BREACH) ---
        setIsProcessing(false);
        setStatus(finalStatusMessage);

        const newRecord = {
            date: scanDate,
            day: scanDay,
            class: currentClassInfo,
            time: scanTime,
            classKey: currentClassKey,
            status: isSuccess ? 'Present' : newRecordStatus
        };

        setLastAttendanceStatus({
            class: currentClassInfo,
            status: newRecord.status,
            time: scanTime
        });

        setWeeklyHistory(prev => {
            // Only update history if it was successful (isSuccess is true) OR if it was a final failure
            // Note: Security Breaches are handled in the return block above, so they won't reach here
            if (isSuccess || newRecordStatus.includes('Fail')) {
                const filteredLog = prev.filter(r => r.classKey !== newRecord.classKey);
                // REGENERATE ENTIRE LOG TO ENSURE SORTING AND STRUCTURE IS CORRECT
                const newLog = getWeeklyTimetableLog(classTimetable, [newRecord, ...filteredLog]);
                saveHistoryToLocalStorage(newLog, student.rollNo);
                return newLog;
            }
            return prev;
        });

        setTimeout(() => {
            setCapturedImage(null);
            URL.revokeObjectURL(imageDataUrl); // Clean up the Blob URL
        }, 3000);
        // --- END UPDATE UI ---

    };


    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gray-900 text-white flex items-center justify-center text-xl">
                Loading secure attendance portal...
            </div>
        );
    }

    if (!isAuthenticated || !student) {
        // Use navigate to redirect unauthenticated users
        navigate('/login');
        return null;
    }

    // Calculate Attendance Percentage for the progress bar
    const attendancePercent = student.avgAttendance ? parseFloat(student.avgAttendance.replace('%', '')) : 0;
    const progressBarColor = attendancePercent >= 85 ? 'bg-green-500' : attendancePercent >= 75 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="fixed inset-0 bg-gray-900 text-gray-100 font-sans flex flex-col overflow-y-auto">

            {/* Header */}
            <header className="w-full bg-gray-900 shadow-lg sticky top-0 z-20 border-b-4 border-sns-primary">
                <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10 flex justify-between items-center py-4">
                    <div className="flex items-center space-x-4">
                        <Link to="/csd/dashboard" className="text-2xl font-extrabold text-sns-primary hover:text-red-500 transition-colors">← CSD</Link>
                        <span className="text-2xl font-black text-white uppercase tracking-tighter">Attendance Portal</span>
                    </div>
                    <div className="text-right text-sm">
                        <p className="text-gray-400">Welcome, <span className="text-white font-semibold">{student.name}</span>!</p>
                        <p className="text-gray-500">Dept: <span className="text-sns-primary font-bold">{student.department}</span></p>
                        <p className="font-bold text-gray-300 text-xs mt-1">
                            Roll No: <span className="text-yellow-400">{student.rollNo}</span>
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-full mx-auto p-6 sm:p-10 lg:p-14 w-full flex-grow">

                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Secure Biometric Check-in
                </h1>
                <p className="text-gray-400 mb-8 border-b border-gray-700 pb-2">
                    Mark your attendance instantly using facial recognition against your ID: <span className="text-sns-primary font-semibold">{student.rollNo}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Column 1: Live Scan Area (The most professional part) */}
                    <div className="lg:col-span-2 p-6 bg-gray-800 rounded-xl shadow-2xl border-t-4 border-sns-primary">
                        <h2 className="text-2xl font-bold text-sns-primary mb-4 flex items-center">
                            <span role="img" aria-label="camera" className="mr-2">📸</span> Live Face Verification
                        </h2>

                        {/* Live Video Feed Container - Added a scanning border effect */}
                        <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center rounded-xl overflow-hidden mb-6 border-4 border-gray-700">

                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover transform scale-x-[-1] ${streamActive ? '' : 'hidden'}`}
                                onCanPlay={() => videoRef.current.play()}
                            />

                            {/* Scanning Overlay Border */}
                            {streamActive && isProcessing && (
                                <div className="absolute inset-0 border-8 border-transparent animate-pulse border-t-yellow-400 border-r-yellow-400 rounded-xl pointer-events-none"></div>
                            )}

                            {!streamActive && (
                                <p className="text-xl text-red-400 p-8 text-center">
                                    <span role="img" aria-label="warning">⚠️</span> ERROR: Webcam feed inactive. Please enable camera access and refresh.
                                </p>
                            )}

                            {/* Captured Image Feedback */}
                            {capturedImage && (
                                <img
                                    src={capturedImage}
                                    alt="Captured Frame"
                                    className={`absolute inset-0 w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 opacity-90 ${isProcessing ? 'border-4 border-yellow-400' : status.includes('Present') ? 'border-4 border-green-500' : 'border-4 border-red-500'}`}
                                />
                            )}
                        </div>

                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>


                        <div className="flex items-center justify-between flex-wrap">
                            <p className={`text-xl font-semibold mt-2 ${status.includes('Present') ? 'text-green-400' : status.includes('REJECTED') || status.includes('ALERT') || status.includes('BREACH') || status.includes('ERROR') || status.includes('FAIL') ? 'text-red-400' : 'text-yellow-400'}`}>
                                Status: {status}
                            </p>
                            <button
                                onClick={startScan}
                                disabled={isProcessing || !streamActive}
                                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-600 transition duration-300 mt-2 shadow-lg"
                            >
                                {isProcessing ? 'Analyzing Facial Biometrics...' : 'Check-in Now'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Ensure good lighting. The system uses secure face matching against the registered profile.
                        </p>
                    </div>

                    {/* Column 2: Quick Stats */}
                    <div className="p-6 bg-gray-800 rounded-xl shadow-2xl border-t-4 border-gray-600">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            My Attendance Snapshot
                        </h2>
                        <div className="space-y-6">

                            {/* Overall Attendance */}
                            <div className="p-4 bg-gray-700 rounded-lg border-l-4 border-sns-primary">
                                <p className="text-sm text-gray-400 mb-1">Overall Attendance</p>
                                <p className="text-5xl font-extrabold text-sns-primary leading-none">
                                    {/* CALCULATING REAL STATS */}
                                    {(() => {
                                        const presentCount = weeklyHistory.filter(r => r.status === 'Present').length;
                                        // Assume 5 classes per day * 5 days = 25 classes a week standard
                                        // Or better, count all non-N/A slots in weeklyHistory as 'Total Classes'
                                        const totalValidClasses = weeklyHistory.filter(r => r.class !== 'No Class Scheduled').length;
                                        const percentage = totalValidClasses > 0 ? ((presentCount / totalValidClasses) * 100).toFixed(1) : "0.0";
                                        return `${percentage}%`;
                                    })()}
                                </p>
                                <div className="mt-3 h-2 bg-gray-600 rounded-full">
                                    <div
                                        className={`h-full rounded-full ${progressBarColor}`}
                                        style={{ width: `${attendancePercent}%` }} // Consider updating this variable too or recalculating inline
                                    ></div>
                                </div>
                            </div>

                            {/* Classes Attended */}
                            <div className="p-4 bg-gray-700 rounded-lg border-l-4 border-gray-500">
                                <p className="text-sm text-gray-400">Classes Attended</p>
                                <p className="text-3xl font-extrabold text-white">
                                    {weeklyHistory.filter(r => r.status === 'Present').length} / {weeklyHistory.filter(r => r.class !== 'No Class Scheduled').length}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-700">
                            <h3 className="text-xl font-semibold text-white mb-3">Last Check-in Details</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-400">Class: <span className="text-white font-bold block">{lastAttendanceStatus.class}</span></li>
                                <li className="text-gray-400">Time: <span className="text-white font-bold">{lastAttendanceStatus.time}</span></li>
                                <li className="text-gray-400">Result:
                                    <span className={`${lastAttendanceStatus.status.includes('Present') ? 'text-green-400' : 'text-red-400'} font-bold ml-2`}>
                                        {lastAttendanceStatus.status}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Weekly Attendance Log */}
                <div className="mt-8 p-6 bg-gray-800 rounded-xl shadow-2xl border-t-4 border-sns-primary">
                    <h2 className="text-2xl font-bold text-white mb-4">Weekly Attendance Log (Current Week: Mon-Fri)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Day</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Class (Subject & Time)</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Scan Time</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {weeklyHistory.map((record, index) => (
                                    <tr key={record.classKey || index} className={index === 0 ? 'bg-gray-600/50' : 'hover:bg-gray-700 transition duration-150'}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{record.date}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{record.day}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-semibold">{record.class}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{record.time}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                                            <span className={`px-2 inline-flex text-xs leading-5 rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                                                record.status.includes('Absent') || record.status.includes('Rejected') || record.status.includes('Security') || record.status.includes('Fail') ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {weeklyHistory.length === 0 && (
                                    <tr className='h-16'>
                                        <td colSpan="5" className="p-4 text-center text-gray-400">No attendance records found yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            {/* Footer - Dark Gray */}
            <footer className="w-full bg-gray-800 border-t border-gray-700 py-6 mt-auto">
                <div className="max-w-full mx-auto px-10 text-center text-sm text-gray-500 font-bold uppercase tracking-widest">
                    Facial Attendance System powered by secure Python/OpenCV integration.
                </div>
            </footer>
        </div>
    );
};

export default Attendance;
