// backend/server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // <-- Import modular DB connection
const authRoutes = require('./routes/authRoute');

// Load environment variables from .env file
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
// Allow frontend access from localhost:5173 for CORS
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // For parsing application/json bodies

// Routes
// Note: authRoutes must export an Express Router instance (which we fixed in authRoute.js)
app.use('/api/auth', authRoutes);
// Placeholder for CSD routes
// app.use('/api/csd', require('./routes/csdRoute')); 

// Start Server
// Use PORT from .env (e.g., 5001) or default to 5001 to avoid EADDRINUSE conflict
// backend/server.js (Hardcoding the port to 5001 for stability)
// Start Server
const PORT = 5003; // <-- FORCING the port to 5003 to bypass the EADDRINUSE error

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Use "npm run seed" to add initial data.');
});