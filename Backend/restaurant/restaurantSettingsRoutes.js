const express = require("express");
const { requireAdminAuth } = require("../Login/authMiddleware");
const {
  getRestaurantSettings,
  updateRestaurantSettings,
  toggleRestaurantStatus,
} = require("./restaurantSettingsController");

const router = express.Router();

router.get("/settings", requireAdminAuth, getRestaurantSettings);
router.put("/settings", requireAdminAuth, updateRestaurantSettings);
router.patch("/toggle-status", requireAdminAuth, toggleRestaurantStatus);

module.exports = router;
