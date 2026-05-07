const Worker = require("../models/mcDetails/workerModel");
const Task = require("../models/mcDetails/taskModel");

// Get all workers (Admin/MC) — auto-resets expired leaves on fetch
exports.getAllWorkers = async (req, res) => {
    try {
        let filter = { isDeleted: false };
        if (req.user?.role === "mc") {
            filter.mcId = req.user.id;
        }

        // Auto-reset workers whose leave date has passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Worker.updateMany(
            {
                ...filter,
                leaveStatus: "On Leave",
                leaveUntil: { $lt: today }   // leaveUntil is before today → leave expired
            },
            { $set: { leaveStatus: "Available", leaveUntil: null } }
        );

        const workers = await Worker.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, workers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create worker
exports.createWorker = async (req, res) => {
    try {
        const newWorker = new Worker({
            ...req.body,
            mcId: req.user.id
        });
        await newWorker.save();
        res.status(201).json({ success: true, worker: newWorker });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update worker
exports.updateWorker = async (req, res) => {
    try {
        const worker = await Worker.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            req.body,
            { returnDocument: 'after' }
        );
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found or archived." });
        res.status(200).json({ success: true, worker });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Soft delete worker
exports.deleteWorker = async (req, res) => {
    try {
        await Worker.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.status(200).json({ success: true, message: "Worker deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
