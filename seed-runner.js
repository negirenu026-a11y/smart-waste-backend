const seed = require("./config/seed");
const connectDB = require("./config/db");

const runSeed = async () => {
    try {
        await connectDB();
        await seed();
        console.log("✅ Seeding process finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
};

runSeed();
