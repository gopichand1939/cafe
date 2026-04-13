const categoryModel = require("./categoryModel");
const db = require("../config/db");

const createCategory = async (req, res) => {
  try {
    const { category_name, category_description } = req.body;

    if (!category_name || !String(category_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "category_name is required",
      });
    }

    const normalizedName = String(category_name).trim();
    const normalizedImage = req.file
      ? `category-images/${req.file.filename}`
      : null;

    if (!normalizedImage) {
      return res.status(400).json({
        success: false,
        message: "category_image is required",
      });
    }

    const data = await categoryModel.createCategory(
      normalizedName,
      category_description || null,
      normalizedImage || null
    );

    if (!data) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
      data,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getCategoryList = async (req, res) => {
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
    const rows = await categoryModel.getCategoryList(limit, offset);
    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...item }) => item);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Category list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching category list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


const getCategoryById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const data = await categoryModel.getCategoryById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching category by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const {
      id,
      category_name,
      category_description,
      is_active = 1,
    } = req.body;

    if (!id || !category_name || !String(category_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "id and category_name are required",
      });
    }

    const normalizedName = String(category_name).trim();
    const normalizedImage = req.file
      ? `category-images/${req.file.filename}`
      : null;
    const normalizedActive = Number(is_active) === 0 ? 0 : 1;

    const data = await categoryModel.updateCategory(
      id,
      normalizedName,
      category_description || null,
      normalizedImage || null,
      normalizedActive
    );

    if (!data?.target_exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (data?.duplicate_exists) {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const {
      target_exists,
      duplicate_exists,
      ...updatedCategory
    } = data;

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const existingCategory = await categoryModel.getCategoryById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await categoryModel.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};




const getCategory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        category_name,
        category_image
      FROM category
      WHERE is_deleted = 0
        AND is_active = 1
      ORDER BY id
    `);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching category dropdown:", error);
    return res.status(500).json({
      success: false,
      message: "failed to fetch",
      error: error.message,
    });
  }
};

module.exports = {
  createCategory,
  getCategoryList,
  
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategory,
};
