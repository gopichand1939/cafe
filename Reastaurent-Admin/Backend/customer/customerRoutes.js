const express = require("express");
const {
  createCustomer,
  getCustomerList,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("./CustomerController");

const router = express.Router();

router.post("/create_customer", createCustomer);
router.post("/customer_list", getCustomerList);
router.post("/get_customer_byId", getCustomerById);
router.post("/update_customer", updateCustomer);
router.post("/delete_customer", deleteCustomer);

module.exports = router;
