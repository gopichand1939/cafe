// Deployed backend
export const BACKEND_BASE_URL = "https://cafe-backend-pdkr.onrender.com";

// Local backend
// export const BACKEND_BASE_URL = "http://localhost:15013";

const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

export const CATEGORY_CREATE = `${API_BASE_URL}/category/create_category`;
export const CATEGORY_LIST = `${API_BASE_URL}/category/category_list`;
export const CATEGORY_GET = `${API_BASE_URL}/category/get_category`;
export const CATEGORY_BY_ID = `${API_BASE_URL}/category/get_category_byId`;
export const CATEGORY_UPDATE = `${API_BASE_URL}/category/update_category`;
export const CATEGORY_DELETE = `${API_BASE_URL}/category/delete_category`;

export const ITEM_CREATE = `${API_BASE_URL}/items/create_item`;
export const ITEM_LIST = `${API_BASE_URL}/items/item_list`;
export const ITEM_BY_ID = `${API_BASE_URL}/items/get_item_byId`;
export const ITEM_UPDATE = `${API_BASE_URL}/items/update_item`;
export const ITEM_DELETE = `${API_BASE_URL}/items/delete_item`;

export const APP_TITLE = "";
