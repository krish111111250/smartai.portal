// backend/routes/authRoute.js

const express = require('express');
const router = express.Router();

// --- Placeholder Controllers (We'll replace these later) ---
const loginUser = (req, res) => {
    res.status(200).send({ message: "Login endpoint connected." });
};
const registerStudent = (req, res) => {
    res.status(200).send({ message: "Register endpoint connected." });
};
const getMe = (req, res) => {
    res.status(200).send({ message: "User profile endpoint connected." });
};
// -----------------------------------------------------------

// Routes: /api/auth/*
router.post('/login', loginUser);
router.post('/register', registerStudent);
router.get('/me', getMe);

// IMPORTANT: Export the router instance
module.exports = router;