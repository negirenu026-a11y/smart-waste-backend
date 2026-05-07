const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    assignedTo: {
        type: String,
        required: true
    },
    assignedToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
    mcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    deadline: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending"
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    workerPhoto: {
        type: String,
        default: ""
    },
    completionProof: {
        type: String,
        default: ""
    },
    completionNote: {
        type: String,
        default: ""
    },
    complaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
