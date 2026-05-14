const path = require("path");
const Task = require("../models/mcDetails/taskModel");

// Get all tasks (Admin/MC)
exports.getAllTasks = async (req, res) => {
    try {
        let filter = { isDeleted: false };
        if (req.user?.role === "mc") {
            filter.mcId = req.user.id;
        }
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create task
exports.createTask = async (req, res) => {
    try {
        // Block assignment if worker is on leave
        if (req.body.assignedToId) {
            const Worker = require("../models/mcDetails/workerModel");
            const worker = await Worker.findById(req.body.assignedToId);
            if (worker && worker.leaveStatus === "On Leave") {
                return res.status(400).json({
                    success: false,
                    message: `${worker.name} is currently on leave and cannot be assigned tasks.`
                });
            }
        }

        const newTask = new Task({
            ...req.body,
            mcId: req.user.id
        });
        await newTask.save();

        // Notify Admin(s)
        try {
            const User = require("../models/userModel");
            const Notification = require("../models/notificationModel");
            const admins = await User.find({ userType: "admin", isDeleted: false });
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientRole: "admin",
                    type: "Task",
                    title: "New Task Assigned",
                    message: `MC has assigned a new task: "${newTask.title}" to ${newTask.assignedTo}.`,
                    relatedId: newTask._id
                });
            }
        } catch (notificationErr) {
            console.error("Failed to create notification:", notificationErr);
        }

        // Notify Citizen (if linked to a complaint)
        try {
            if (newTask.complaintId) {
                const Complaint = require("../models/mcDetails/complaintModel");
                const Notification = require("../models/notificationModel");
                const complaint = await Complaint.findById(newTask.complaintId);
                if (complaint && complaint.citizenId) {
                    await Notification.create({
                        recipient: complaint.citizenId,
                        recipientRole: "citizen",
                        type: "Task",
                        title: "Worker Assigned to Your Complaint",
                        message: `A worker (${newTask.assignedTo}) has been assigned to address your complaint.`,
                        relatedId: complaint._id
                    });
                }
            }
        } catch (citizenNotifErr) {
            console.error("Failed to notify citizen of assignment:", citizenNotifErr);
        }

        res.status(201).json({ success: true, task: newTask });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            const { uploadBuffer, isConfigured } = require("../utils/imageKit");
            if (!isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: "Image upload is not configured on the server."
                });
            }
            try {
                const safeName = `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(req.file.originalname)}`;
                updateData.completionProof = await uploadBuffer(req.file.buffer, safeName, "/wastewise/task-proofs");
            } catch (uploadErr) {
                console.error("ImageKit upload failed:", uploadErr);
                return res.status(502).json({
                    success: false,
                    message: uploadErr.message || "Failed to upload proof image."
                });
            }
            updateData.status = "Completed";
        }

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            updateData,
            { returnDocument: 'after' }
        );
        if (!task) return res.status(404).json({ success: false, message: "Task not found or archived." });

        // If task is completed and has a complaintId, sync with complaint
        if ((task.status === "Completed" || task.status === "Resolved") && task.complaintId) {
            const Complaint = require("../models/mcDetails/complaintModel");
            await Complaint.findByIdAndUpdate(task.complaintId, {
                status: "Resolved",
                proofImage: task.completionProof || task.proofImage || task.workerPhoto,
                completionNote: task.completionNote || "Task completed by worker."
            });

            // Notify Admin(s) about completion
            try {
                const User = require("../models/userModel");
                const Notification = require("../models/notificationModel");
                const admins = await User.find({ userType: "admin", isDeleted: false });
                for (const admin of admins) {
                    await Notification.create({
                        recipient: admin._id,
                        recipientRole: "admin",
                        type: "Task",
                        title: "Task Completed",
                        message: `Task "${task.title}" has been completed by ${task.assignedTo}.`,
                        relatedId: task._id
                    });
                }
            } catch (notificationErr) {
                console.error("Failed to notify admins of completion:", notificationErr);
            }

            // Notify MC about completion
            try {
                const Notification = require("../models/notificationModel");
                await Notification.create({
                    recipient: task.mcId,
                    recipientRole: "mc",
                    type: "Task",
                    title: "Worker Completed Task",
                    message: `Worker ${task.assignedTo} has marked the task "${task.title}" as completed.`,
                    relatedId: task._id
                });
            } catch (mcNotifErr) {
                console.error("Failed to notify MC of completion:", mcNotifErr);
            }
        }

        res.status(200).json({ success: true, task });
    } catch (err) {
        console.error("UpdateTask Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Soft delete task
exports.deleteTask = async (req, res) => {
    try {
        await Task.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.status(200).json({ success: true, message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
