const express = require("express");
const {
  getSummaryStats,
  getCategoryStats,
  getVegStats,
  getOrderStats,
} = require("./AllgetControllers");

const router = express.Router();

// Using POST for consistency with other listing APIs in the project
router.post("/summary", getSummaryStats);
router.post("/category-stats", getCategoryStats);
router.post("/veg-stats", getVegStats);
router.post("/order-stats", getOrderStats);

module.exports = router;
