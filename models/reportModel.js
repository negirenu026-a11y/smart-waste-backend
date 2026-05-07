const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    mcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        default: "Weekly Report"
    },
    description: {
        type: String,
        default: ""
    },
    mcName: String,
    city: String,
    district: String,
    zone: String,
    tasksCompleted: {
        type: Number,
        default: 0
    },
    pendingTasks: {
        type: Number,
        default: 0
    },
    workersInvolved: {
        type: Number,
        default: 0
    },
    pdfUrl: {
        type: String,
        required: false // Made optional for the new text-based reports
    },
    status: {
        type: String,
        enum: ["Pending", "Reviewed", "Validated", "Rejected"],
        default: "Pending"
    },
    adminResponse: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
