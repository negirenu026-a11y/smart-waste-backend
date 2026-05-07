const mongoose = require("mongoose");
const MC = require("../models/mcModel");
require("dotenv").config();

const mcNames = [
  { "name": "Aarav Sharma" }, { "name": "Vivaan Singh" }, { "name": "Aditya Verma" }, { "name": "Vihaan Kapoor" },
  { "name": "Arjun Mehta" }, { "name": "Sai Patel" }, { "name": "Reyansh Gupta" }, { "name": "Krishna Yadav" },
  { "name": "Ishaan Malhotra" }, { "name": "Shaurya Joshi" }, { "name": "Atharv Mishra" }, { "name": "Dhruv Saxena" },
  { "name": "Kabir Bansal" }, { "name": "Rudra Thakur" }, { "name": "Yuvraj Chauhan" }, { "name": "Ayaan Arora" },
  { "name": "Dev Agrawal" }, { "name": "Parth Sood" }, { "name": "Lakshya Rana" }, { "name": "Harsh Vaid" },
  { "name": "Rohan Khanna" }, { "name": "Mohit Saini" }, { "name": "Nikhil Anand" }, { "name": "Karan Oberoi" },
  { "name": "Rahul Nanda" }, { "name": "Manav Tiwari" }, { "name": "Tushar Grover" }, { "name": "Siddharth Jain" },
  { "name": "Aniket Roy" }, { "name": "Varun Desai" }, { "name": "Priya Sharma" }, { "name": "Ananya Singh" },
  { "name": "Diya Verma" }, { "name": "Myra Kapoor" }, { "name": "Aadhya Mehta" }, { "name": "Sara Patel" },
  { "name": "Kiara Gupta" }, { "name": "Navya Yadav" }, { "name": "Pari Malhotra" }, { "name": "Siya Joshi" },
  { "name": "Ira Mishra" }, { "name": "Riya Saxena" }, { "name": "Saanvi Bansal" }, { "name": "Meher Thakur" },
  { "name": "Avni Chauhan" }, { "name": "Ishita Arora" }, { "name": "Pihu Agrawal" }, { "name": "Kavya Sood" },
  { "name": "Khushi Rana" }, { "name": "Sneha Vaid" }, { "name": "Neha Khanna" }, { "name": "Simran Saini" },
  { "name": "Naina Anand" }, { "name": "Muskan Oberoi" }, { "name": "Tanvi Nanda" }, { "name": "Jiya Tiwari" },
  { "name": "Payal Grover" }, { "name": "Shreya Jain" }, { "name": "Ritika Roy" }, { "name": "Vidhi Desai" },
  { "name": "Aman Dogra" }, { "name": "Pankaj Negi" }, { "name": "Deepak Rawat" }, { "name": "Sunil Bhardwaj" },
  { "name": "Komal Rana" }, { "name": "Rekha Thakur" }, { "name": "Meena Chauhan" }, { "name": "Geeta Sharma" },
  { "name": "Suresh Kumar" }, { "name": "Rajesh Pathania" }, { "name": "Pooja Jamwal" }
];

const hpData = {
  "Himachal_Pradesh": {
    "Bilaspur": ["Bilaspur", "Ghumarwin", "Naina Devi", "Jhandutta", "Talai"],
    "Chamba": ["Chamba", "Dalhousie", "Bharmour", "Banikhet", "Khajjiar", "Pangi"],
    "Hamirpur": ["Hamirpur", "Nadaun", "Sujanpur Tira", "Bhoranj", "Barsar"],
    "Kangra": ["Dharamshala", "Palampur", "Kangra", "Baijnath", "Dehra Gopipur", "Nurpur", "Jawalamukhi", "Nagrota Bagwan", "McLeod Ganj"],
    "Kinnaur": ["Reckong Peo", "Kalpa", "Sangla", "Pooh", "Nichar"],
    "Kullu": ["Kullu", "Manali", "Bhuntar", "Banjar", "Kasol", "Naggar"],
    "Lahaul_and_Spiti": ["Keylong", "Kaza", "Udaipur", "Tabo", "Sissu"],
    "Mandi": ["Mandi", "Sundernagar", "Jogindernagar", "Sarkaghat", "Karsog", "Rewalsar"],
    "Shimla": ["Shimla", "Rohru", "Rampur Bushahr", "Theog", "Kufri", "Narkanda", "Chopal"],
    "Sirmaur": ["Nahan", "Paonta Sahib", "Rajgarh", "Shillai", "Renuka"],
    "Solan": ["Solan", "Baddi", "Nalagarh", "Kasauli", "Parwanoo", "Arki"],
    "Una": ["Una", "Amb", "Gagret", "Mehatpur", "Haroli", "Santokhgarh"]
  }
};

const seedMCs = async () => {
  try {
    // Clear existing MCs if needed, or skip if already seeded
    const count = await MC.countDocuments();
    if (count > 0) {
      console.log("ℹ️ MC data already exists. Skipping seed.");
      return;
    }

    console.log("🌱 Seeding MC data for Himachal Pradesh cities...");

    const allMCs = [];
    let nameIndex = 0;

    const state = "Himachal Pradesh";
    const districts = hpData.Himachal_Pradesh;

    for (const district in districts) {
      const cities = districts[district];
      for (const city of cities) {
        if (nameIndex < mcNames.length) {
          allMCs.push({
            name: mcNames[nameIndex].name,
            state: state,
            district: district.replace("_", " "),
            city: city,
            zone: "Auto",
            ward: "Default",
            isDeleted: false
          });
          nameIndex++;
        }
      }
    }

    await MC.insertMany(allMCs);
    console.log(`✅ Successfully seeded ${allMCs.length} MCs.`);

  } catch (err) {
    console.error("❌ MC Seeding failed:", err.message);
  }
};

module.exports = seedMCs;

// If run directly
if (require.main === module) {
  const connectDB = require("../config/db");
  connectDB().then(() => {
    seedMCs().then(() => {
      console.log("Seeding finished.");
      process.exit(0);
    });
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
