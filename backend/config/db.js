// backend/config/db.js

const mongoose = require('mongoose');

/**
 * @desc Connects to the MongoDB database using the URI from .env
 */
const connectDB = async () => {
    try {
        // Mongoose 6+ automatically handles many deprecated options
        const conn = await mongoose.connect(process.env.MONGO_URI); 

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ DB Connection Error: ${error.message}`);
        // Exit process with failure
        process.exit(1); 
    }
};

// Now that connectDB is defined, we can export it.
module.exports = connectDB;