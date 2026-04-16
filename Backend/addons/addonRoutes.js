const express = require("express");
const {
  createAddon,
  getAddonList,
  getAddonById,
  updateAddon,
  deleteAddon,
  getAddonsByItem,
} = require("./AddonController");

const router = express.Router();

router.post("/create_addon", createAddon);
router.post("/addon_list", getAddonList);
router.post("/get_addon_byId", getAddonById);
router.post("/update_addon", updateAddon);
router.post("/delete_addon", deleteAddon);
router.post("/get_addons_by_item", getAddonsByItem);

module.exports = router;
