const express = require("express");
const router = express.Router();
const mcController = require("../controllers/mcController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// Public or Protected routes
router.get("/", authMiddleware, mcController.getAllMCs);
router.post("/", authMiddleware, requireRole("admin"), mcController.createMC);
router.patch("/:id", authMiddleware, requireRole("admin"), mcController.updateMC);
router.delete("/:id", authMiddleware, requireRole("admin"), mcController.deleteMC);

module.exports = router;
