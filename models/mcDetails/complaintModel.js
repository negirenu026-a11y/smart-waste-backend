const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    citizenName: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ["Food", "Food Waste", "Plastic", "Plastic / Dry Waste", "E-Waste", "Construction Debris", "Hazardous Waste", "Other"],
        default: "Other"
    },
    description: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: "Himachal Pradesh"
    },
    district: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    area: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    assignedMcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    ward: {
        type: String,
        default: ""
    },
    zone: {
        type: String,
        default: ""
    },
    imageUrl: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Pending", "In Process", "Resolved"],
        default: "Pending"
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    assignedWorker: {
        type: String,
        default: ""
    },
    assignedWorkerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
        default: null
    },
    deadline: {
        type: String,
        default: ""
    },
    proofImage: {
        type: String,
        default: ""
    },
    completionNote: {
        type: String,
        default: ""
    },
    mcResponse: {
        type: String,
        default: ""
    },
    feedbackRating: {
        type: Number,
        default: 0
    },
    feedbackComment: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Complaint = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
module.exports = Complaint;
