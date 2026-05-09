const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "wastewise_secret_2024";

// Middleware: verify JWT token and attach user to req
const authMiddleware = (req, res, next) => {
    let token = req.cookies.access_token;

    // Fallback to header if cookie not present (useful for testing)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Debug logs for production auth issues
    console.log("Cookies:", req.cookies);
    console.log("Auth Header:", req.headers.authorization ? "Present" : "Missing");

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, role, name, email }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

// Middleware: restrict to specific roles
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authenticated." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Access denied. Requires role: ${roles.join(" or ")}.` });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRole };
