const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";
const ADMIN_PROFILE_KEY = "admin_profile";

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

export const setAuthSession = ({ accessToken, refreshToken, admin, persist = true }) => {
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
};

export const clearAuthSession = () => {
  storageTargets().forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(ADMIN_PROFILE_KEY);
  });
};
