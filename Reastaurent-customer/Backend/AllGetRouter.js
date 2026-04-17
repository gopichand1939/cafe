const express = require("express");
const router = express.Router();

const {
  getCategory,
  getItemsByCategory,
  getItemAddons,
} = require("./AllGetControler");

router.post("/categories", getCategory);
router.post("/items-by-category", getItemsByCategory);
router.post("/item-addons", getItemAddons);

module.exports = router;
