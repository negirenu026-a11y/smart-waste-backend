const User = require("../models/userModel");
const Area = require("../models/areaModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const JWT_SECRET = process.env.JWT_SECRET || "wastewise_secret_2024";

// Generate JWT token with role embedded
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.userType,
            name: user.name,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// POST /api/register
exports.registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, userType, state, district, city, area, zone, ward, location } = req.body;

        // Prevent admin registration via API
        if (userType === "admin") {
            return res.status(403).json({ success: false, message: "Admin registration is not allowed." });
        }

        // Validate role
        if (!["citizen", "mc"].includes(userType)) {
            return res.status(400).json({ success: false, message: "Invalid user type. Must be citizen or mc." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists with this email." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            name,
            email: email.toLowerCase().trim(),
            phone,
            password: hashedPassword,
            userType,
            state: state || "Himachal Pradesh",
            district: district || "",
            city: city || "",
            area: area || "",
            zone: zone || "",
            ward: ward || "",
            location: location || ""
        });

        await newUser.save();

        // If MC, link to area
        if (userType === "mc") {
            const areaDoc = await Area.findOne({
                district: district,
                city: city,
                name: area,
                isDeleted: false
            });
            if (areaDoc) {
                areaDoc.mcId = newUser._id;
                await areaDoc.save();
            }
        }

        const token = generateToken(newUser);

        // Set cookie
        // Set cookie ONLY if not an admin creating another user
        const adminToken = req.cookies.access_token;
        let isAdminCreating = false;
        if (adminToken) {
            try {
                const decoded = jwt.verify(adminToken, JWT_SECRET);
                if (decoded.role === 'admin') isAdminCreating = true;
            } catch (e) { }
        }

        if (!isAdminCreating) {
            res.cookie("access_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Lax",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                fullName: newUser.name,
                email: newUser.email,
                role: newUser.userType,
                phone: newUser.phone,
                state: newUser.state,
                city: newUser.city
            }
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/login
exports.loginUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const identifier = username || email;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Username/Email and password are required." });
        }

        // Find user by email or name (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { name: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } }
            ],
            isDeleted: false
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Please check your credentials." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials. Wrong password." });
        }

        const token = generateToken(user);

        // Set cookie
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                fullName: user.name,
                email: user.email,
                role: user.userType,
                phone: user.phone,
                address: user.address,
                state: user.state,
                city: user.city
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/logout
exports.logoutUser = async (req, res) => {
    res.clearCookie("access_token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// GET /api/users — Admin only: list all non-deleted users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isDeleted: false }, "-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error("GetAllUsers Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// DELETE /api/users/:id — Soft delete
exports.softDeleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (err) {
        console.error("SoftDelete Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/users/:id — Update user details (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, password, state, city, userType, zone, ward, location } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email.toLowerCase();
        if (phone) updateData.phone = phone;
        if (state) updateData.state = state;
        if (city) updateData.city = city;
        if (userType) updateData.userType = userType;
        if (zone) updateData.zone = zone;
        if (ward) updateData.ward = ward;
        if (location) updateData.location = location;

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        res.status(200).json({ success: true, message: "User updated successfully.", user });
    } catch (err) {
        console.error("UpdateUser Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/profile — Update current user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, state, city, zone, ward, location } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (state) updateData.state = state;
        if (city) updateData.city = city;
        if (zone) updateData.zone = zone;
        if (ward) updateData.ward = ward;
        if (location) updateData.location = location;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                fullName: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.userType,
                phone: updatedUser.phone,
                state: updatedUser.state,
                city: updatedUser.city,
                zone: updatedUser.zone,
                ward: updatedUser.ward,
                location: updatedUser.location
            }
        });
    } catch (err) {
        console.error("UpdateProfile Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { identifier, role } = req.body; // identifier can be email or name
        if (!identifier) return res.status(400).json({ success: false, message: "Email or Name is required" });

        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { name: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } }
            ],
            userType: role,
            isDeleted: false
        });

        if (!user) return res.status(404).json({ success: false, message: "User not found with these details." });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        try {
            await sendEmail({
                email: user.email,
                subject: "WasteWise Password Reset OTP",
                message: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`
            });

            res.status(200).json({ success: true, message: "OTP sent to your registered email." });
        } catch (mailErr) {
            user.resetPasswordOTP = null;
            user.resetPasswordExpires = null;
            await user.save();
            console.error("Nodemailer Error Details:", mailErr);
            return res.status(500).json({
                success: false,
                message: `Failed to send email: ${mailErr.message}. Please check your email credentials in .env`
            });
        }
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword, role } = req.body;

        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { name: { $regex: new RegExp(`^${identifier.trim()}$`, "i") } }
            ],
            userType: role,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() },
            isDeleted: false
        });

        if (!user) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful. You can now login with your new password." });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
