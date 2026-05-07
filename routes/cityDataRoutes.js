const express = require("express");
const router = express.Router();
const { getCityData } = require("../controllers/cityDataController");

router.get("/:city", getCityData);

module.exports = router;
