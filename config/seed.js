const User = require("../models/userModel");
const Complaint = require("../models/mcDetails/complaintModel");
const Worker = require("../models/mcDetails/workerModel");
const Task = require("../models/mcDetails/taskModel");
const Area = require("../models/areaModel");
const seedMCs = require("../seed/mcSeeder");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const existing = await User.findOne({ email });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            await new User({
                name: process.env.ADMIN_NAME,
                email,
                password: hashedPassword,
                phone: process.env.ADMIN_PHONE,
                address: process.env.ADMIN_ADDRESS,
                userType: "admin",
                city: "System",
                district: "System",
                state: "Global"
            }).save();
            console.log("✅ Admin user created.");
        }
    } catch (err) {
        console.error("❌ Admin seed failed:", err.message);
    }
};

const seedSampleData = async () => {
    try {
        // Only seed if no non-admin users exist
        const userCount = await User.countDocuments({ userType: { $ne: "admin" } });
        if (userCount > 0) {
            console.log("ℹ️ Sample data already exists, skipping seed.");
            return;
        }

        console.log("🌱 Seeding initial sample data...");

        const hashedPassword = await bcrypt.hash("123456", 10);

        // ── 1. Create MC Users ────────────────────────────────────────────────
        const mcUsers = await User.insertMany([
            { name: "North Municipal Corp", email: "north_mc@wastewise.com", password: hashedPassword, userType: "mc", city: "Shimla", district: "Shimla", state: "HP", phone: "9871000001", zone: "North", ward: "Ward 1", location: "Main Office" },
            { name: "South Municipal Corp", email: "south_mc@wastewise.com", password: hashedPassword, userType: "mc", city: "Manali", district: "Kullu", state: "HP", phone: "9822000001", zone: "South", ward: "Ward 5", location: "Town Hall" },
            { name: "East Municipal Corp", email: "east_mc@wastewise.com", password: hashedPassword, userType: "mc", city: "Dharamshala", district: "Kangra", state: "HP", phone: "9833000001", zone: "East", ward: "Ward 10", location: "DC Office" }
        ]);

        // ── 2. Create Citizen Users ─────────────────────────────────────────────
        const citizens = await User.insertMany([
            { name: "Suresh Raina", email: "suresh@gmail.com", password: hashedPassword, userType: "citizen", city: "Delhi", district: "Central Delhi", state: "Delhi", phone: "9871111111" },
            { name: "Priya Singh", email: "priya@gmail.com", password: hashedPassword, userType: "citizen", city: "Mumbai", district: "Mumbai City", state: "Maharashtra", phone: "9822111111" }
        ]);

        // ── 3. Create Workers ──────────────────────────────────────────────────
        const workers = await Worker.insertMany([
            { name: "Rahul Sharma", contact: "9876543210", role: "Driver", schedule: "08:00 AM - 04:00 PM", area: "Rohini Sector 7", status: "Active", dutyStatus: "On Duty", workerPhoto: "https://i.pravatar.cc/150?u=rahul" },
            { name: "Anita Devi", contact: "9876543211", role: "Sweeper", schedule: "06:00 AM - 02:00 PM", area: "Bandra West", status: "Active", dutyStatus: "On Duty", workerPhoto: "https://i.pravatar.cc/150?u=anita" },
            { name: "Amit Kumar", contact: "9876543212", role: "Collector", schedule: "10:00 AM - 06:00 PM", area: "Salt Lake", status: "Active", dutyStatus: "On Duty", workerPhoto: "https://i.pravatar.cc/150?u=amit" }
        ]);

        // ── 4. Create Complaints ────────────────────────────────────────────────
        await Complaint.insertMany([
            { citizenId: citizens[0]._id, citizenName: citizens[0].name, type: "Waste Overflow", category: "Food Waste", area: "Park Avenue", city: "North Delhi", status: "Pending", priority: "High" },
            { citizenId: citizens[1]._id, citizenName: citizens[1].name, type: "Illegal Dumping", category: "Plastic / Dry Waste", area: "Metro Colony", city: "South Mumbai", status: "In Process", priority: "Medium" }
        ]);

        // ── 5. Create Tasks ─────────────────────────────────────────────────────
        await Task.insertMany([
            { title: "Clear Bin 42", assignedTo: "Rahul Sharma", deadline: "Today", status: "Pending", priority: "High" },
            { title: "Area Sweep - Bandra", assignedTo: "Anita Devi", deadline: "Tomorrow", status: "In Progress", priority: "Medium" }
        ]);

        // ── 6. Create Areas ─────────────────────────────────────────────────────
        await Area.insertMany([
            { name: "Mall Road", city: "Shimla", zone: "Central", ward: "Ward 1", location: "Near Ridge" },
            { name: "Lower Bazar", city: "Shimla", zone: "North", ward: "Ward 2", location: "Main Market" },
            { name: "Mallital", city: "Manali", zone: "South", ward: "Ward 5", location: "Mall Road Area" }
        ]);

        console.log("✅ Sample data (Non-Kangra) seeded successfully.");
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
    }
};

module.exports = async () => {
    await seedAdmin();
    // await seedSampleData();
};