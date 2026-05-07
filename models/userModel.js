const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    district: {
        type: String,
        required: true,
        default: ""
    },
    city: {
        type: String,
        required: true,
        default: ""
    },
    area: {
        type: String,
        default: ""
    },
    zone: {
        type: String,
        default: ""
    },
    ward: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    userType: {
        type: String,
        enum: ["admin", "citizen", "mc"],
        default: "citizen"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    resetPasswordOTP: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;