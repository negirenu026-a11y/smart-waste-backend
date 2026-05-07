const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const userController = require("../controllers/userController");
const complaintController = require("../controllers/complaintController");
const workerController = require("../controllers/workerController");
const taskController = require("../controllers/taskController");
const reportController = require("../controllers/reportController");
const areaController = require("../controllers/areaController");
const feedbackController = require("../controllers/feedbackController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// ── Multer: File Upload Config ─────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Image Upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error("Only image files are allowed."));
    }
});

// PDF Upload
const uploadPDF = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') return cb(null, true);
        cb(new Error("Only PDF files are allowed."));
    }
});

// ── Auth Routes ────────────────────────────────────────────────────────────
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/logout", userController.logoutUser);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

// ── User Management Routes (Admin only) ────────────────────────────────────
router.get("/users", authMiddleware, requireRole("admin"), userController.getAllUsers);
router.patch("/users/:id", authMiddleware, requireRole("admin"), userController.updateUser);
router.patch("/profile", authMiddleware, userController.updateProfile);
router.delete("/users/:id", authMiddleware, requireRole("admin"), userController.softDeleteUser);

// ── Area Routes (Admin only)
router.get("/areas", authMiddleware, areaController.getAllAreas);
router.post("/areas", authMiddleware, requireRole("admin"), areaController.createArea);
router.patch("/areas/:id", authMiddleware, requireRole("admin"), areaController.updateArea);
router.delete("/areas/:id", authMiddleware, requireRole("admin"), areaController.deleteArea);

// Dynamic Location Data
router.get("/districts", areaController.getDistricts);
router.get("/cities/:district", areaController.getCitiesByDistrict);
router.post("/seed/areas", authMiddleware, requireRole("admin"), areaController.seedAreas);

// ── Complaint Routes ────────────────────────────────────────────────────────
router.post("/complaints", authMiddleware, upload.single("image"), complaintController.createComplaint);
router.get("/complaints", authMiddleware, complaintController.getAllComplaints);
router.patch("/complaints/:id/status", authMiddleware, requireRole("mc", "admin"), complaintController.updateComplaintStatus);
router.patch("/complaints/:id/feedback", authMiddleware, requireRole("citizen"), complaintController.submitFeedback);
router.delete("/complaints/:id", authMiddleware, complaintController.softDeleteComplaint);

// ── Worker Routes ──────────────────────────────────────────────────────────
router.get("/workers", authMiddleware, workerController.getAllWorkers);
router.post("/workers", authMiddleware, requireRole("mc", "admin"), workerController.createWorker);
router.patch("/workers/:id", authMiddleware, requireRole("mc", "admin"), workerController.updateWorker);
router.delete("/workers/:id", authMiddleware, requireRole("mc", "admin"), workerController.deleteWorker);

// ── Task Routes ────────────────────────────────────────────────────────────
router.get("/tasks", authMiddleware, taskController.getAllTasks);
router.post("/tasks", authMiddleware, requireRole("mc", "admin"), taskController.createTask);
router.patch("/tasks/:id", authMiddleware, requireRole("mc", "admin"), upload.single("proof"), taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, requireRole("mc", "admin"), taskController.deleteTask);

// ── Report Routes ──────────────────────────────────────────────────────────
router.get("/reports", authMiddleware, reportController.getAllReports);
router.get("/reports/mc/:mcId", authMiddleware, reportController.getReportsByMC);
router.post("/reports", authMiddleware, requireRole("mc"), reportController.createReport);
router.patch("/reports/:id", authMiddleware, requireRole("mc"), reportController.updateReport);
router.delete("/reports/:id", authMiddleware, requireRole("mc", "admin"), reportController.deleteReport);
router.patch("/reports/:id/respond", authMiddleware, requireRole("admin"), reportController.respondToReport);

// ── Feedback Routes
router.get("/feedback", authMiddleware, feedbackController.getAllFeedback);
router.post("/feedback", authMiddleware, requireRole("citizen"), feedbackController.createFeedback);

module.exports = router;
