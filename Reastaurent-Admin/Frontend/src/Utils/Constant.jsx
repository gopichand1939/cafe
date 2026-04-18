export const BACKEND_BASE_URL = (
  import.meta.env.VITE_BACKEND_BASE_URL)

export const CATEGORY_CREATE = `${BACKEND_BASE_URL}/category/create_category`;
export const CATEGORY_LIST = `${BACKEND_BASE_URL}/category/category_list`;
export const CATEGORY_GET = `${BACKEND_BASE_URL}/category/get_category`;
export const CATEGORY_BY_ID = `${BACKEND_BASE_URL}/category/get_category_byId`;
export const CATEGORY_UPDATE = `${BACKEND_BASE_URL}/category/update_category`;
export const CATEGORY_DELETE = `${BACKEND_BASE_URL}/category/delete_category`;

export const ITEM_CREATE = `${BACKEND_BASE_URL}/items/create_item`;
export const ITEM_LIST = `${BACKEND_BASE_URL}/items/item_list`;
export const ITEM_BY_ID = `${BACKEND_BASE_URL}/items/get_item_byId`;
export const ITEM_UPDATE = `${BACKEND_BASE_URL}/items/update_item`;
export const ITEM_DELETE = `${BACKEND_BASE_URL}/items/delete_item`;

export const ADDON_CREATE = `${BACKEND_BASE_URL}/addons/create_addon`;
export const ADDON_LIST = `${BACKEND_BASE_URL}/addons/addon_list`;
export const ADDON_BY_ID = `${BACKEND_BASE_URL}/addons/get_addon_byId`;
export const ADDON_UPDATE = `${BACKEND_BASE_URL}/addons/update_addon`;
export const ADDON_DELETE = `${BACKEND_BASE_URL}/addons/delete_addon`;
export const ADDON_BY_ITEM = `${BACKEND_BASE_URL}/addons/get_addons_by_item`;



export const ADMIN_REGISTER = `${BACKEND_BASE_URL}/admin/register`;
export const ADMIN_LOGIN = `${BACKEND_BASE_URL}/admin/login`;
export const ADMIN_REFRESH_TOKEN = `${BACKEND_BASE_URL}/admin/refresh-token`;
export const ADMIN_LOGOUT = `${BACKEND_BASE_URL}/admin/logout`;
export const ADMIN_FORGOT_PASSWORD = `${BACKEND_BASE_URL}/admin/forgot-password`;
export const ADMIN_RESET_PASSWORD = `${BACKEND_BASE_URL}/admin/reset-password`;
export const ADMIN_CHANGE_PASSWORD = `${BACKEND_BASE_URL}/admin/change-password`;
export const ADMIN_PROFILE = `${BACKEND_BASE_URL}/admin/profile`;
export const RESTAURANT_SETTINGS = `${BACKEND_BASE_URL}/restaurant/settings`;
export const RESTAURANT_TOGGLE_STATUS = `${BACKEND_BASE_URL}/restaurant/toggle-status`;




export const CUSTOMER_CREATE = `${BACKEND_BASE_URL}/customer/create_customer`;
export const CUSTOMER_LIST = `${BACKEND_BASE_URL}/customer/customer_list`;
export const CUSTOMER_BY_ID = `${BACKEND_BASE_URL}/customer/get_customer_byId`;
export const CUSTOMER_UPDATE = `${BACKEND_BASE_URL}/customer/update_customer`;
export const CUSTOMER_DELETE = `${BACKEND_BASE_URL}/customer/delete_customer`;

export const ORDER_CREATE = `${BACKEND_BASE_URL}/orders/create_order`;
export const ORDER_LIST = `${BACKEND_BASE_URL}/orders/order_list`;
export const ORDER_BY_ID = `${BACKEND_BASE_URL}/orders/get_order_byId`;
export const ORDER_UPDATE_STATUS = `${BACKEND_BASE_URL}/orders/update_order_status`;
export const ORDER_DELETE = `${BACKEND_BASE_URL}/orders/delete_order`;


export const APP_TITLE = "Bagel Master Cafe";
