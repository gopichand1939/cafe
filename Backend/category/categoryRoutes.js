const express = require("express");
const {
  createCategory,
  getCategoryList,
  getCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("./CategoryController");
const upload = require("./uploadMiddleware");

const router = express.Router();

router.post("/create_category", upload.single("category_image"), createCategory);
router.post("/category_list", getCategoryList);
router.get("/get_category", getCategory);
router.post("/get_category_byId", getCategoryById);
router.post("/update_category", upload.single("category_image"), updateCategory);
router.post("/delete_category", deleteCategory);

module.exports = router;
