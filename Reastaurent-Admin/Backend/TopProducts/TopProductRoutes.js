const express = require("express");
const {
  getTopProducts,
  addTopProducts,
  updateTopProduct,
  deleteTopProduct,
  reorderTopProducts,
  searchItems,
  getTopProductLimit,
  updateTopProductLimit,
} = require("./TopProductsController");

const router = express.Router();

router.post("/list", getTopProducts);
router.post("/add", addTopProducts);
router.post("/update", updateTopProduct);
router.post("/delete", deleteTopProduct);
router.post("/reorder", reorderTopProducts);
router.post("/search-items", searchItems);
router.post("/get-limit", getTopProductLimit);
router.post("/update-limit", updateTopProductLimit);

module.exports = router;
