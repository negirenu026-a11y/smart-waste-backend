const Feedback = require("../models/feedbackModel");

// GET /api/feedback
exports.getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, feedback });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/feedback
exports.createFeedback = async (req, res) => {
    try {
        const { rating, comment, category } = req.body;
        const newFeedback = new Feedback({
            citizenId: req.user.id,
            citizenName: req.user.name,
            rating,
            comment,
            category
        });
        await newFeedback.save();
        res.status(201).json({ success: true, feedback: newFeedback });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
