const mongoose = require('mongoose');
require('dotenv').config();
const Notification = require('./models/notificationModel');

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wastewise');
    const count = await Notification.countDocuments();
    console.log(`Total notifications: ${count}`);
    const last5 = await Notification.find().sort({createdAt:-1}).limit(5);
    console.log('Last 5 notifications:', JSON.stringify(last5, null, 2));
    process.exit();
}

check();
