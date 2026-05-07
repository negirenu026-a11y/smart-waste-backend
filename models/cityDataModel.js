const mongoose = require("mongoose");

const cityDataSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    unique: true,
  },
  areas: {
    type: [String],
    default: [],
  },
  totalComplaints: {
    type: Number,
    default: 0,
  },
  workersAvailable: {
    type: Number,
    default: 0,
  },
  zone: {
    type: String,
    default: "Unknown",
  }
}, { timestamps: true });

module.exports = mongoose.model("CityData", cityDataSchema);
