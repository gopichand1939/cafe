const express = require("express");
const {
  getPaymentList,
  getPaymentById,
  getPaymentSummary,
} = require("./PaymentController");
const { requireAdminAuth } = require("../Login/authMiddleware");

const router = express.Router();

router.post("/payment_list", requireAdminAuth, getPaymentList);
router.post("/get_payment_byId", requireAdminAuth, getPaymentById);
router.post("/payment_summary", requireAdminAuth, getPaymentSummary);

module.exports = router;
