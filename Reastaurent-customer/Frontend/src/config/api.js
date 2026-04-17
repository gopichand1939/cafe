const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/g, "");

const getBrowserOrigin = () =>
  typeof window === "undefined" ? "" : window.location.origin;

const toWebSocketOrigin = (value = "") =>
  String(value || "").replace(/^http/i, "ws");

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "/api"
);

export const CATEGORY_LIST = `${API_BASE_URL}/categories`;
export const ITEMS_BY_CATEGORY = `${API_BASE_URL}/items-by-category`;
export const ITEM_ADDONS = `${API_BASE_URL}/item-addons`;

export const MENU_UPDATES_WS_URL =
  trimTrailingSlash(import.meta.env.VITE_MENU_UPDATES_WS_URL) ||
  `${toWebSocketOrigin(getBrowserOrigin())}/ws`;
