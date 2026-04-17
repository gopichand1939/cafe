const db = require("./config/db");
const { attachImageUrl } = require("./media");

// ─── In-Memory Cache ───────────────────────────────────────
const cache = {
  categories: { data: null, timestamp: 0 },
  items: {},  // keyed by category_id
  addons: {}, // keyed by item_id
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (entry) => {
  return entry && entry.data && (Date.now() - entry.timestamp) < CACHE_TTL;
};

// ─── GET CATEGORIES (cached) ──────────────────────────────
const getCategory = async (req, res) => {
  try {
    // Return cached data if fresh
    if (isCacheValid(cache.categories)) {
      return res.status(200).json({
        success: true,
        data: cache.categories.data,
        cached: true,
      });
    }

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

    const categories = result.rows.map((row) => attachImageUrl(req, row, "category_image"));

    // Update cache
    cache.categories = { data: categories, timestamp: Date.now() };

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

// ─── GET ITEMS BY CATEGORY (cached + paginated) ──────────
const getItemsByCategory = async (req, res) => {
  try {
    const { category_id, page = 1, limit = 5 } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: "category_id is required",
      });
    }

    const cacheKey = `${category_id}_${page}_${limit}`;

    // Return cached data if fresh
    if (isCacheValid(cache.items[cacheKey])) {
      return res.status(200).json({
        ...cache.items[cacheKey].data,
        cached: true,
      });
    }

    const offset = (page - 1) * limit;

    const itemsQuery = `
      SELECT
        id,
        category_id,
        item_name,
        item_description,
        item_image,
        price,
        discount_price,
        preparation_time,
        is_popular,
        is_new,
        is_veg,
        is_active
      FROM items
      WHERE category_id = $1
        AND is_deleted = 0
        AND is_active = 1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) FROM items
      WHERE category_id = $1
        AND is_deleted = 0
        AND is_active = 1
    `;

    const [itemsResult, countResult] = await Promise.all([
      db.query(itemsQuery, [category_id, limit, offset]),
      db.query(countQuery, [category_id]),
    ]);

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    const items = itemsResult.rows.map((row) => attachImageUrl(req, row, "item_image"));

    const responseData = {
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };

    // Update cache
    cache.items[cacheKey] = { data: responseData, timestamp: Date.now() };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
};

const getItemAddons = async (req, res) => {
  try {
    const { item_id, page = 1, limit = 10 } = req.body;

    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: "item_id is required",
      });
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;
    const cacheKey = `${item_id}_${pageNumber}_${limitNumber}`;

    if (isCacheValid(cache.addons[cacheKey])) {
      return res.status(200).json({
        ...cache.addons[cacheKey].data,
        cached: true,
      });
    }

    const addonsQuery = `
      SELECT
        ia.id,
        ia.item_id,
        i.item_name,
        ia.addon_group,
        ia.addon_name,
        ia.addon_price,
        ia.sort_order,
        ia.created_at,
        ia.updated_at,
        ia.is_deleted,
        ia.is_active
      FROM item_addons ia
      INNER JOIN items i ON i.id = ia.item_id
      WHERE ia.item_id = $1
        AND ia.is_deleted = 0
        AND ia.is_active = 1
        AND i.is_deleted = 0
      ORDER BY ia.sort_order ASC, ia.id DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM item_addons
      WHERE item_id = $1
        AND is_deleted = 0
        AND is_active = 1
    `;

    const [addonsResult, countResult] = await Promise.all([
      db.query(addonsQuery, [item_id, limitNumber, offset]),
      db.query(countQuery, [item_id]),
    ]);

    const totalRecords = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalRecords / limitNumber) || 1;

    const responseData = {
      success: true,
      message: "Add-on list fetched successfully",
      data: addonsResult.rows,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
    };

    cache.addons[cacheKey] = { data: responseData, timestamp: Date.now() };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching item addons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch item addons",
      error: error.message,
    });
  }
};

module.exports = {
  getCategory,
  getItemsByCategory,
  getItemAddons,
};
