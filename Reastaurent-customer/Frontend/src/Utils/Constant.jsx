export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/g,
  ""
);

export const CATEGORY_LIST = `${API_BASE_URL}/categories`;
export const ITEMS_BY_CATEGORY = `${API_BASE_URL}/items-by-category`;
export const ITEM_ADDONS = `${API_BASE_URL}/item-addons`;
