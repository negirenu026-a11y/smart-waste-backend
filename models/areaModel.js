const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema({
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
        required: true
    },
    ward: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    mcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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

module.exports = mongoose.model("Area", areaSchema);
