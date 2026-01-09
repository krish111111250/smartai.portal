// frontend/src/data/csdData.js

export const CSD_DATA = {
    student: {
        name: "Navaneeth Kavin M",
        rollNo: "22CSD005",
        department: "CSD (Computer Science & Design)",
    },
    
    // --- 4 TEACHERS | 4 SUBJECTS | 3 UNITS EACH ---
    subjects: [
        {
            id: "DS301",
            name: "Data Structures",
            // This email identifies the teacher authorized to see this subject's dashboard
            ownerEmail: "ds_prof@sns.edu", 
            teacherName: "Prof. Arunkumar",
            units: [
                { unitNo: 1, title: "Linear Structures", isLocked: false, quizId: "DS_Q1" },
                { unitNo: 2, title: "Non-Linear Structures", isLocked: true, quizId: "DS_Q2" },
                { unitNo: 3, title: "Advanced Algorithms", isLocked: true, quizId: "DS_Q3" }
            ],
            assignments: ["Stack Implementation", "Tree Traversal"]
        },
        {
            id: "OS302",
            name: "Operating Systems",
            ownerEmail: "os_prof@sns.edu",
            teacherName: "Prof. Priya",
            units: [
                { unitNo: 1, title: "Process Management", isLocked: false, quizId: "OS_Q1" },
                { unitNo: 2, title: "Memory Management", isLocked: true, quizId: "OS_Q2" },
                { unitNo: 3, title: "File Systems", isLocked: true, quizId: "OS_Q3" }
            ],
            assignments: ["CPU Scheduling", "Page Replacement"]
        },
        {
            id: "DB303",
            name: "DBMS",
            ownerEmail: "dbms_prof@sns.edu",
            teacherName: "Prof. Ravi",
            units: [
                { unitNo: 1, title: "ER Modeling", isLocked: false, quizId: "DB_Q1" },
                { unitNo: 2, title: "Normalization", isLocked: true, quizId: "DB_Q2" },
                { unitNo: 3, title: "Transaction Control", isLocked: true, quizId: "DB_Q3" }
            ],
            assignments: ["SQL Queries", "Schema Design"]
        },
        {
            id: "PY304",
            name: "Python Programming",
            ownerEmail: "python_prof@sns.edu",
            teacherName: "Prof. Sunitha",
            units: [
                { unitNo: 1, title: "Basics & Flow", isLocked: false, quizId: "PY_Q1" },
                { unitNo: 2, title: "Functions & OOPs", isLocked: true, quizId: "PY_Q2" },
                { unitNo: 3, title: "Data Handling", isLocked: true, quizId: "PY_Q3" }
            ],
            assignments: ["Logic Exercises", "File I/O"]
        }
    ],

    // --- STUDENT PROGRESS ANALYTICS (For Teacher Dashboard) ---
    analytics: {
        totalStudents: 60,
        classAverage: "74%",
        unitCompletion: [
            { unit: "Unit 1", completed: 58 },
            { unit: "Unit 2", completed: 34 },
            { unit: "Unit 3", completed: 12 }
        ]
    }
};

// --- EXAM STUDY PATTERNS ---
export const EXAM_GUIDE = {
    "2M": { title: "Short Answer", breakdown: ["1M: Definition", "1M: Example / Keyword"] },
    "6M": { title: "Paragraph Answer", breakdown: ["1M: Definition", "2M: Key points", "3M: Explanation / Example"] },
    "14M": { title: "Essay Answer", breakdown: ["1M: Definition", "2M: Key terms", "6M: Detailed theory", "5M: Diagram / Algorithm"] }
};