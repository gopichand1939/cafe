const ACCESS_TOKEN_KEY = "customer_access_token";
const REFRESH_TOKEN_KEY = "customer_refresh_token";
const CUSTOMER_KEY = "customer_profile";

const isBrowser = typeof window !== "undefined";

const readJson = (key) => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return null;
  }
};

export const customerAuthStorage = {
  getAccessToken() {
    if (!isBrowser) {
      return "";
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  },

  getRefreshToken() {
    if (!isBrowser) {
      return "";
    }

    return window.localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  },

  getCustomer() {
    return readJson(CUSTOMER_KEY);
  },

  setSession({ accessToken, refreshToken, customer }) {
    if (!isBrowser) {
      return;
    }

    if (accessToken) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (customer) {
      window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
  },

  updateCustomer(customer) {
    if (!isBrowser) {
      return;
    }

    if (customer) {
      window.localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
  },

  clearSession() {
    if (!isBrowser) {
      return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_KEY);
  },
};
