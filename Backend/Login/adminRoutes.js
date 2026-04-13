const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  refreshAdminToken,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
} = require("./adminController");
const { requireAdminAuth } = require("./authMiddleware");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/refresh-token", refreshAdminToken);
router.post("/logout", requireAdminAuth, logoutAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAdminAuth, changePassword);
router.get("/profile", requireAdminAuth, getProfile);

module.exports = router;
