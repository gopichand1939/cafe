const express = require("express");
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
} = require("./paymentController");
const { requireCustomerAuth } = require("../auth/customerAuthMiddleware");

const router = express.Router();

router.post("/create-payment-intent", requireCustomerAuth, createPaymentIntent);
router.post("/confirm-payment", requireCustomerAuth, confirmPayment);
router.post("/webhook", stripeWebhook);

module.exports = router;
