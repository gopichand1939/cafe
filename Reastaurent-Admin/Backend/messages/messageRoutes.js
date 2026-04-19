const express = require("express");
const { requireAdminAuth } = require("../Login/authMiddleware");
const {
  getMessageSettings,
  updateMessageSettings,
  sendTestMessage,
} = require("./MessageController");

const router = express.Router();

router.get("/settings", requireAdminAuth, getMessageSettings);
router.put("/settings", requireAdminAuth, updateMessageSettings);
router.post("/test-mail", requireAdminAuth, sendTestMessage);

module.exports = router;
