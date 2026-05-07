const MC = require("../models/mcModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

// Get all MCs
exports.getAllMCs = async (req, res) => {
    try {
        const mcs = await MC.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: mcs.length,
            mcs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error fetching MCs",
            error: err.message
        });
    }
};

// Create MC (for Admin manually)
exports.createMC = async (req, res) => {
    try {
        const { fullName, email, password, district, city, location, ward, zone } = req.body;

        // Check if user already exists in User model
        const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }

        // 1. Create the MC Profile
        const newMC = await MC.create({
            name: fullName,
            email: email.toLowerCase(),
            district,
            city,
            location,
            ward,
            zone
        });

        // 2. Create the Login Account in User model
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            name: fullName,
            email: email.toLowerCase(),
            password: hashedPassword,
            userType: "mc",
            district,
            city,
            location,
            ward,
            zone
        });

        res.status(201).json({
            success: true,
            mc: newMC
        });
    } catch (err) {
        console.error("Create MC Error:", err);
        res.status(400).json({
            success: false,
            message: "Error creating MC",
            error: err.message
        });
    }
};

// Update MC
exports.updateMC = async (req, res) => {
    try {
        const { fullName, email, password, district, city, location, ward, zone } = req.body;
        const mcId = req.params.id;

        const oldMC = await MC.findById(mcId);
        if (!oldMC) return res.status(404).json({ success: false, message: "MC not found" });

        // 1. Update MC Profile
        const updatedMC = await MC.findByIdAndUpdate(mcId, {
            name: fullName,
            email: email.toLowerCase(),
            district,
            city,
            location,
            ward,
            zone
        }, { returnDocument: 'after' });

        // 2. Update corresponding User account
        const updateData = {
            name: fullName,
            email: email.toLowerCase(),
            district,
            city,
            location,
            ward,
            zone
        };
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await User.findOneAndUpdate(
            { email: oldMC.email.toLowerCase(), userType: "mc" },
            updateData,
            { returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            mc: updatedMC
        });
    } catch (err) {
        console.error("Update MC Error:", err);
        res.status(400).json({
            success: false,
            message: "Error updating MC",
            error: err.message
        });
    }
};

// Delete MC
exports.deleteMC = async (req, res) => {
    try {
        const mc = await MC.findByIdAndUpdate(req.params.id, { isDeleted: true }, { returnDocument: 'after' });
        if (!mc) return res.status(404).json({ success: false, message: "MC not found" });

        // Soft delete the user account as well
        await User.findOneAndUpdate(
            { email: mc.email.toLowerCase(), userType: "mc" },
            { isDeleted: true }
        );

        res.status(200).json({
            success: true,
            message: "MC and associated account deleted successfully"
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: "Error deleting MC",
            error: err.message
        });
    }
};
