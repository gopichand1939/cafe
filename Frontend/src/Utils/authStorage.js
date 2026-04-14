import { getMenuRoutePath } from "./menuConfig";

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const ADMIN_PROFILE_KEY = "admin_profile";
const ADMIN_MENU_KEY = "admin_menu_array";

const getWindowStorage = (type) => {
  if (typeof window === "undefined") {
    return null;
  }

  return type === "session" ? window.sessionStorage : window.localStorage;
};

const storageTargets = () => [
  getWindowStorage("local"),
  getWindowStorage("session"),
].filter(Boolean);

const readFirst = (key) => {
  for (const storage of storageTargets()) {
    const value = storage.getItem(key);
    if (value) {
      return value;
    }
  }

  return "";
};

export const getAccessToken = () => readFirst(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => readFirst(REFRESH_TOKEN_KEY);

export const getStoredAdminProfile = () => {
  const value = readFirst(ADMIN_PROFILE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

export const getStoredAdminMenus = () => {
  const value = readFirst(ADMIN_MENU_KEY);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const buildMenuTree = (menus = []) => {
  const map = new Map();

  menus.forEach((menu) => {
    map.set(menu.menu_id, {
      ...menu,
      children: [],
    });
  });

  const rootMenus = [];

  menus.forEach((menu) => {
    const current = map.get(menu.menu_id);
    const parentId = Number(menu.parent_menu_id) || 0;

    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(current);
    } else {
      rootMenus.push(current);
    }
  });

  const sortMenus = (items) =>
    items
      .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
      .map((item) => ({
        ...item,
        children: sortMenus(item.children || []),
      }));

  return sortMenus(rootMenus);
};

export const getStoredAdminMenuTree = () => buildMenuTree(getStoredAdminMenus());

export const getFirstAccessibleRoute = (menus = getStoredAdminMenus()) => {
  const sortedMenus = [...menus].sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0));

  for (const menu of sortedMenus) {
    const resolvedPath = getMenuRoutePath(menu.menu_key);

    if (resolvedPath) {
      return resolvedPath;
    }
  }

  return "/dashboard";
};

export const setAuthSession = ({
  accessToken,
  refreshToken,
  admin,
  menuArray = [],
  persist = true,
}) => {
  clearAuthSession();

  const storage = getWindowStorage(persist ? "local" : "session");
  if (!storage) {
    return;
  }

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (admin) {
    storage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
  }

  if (Array.isArray(menuArray)) {
    storage.setItem(ADMIN_MENU_KEY, JSON.stringify(menuArray));
  }
};

export const clearAuthSession = () => {
  storageTargets().forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(ADMIN_PROFILE_KEY);
    storage.removeItem(ADMIN_MENU_KEY);
  });
};
