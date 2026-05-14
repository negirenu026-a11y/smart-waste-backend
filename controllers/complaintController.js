const Complaint = require("../models/mcDetails/complaintModel");
const User = require("../models/userModel");
const Area = require("../models/areaModel");
const path = require("path");

// POST /api/complaints — Create a new complaint
exports.createComplaint = async (req, res) => {
    try {
        const { type, category, description, district, city, area, location, ward, zone } = req.body;

        // 1. Try to find the area to get specific assigned MC
        let assignedMcId = null;
        const areaDoc = await Area.findOne({ district, city, name: area, isDeleted: false });

        if (areaDoc && areaDoc.mcId) {
            assignedMcId = areaDoc.mcId;
        } else {
            // 2. Fallback: Find ANY MC registered for this specific City + District
            const cityMc = await User.findOne({
                userType: "mc",
                city: city,
                district: district,
                isDeleted: false
            });

            if (cityMc) {
                assignedMcId = cityMc._id;
            }
        }

        if (!assignedMcId) {
            return res.status(400).json({
                success: false,
                message: "No Municipal Corporation (MC) found for this city/area. Complaint cannot be filed."
            });
        }

        const citizenId = req.user?.id;
        const citizenName = req.user?.name || "";
        let imageUrl = "";
        if (req.file) {
            const { uploadBuffer, isConfigured } = require("../utils/imageKit");
            if (!isConfigured()) {
                return res.status(503).json({
                    success: false,
                    message: "Image upload is not configured on the server."
                });
            }
            try {
                const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(req.file.originalname)}`;
                imageUrl = await uploadBuffer(req.file.buffer, safeName, "/wastewise/complaints");
            } catch (uploadErr) {
                console.error("ImageKit upload failed:", uploadErr);
                return res.status(502).json({
                    success: false,
                    message: uploadErr.message || "Failed to upload image."
                });
            }
        }

        // Smart Priority Logic
        let calculatedPriority = "Medium";
        const combinedText = `${type} ${category} ${description}`.toLowerCase();
        if (combinedText.includes("overflow") || combinedText.includes("urgent")) {
            calculatedPriority = "High";
        }

        const newComplaint = new Complaint({
            citizenId,
            citizenName,
            type: type || category || "Other",
            category: category || type || "Other",
            description,
            state: "Himachal Pradesh",
            district,
            city,
            area,
            location,
            ward,
            zone,
            assignedMcId,
            imageUrl,
            priority: calculatedPriority
        });

        await newComplaint.save();

        // Notify Admin(s)
        try {
            const Notification = require("../models/notificationModel");
            const admins = await User.find({ userType: "admin", isDeleted: false });
            for (const admin of admins) {
                await Notification.create({
                    recipient: admin._id,
                    recipientRole: "admin",
                    type: "Complaint",
                    title: "New Complaint Filed",
                    message: `A new complaint has been filed in ${area}, ${city} by ${citizenName || "a citizen"}.`,
                    relatedId: newComplaint._id
                });
            }

            // Notify Assigned MC
            if (assignedMcId) {
                await Notification.create({
                    recipient: assignedMcId,
                    recipientRole: "mc",
                    type: "Complaint",
                    title: "New Complaint Assigned",
                    message: `A new ${category} complaint has been filed in your area (${area}).`,
                    relatedId: newComplaint._id
                });
            }
        } catch (notificationErr) {
            console.error("Failed to create notification:", notificationErr);
            // Don't fail the request if notification fails
        }

        res.status(201).json({
            success: true,
            message: "Complaint filed and assigned to MC successfully.",
            complaint: newComplaint
        });
    } catch (err) {
        console.error("CreateComplaint Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /api/complaints — Get all active complaints
exports.getAllComplaints = async (req, res) => {
    try {
        const filter = { isDeleted: false };

        // Citizens can only see their own complaints
        if (req.user?.role === "citizen") {
            filter.citizenId = req.user.id;
        }

        // MCs can only see complaints in their city/district
        if (req.user?.role === "mc") {
            const mcUser = await User.findById(req.user.id);
            if (mcUser) {
                filter.city = mcUser.city;
                filter.district = mcUser.district;
            } else {
                // Fallback to assignedMcId if user not found for some reason
                filter.assignedMcId = req.user.id;
            }
        }

        const complaints = await Complaint.find(filter)
            .populate("citizenId", "name phone")
            .populate("assignedMcId", "name email")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (err) {
        console.error("GetAllComplaints Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/complaints/:id/status — Update complaint status (MC/Admin)
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { status, assignedWorker, mcResponse } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (assignedWorker) updateData.assignedWorker = assignedWorker;
        if (req.body.assignedWorkerId) updateData.assignedWorkerId = req.body.assignedWorkerId;
        if (mcResponse) updateData.mcResponse = mcResponse;

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { returnDocument: 'after' }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        // Notify Citizen of status update or MC response
        try {
            if (complaint.citizenId) {
                const Notification = require("../models/notificationModel");
                let title = "Complaint Update";
                let message = `Your complaint about "${complaint.category}" status is now ${complaint.status}.`;

                if (mcResponse) {
                    title = "MC Response Received";
                    message = `MC replied: "${mcResponse}"`;
                }

                await Notification.create({
                    recipient: complaint.citizenId,
                    recipientRole: "citizen",
                    type: "Complaint",
                    title: title,
                    message: message,
                    relatedId: complaint._id
                });
            }
        } catch (notificationErr) {
            console.error("Failed to notify citizen:", notificationErr);
        }

        // If a worker is assigned and status is "In Process", create a task if it doesn't exist
        if (req.body.assignedWorkerId && status === "In Process") {
            const Task = require("../models/mcDetails/taskModel");
            const existingTask = await Task.findOne({ complaintId: complaint._id });
            if (!existingTask) {
                const newTask = new Task({
                    title: `Cleanup: ${complaint.category}`,
                    assignedTo: assignedWorker,
                    assignedToId: req.body.assignedWorkerId,
                    mcId: req.user.id,
                    deadline: req.body.deadline || "Asap",
                    complaintId: complaint._id,
                    status: "In Progress"
                });
                await newTask.save();
            }
        }

        return res.json({ success: true, complaint });
    } catch (err) {
        console.error("UpdateStatus Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PATCH /api/complaints/:id/feedback — Submit citizen feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { feedbackRating: rating, feedbackComment: comment },
            { returnDocument: 'after' }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found" });
        }

        res.json({ success: true, message: "Feedback submitted successfully", complaint });
    } catch (err) {
        console.error("SubmitFeedback Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// DELETE /api/complaints/:id — Soft delete
exports.softDeleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { isDeleted: true },
            { returnDocument: 'after' }
        );
        if (!complaint) {
            return res.status(404).json({ success: false, message: "Complaint not found." });
        }
        res.status(200).json({ success: true, message: "Complaint archived." });
    } catch (err) {
        console.error("SoftDeleteComplaint Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
