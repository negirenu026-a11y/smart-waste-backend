const mongoose = require("mongoose");

const mcSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: "Himachal Pradesh"
    },
    district: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    zone: {
        type: String,
        default: "Auto"
    },
    ward: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("MC", mcSchema);
