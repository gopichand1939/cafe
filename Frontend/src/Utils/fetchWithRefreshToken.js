import { ADMIN_REFRESH_TOKEN } from "./Constant";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from "./authStorage";

let refreshPromise = null;

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

const cloneHeaders = (headers) => {
  const normalizedHeaders = new Headers();

  if (headers instanceof Headers) {
    headers.forEach((value, key) => normalizedHeaders.set(key, value));
    return normalizedHeaders;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => normalizedHeaders.set(key, value));
    return normalizedHeaders;
  }

  if (headers && typeof headers === "object") {
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        normalizedHeaders.set(key, value);
      }
    });
  }

  return normalizedHeaders;
};

const buildRequestOptions = (options = {}, accessToken = "") => {
  const headers = cloneHeaders(options.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...options,
    headers,
  };
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    redirectToLogin();
    return null;
  }

  const response = await fetch(ADMIN_REFRESH_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    clearAuthSession();
    redirectToLogin();
    return null;
  }

  setAuthSession({
    accessToken: data?.data?.access_token,
    refreshToken: data?.data?.refresh_token,
    admin: data?.data?.admin,
    menuArray: data?.data?.menu_array,
  });

  return data?.data?.access_token || null;
};

const ensureFreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const fetchWithRefreshToken = async (url, options = {}) => {
  const accessToken = getAccessToken();
  let response = await fetch(url, buildRequestOptions(options, accessToken));

  if (response.status !== 401) {
    return response;
  }

  const freshAccessToken = await ensureFreshAccessToken();

  if (!freshAccessToken) {
    return response;
  }

  response = await fetch(url, buildRequestOptions(options, freshAccessToken));
  return response;
};

export default fetchWithRefreshToken;
