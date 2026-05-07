const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MONGO DB IS CONNECTED SUCCESSFULLY");
    } catch (err) {
        console.error("MONGO DB IS NOT CONNECTED DUE TO ERROR:", err.message);
        throw err; // Throw error to handle it gracefully in server.js
    }
};

module.exports = connectDB;