const itemModel = require("./itemModel");

const createItem = async (req, res) => {
  try {
    const { category_id, item_name, item_description } = req.body;

    if (!category_id || !item_name || !String(item_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "category_id and item_name are required",
      });
    }

    const normalizedName = String(item_name).trim();
    const normalizedImage = req.file
      ? `item-images/${req.file.filename}`
      : null;

    if (!normalizedImage) {
      return res.status(400).json({
        success: false,
        message: "item_image is required",
      });
    }

    const data = await itemModel.createItem(
      category_id,
      normalizedName,
      item_description || null,
      normalizedImage
    );

    if (!data) {
      return res.status(409).json({
        success: false,
        message: "Invalid category or item name already exists in this category",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item created successfully",
      data,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getItemList = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.body;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) {
      page = 1;
    }

    if (Number.isNaN(limit) || limit < 1) {
      limit = 10;
    }

    const offset = (page - 1) * limit;
    const rows = await itemModel.getItemList(limit, offset);
    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...item }) => item);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Item list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching item list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const data = await itemModel.getItemById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching item by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const {
      id,
      category_id,
      item_name,
      item_description,
      is_active = 1,
    } = req.body;

    if (!id || !category_id || !item_name || !String(item_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "id, category_id and item_name are required",
      });
    }

    const normalizedName = String(item_name).trim();
    const normalizedImage = req.file
      ? `item-images/${req.file.filename}`
      : null;
    const normalizedActive = Number(is_active) === 0 ? 0 : 1;

    const data = await itemModel.updateItem(
      id,
      category_id,
      normalizedName,
      item_description || null,
      normalizedImage,
      normalizedActive
    );

    if (!data?.target_exists) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (!data?.category_exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (data?.duplicate_exists) {
      return res.status(409).json({
        success: false,
        message: "Item name already exists in this category",
      });
    }

    const {
      target_exists,
      category_exists,
      duplicate_exists,
      ...updatedItem
    } = data;

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const existingItem = await itemModel.getItemById(id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    await itemModel.deleteItem(id);

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createItem,
  getItemList,
  getItemById,
  updateItem,
  deleteItem,
};
