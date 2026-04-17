const express = require("express");
const {
  createItem,
  getItemList,
  getItemById,
  updateItem,
  deleteItem,
} = require("./ItemController");
const upload = require("./uploadMiddleware");

const router = express.Router();

router.post("/create_item", upload.single("item_image"), createItem);
router.post("/item_list", getItemList);
router.post("/get_item_byId", getItemById);
router.post("/update_item", upload.single("item_image"), updateItem);
router.post("/delete_item", deleteItem);

module.exports = router;
