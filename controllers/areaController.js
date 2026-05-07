const Area = require("../models/areaModel");
const axios = require("axios");
const himachalData = require("../data/himachalData");

// GET /api/areas
exports.getAllAreas = async (req, res) => {
    try {
        const areas = await Area.find({ isDeleted: false }).populate("mcId", "name email").sort({ createdAt: -1 });
        res.status(200).json({ success: true, areas });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// POST /api/areas
exports.createArea = async (req, res) => {
    try {
        const { name, district, city, zone, ward, pincode } = req.body;

        // Step 1: Validate Pincode
        const pincodeRes = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        if (pincodeRes.data[0].Status === "Error") {
            return res.status(400).json({ success: false, message: "Invalid Pincode" });
        }

        // Step 2: Fetch Coordinates (Nominatim)
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`, {
            headers: { 'User-Agent': 'WasteManagementApp/1.0' }
        });

        let coordinates = { lat: 31.1048, lng: 77.1734 }; // Default to Shimla if geocoding fails
        if (geoRes.data && geoRes.data.length > 0) {
            coordinates = {
                lat: parseFloat(geoRes.data[0].lat),
                lng: parseFloat(geoRes.data[0].lon)
            };
        }

        const newArea = new Area({ 
            name, 
            district, 
            city, 
            zone, 
            ward, 
            pincode,
            coordinates 
        });
        await newArea.save();
        res.status(201).json({ success: true, area: newArea });
    } catch (err) {
        console.error("CreateArea Error:", err);
        res.status(500).json({ success: false, message: err.message || "Internal server error" });
    }
};

// PATCH /api/areas/:id
exports.updateArea = async (req, res) => {
    try {
        const updatedArea = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedArea) return res.status(404).json({ success: false, message: "Area not found" });
        res.status(200).json({ success: true, area: updatedArea });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// DELETE /api/areas/:id
exports.deleteArea = async (req, res) => {
    try {
        const area = await Area.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
        if (!area) return res.status(404).json({ success: false, message: "Area not found" });
        res.status(200).json({ success: true, message: "Area deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// SEED /api/seed/areas
exports.seedAreas = async (req, res) => {
    try {
        let count = 0;
        for (const district in himachalData) {
            for (const city of himachalData[district]) {
                const existing = await Area.findOne({ district, city, isDeleted: false });
                if (!existing) {
                    await Area.create({
                        name: city,
                        district,
                        city,
                        state: "Himachal Pradesh",
                        zone: "",
                        ward: "",
                        pincode: "000000", // Default or dummy
                        coordinates: { lat: 31.1048, lng: 77.1734 } // Default
                    });
                    count++;
                }
            }
        }
        res.status(200).json({ success: true, message: `Seeded ${count} areas.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/districts
exports.getDistricts = async (req, res) => {
    try {
        const districtsList = Object.keys(himachalData);
        res.status(200).json({ success: true, districts: districtsList });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/cities/:district
exports.getCitiesByDistrict = async (req, res) => {
    try {
        const cities = himachalData[req.params.district] || [];
        res.status(200).json({ success: true, cities });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
