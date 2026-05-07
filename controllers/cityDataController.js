const CityData = require("../models/cityDataModel");

// Get city data by city name
const getCityData = async (req, res) => {
  try {
    const cityName = req.params.city;
    const cityData = await CityData.findOne({ city: new RegExp(`^${cityName}$`, 'i') });

    if (!cityData) {
      // Return dummy data if not found
      return res.status(200).json({
        success: true,
        data: {
          state: "Himachal Pradesh",
          city: cityName,
          areas: ["Dummy Area 1", "Dummy Area 2"],
          totalComplaints: 0,
          workersAvailable: 0,
          zone: "Unassigned"
        },
        message: "Dummy data returned because real data was not found."
      });
    }

    res.status(200).json({
      success: true,
      data: cityData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

module.exports = {
  getCityData
};
