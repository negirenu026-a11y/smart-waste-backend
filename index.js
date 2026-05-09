const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Ensure uploads directory exists (prevents ENOENT from multer)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory.");
}

const app = express();
const port = process.env.PORT || 4000;

// Imports
const connectDB = require("./config/db");
const seedAll = require("./config/seed");
const routes = require("./routes/userRoutes");
const cityDataRoutes = require("./routes/cityDataRoutes");
const mcRoutes = require("./routes/mcRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// ── Middleware ─────────────────────────────────────────────────────────────



app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smart-waste-frontend-blush.vercel.app"
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static: Serve uploaded images ──────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "WasteWise API is running 🟢" });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api", routes);
app.use("/api/city-data", cityDataRoutes);
app.use("/api/mcs", mcRoutes);
app.use("/api/notifications", notificationRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

// ── Start Server ───────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await connectDB();
        await seedAll();
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
    } finally {
        app.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
        });
    }
};

startServer();
