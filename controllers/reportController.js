const Report = require("../models/reportModel");

// POST /api/reports — MC creates a weekly report (text-based)
exports.createReport = async (req, res) => {
    try {
        const { title, description, tasksCompleted, pendingTasks, workersInvolved } = req.body;

        const newReport = new Report({
            mcId: req.user.id,
            mcName: req.user.name,
            city: req.user.city || "",
            district: req.user.district || "",
            zone: req.user.zone || "",
            title,
            description,
            tasksCompleted: parseInt(tasksCompleted) || 0,
            pendingTasks: parseInt(pendingTasks) || 0,
            workersInvolved: parseInt(workersInvolved) || 0
        });

        await newReport.save();

        // Notify Admin(s)
        try {
            const User = require("../models/userModel");
            const Notification = require("../models/notificationModel");
            const admins = await User.find({ userType: "admin", isDeleted: false });
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientRole: "admin",
                    type: "Report",
                    title: "New MC Report Submitted",
                    message: `MC ${req.user.name} from ${req.user.city || 'their zone'} has submitted a new weekly report: "${title}".`,
                    relatedId: newReport._id
                });
            }
        } catch (notifErr) {
            console.error("Failed to notify admins of report:", notifErr);
        }

        res.status(201).json({
            success: true,
            message: "Report created successfully.",
            report: newReport
        });
    } catch (err) {
        console.error("CreateReport Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/reports — List reports (Admin sees all, MC sees own)
exports.getAllReports = async (req, res) => {
    try {
        const filter = { isDeleted: false };
        if (req.user.role === "mc") {
            filter.mcId = req.user.id;
        }

        const reports = await Report.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, reports });
    } catch (err) {
        console.error("GetAllReports Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/reports/mc/:mcId — List reports for a specific MC (Used by Admin or specific MC)
exports.getReportsByMC = async (req, res) => {
    try {
        const reports = await Report.find({ mcId: req.params.mcId, isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, reports });
    } catch (err) {
        console.error("GetReportsByMC Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/reports/:id — Update a report (MC or Admin)
exports.updateReport = async (req, res) => {
    try {
        const { title, description, tasksCompleted, pendingTasks, workersInvolved } = req.body;

        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { 
                title, 
                description, 
                tasksCompleted: parseInt(tasksCompleted), 
                pendingTasks: parseInt(pendingTasks), 
                workersInvolved: parseInt(workersInvolved) 
            },
            { returnDocument: 'after' }
        );

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found or unauthorized." });
        }

        res.status(200).json({ success: true, message: "Report updated successfully.", report });
    } catch (err) {
        console.error("UpdateReport Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// DELETE /api/reports/:id — Soft delete a report
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { isDeleted: true },
            { returnDocument: 'after' }
        );

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        res.status(200).json({ success: true, message: "Report deleted successfully." });
    } catch (err) {
        console.error("DeleteReport Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/reports/:id/respond — Admin responds to a report
exports.respondToReport = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status, adminResponse },
            { returnDocument: 'after' }
        );

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found." });
        }

        // Notify MC of Admin's response
        try {
            const Notification = require("../models/notificationModel");
            await Notification.create({
                recipient: report.mcId,
                recipientRole: "mc",
                type: "Report",
                title: "Report Feedback Received",
                message: `Admin has ${status === 'Approved' ? 'approved' : 'reviewed'} your report: "${report.title}". Feedback: ${adminResponse || 'No comment'}.`,
                relatedId: report._id
            });
        } catch (notifErr) {
            console.error("Failed to notify MC of report response:", notifErr);
        }

        res.status(200).json({ success: true, message: "Response recorded.", report });
    } catch (err) {
        console.error("RespondReport Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
