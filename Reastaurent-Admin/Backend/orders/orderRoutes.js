const express = require("express");
const {
  createOrder,
  getOrderList,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("./OrderController");

const router = express.Router();

router.post("/create_order", createOrder);
router.post("/order_list", getOrderList);
router.post("/get_order_byId", getOrderById);
router.post("/update_order_status", updateOrderStatus);
router.post("/delete_order", deleteOrder);

module.exports = router;
