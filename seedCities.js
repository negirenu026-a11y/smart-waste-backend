const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const CityData = require("./models/cityDataModel");
const connectDB = require("./config/db");

const seedCities = async () => {
  await connectDB();

  const cities = [
    // SHIMLA
    {
      state: "Himachal Pradesh",
      city: "Shimla",
      areas: ["Mall Road", "Sanjauli", "Chotta Shimla", "Jakhu"],
      totalComplaints: 25,
      workersAvailable: 15,
      zone: "North"
    },

    // KINNAUR
    {
      state: "Himachal Pradesh",
      city: "Kinnaur",
      areas: ["Reckong Peo", "Kalpa", "Sangla"],
      totalComplaints: 5,
      workersAvailable: 4,
      zone: "East"
    },

    // MANALI (KULLU)
    {
      state: "Himachal Pradesh",
      city: "Manali",
      areas: ["Old Manali", "Vashisht", "Aleo"],
      totalComplaints: 18,
      workersAvailable: 12,
      zone: "North"
    },

    // SOLAN
    {
      state: "Himachal Pradesh",
      city: "Solan",
      areas: ["Mall Road", "Deonghat", "Chambaghat"],
      totalComplaints: 12,
      workersAvailable: 8,
      zone: "South"
    },

    // DHARAMSHALA (KANGRA)
    {
      state: "Himachal Pradesh",
      city: "Dharamshala",
      areas: ["McLeod Ganj", "Kotwali Bazaar", "Forsyth Ganj"],
      totalComplaints: 22,
      workersAvailable: 14,
      zone: "West"
    },

    // KULLU
    {
      state: "Himachal Pradesh",
      city: "Kullu",
      areas: ["Dhalpur", "Bhuntar", "Bajaura"],
      totalComplaints: 14,
      workersAvailable: 9,
      zone: "North"
    },

    // MANDI
    {
      state: "Himachal Pradesh",
      city: "Mandi",
      areas: ["Sundernagar", "Jogindernagar", "Paddal"],
      totalComplaints: 16,
      workersAvailable: 11,
      zone: "Central"
    },

    // BILASPUR
    {
      state: "Himachal Pradesh",
      city: "Bilaspur",
      areas: ["Ghumarwin", "Jhandutta", "Kandraur"],
      totalComplaints: 9,
      workersAvailable: 6,
      zone: "South"
    },

    // HAMIRPUR
    {
      state: "Himachal Pradesh",
      city: "Hamirpur",
      areas: ["Nadaun", "Barsar", "Sujanpur"],
      totalComplaints: 11,
      workersAvailable: 7,
      zone: "West"
    },

    // UNA
    {
      state: "Himachal Pradesh",
      city: "Una",
      areas: ["Amb", "Haroli", "Gagret"],
      totalComplaints: 10,
      workersAvailable: 6,
      zone: "West"
    },

    // CHAMBA
    {
      state: "Himachal Pradesh",
      city: "Chamba",
      areas: ["Dalhousie", "Bharmour", "Tissa"],
      totalComplaints: 13,
      workersAvailable: 8,
      zone: "North"
    },

    // LAHAUL & SPITI
    {
      state: "Himachal Pradesh",
      city: "Lahaul Spiti",
      areas: ["Keylong", "Kaza", "Udaipur"],
      totalComplaints: 3,
      workersAvailable: 2,
      zone: "East"
    },

    // SIRMAUR
    {
      state: "Himachal Pradesh",
      city: "Sirmaur",
      areas: ["Nahan", "Paonta Sahib", "Shillai"],
      totalComplaints: 12,
      workersAvailable: 7,
      zone: "South"
    }
  ];

  try {
    for (const city of cities) {
      await CityData.findOneAndUpdate(
        { city: city.city },
        city,
        { upsert: true, new: true }
      );
    }

    console.log("✅ All Himachal city data seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding city data:", err);
    process.exit(1);
  }
};

seedCities();