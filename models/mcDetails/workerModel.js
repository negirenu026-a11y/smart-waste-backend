const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["Driver", "Sweeper", "Collector", "Supervisor"],
        default: "Collector"
    },
    schedule: {
        type: String,
        default: "09:00 AM - 06:00 PM"
    },
    area: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },
    dutyStatus: {
        type: String,
        enum: ["On Duty", "Off Duty"],
        default: "On Duty"
    },
    leaveStatus: {
        type: String,
        enum: ["Available", "On Leave"],
        default: "Available"
    },
    leaveUntil: {
        type: Date,
        default: null
    },
    workerPhoto: {
        type: String,
        default: ""
    },
    mcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Worker = mongoose.models.Worker || mongoose.model("Worker", workerSchema);
module.exports = Worker;
