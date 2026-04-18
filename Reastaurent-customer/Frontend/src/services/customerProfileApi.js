import {
  CUSTOMER_PROFILE,
  CUSTOMER_UPDATE_PROFILE,
} from "../Utils/Constant";

const parseJsonResponse = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

const authorizedFetch = async (url, options = {}, accessToken = "") => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result;
};

export const fetchCustomerProfile = async (accessToken) => {
  const result = await authorizedFetch(
    CUSTOMER_PROFILE,
    {
      method: "GET",
    },
    accessToken
  );

  return result.data;
};

export const updateCustomerProfile = async (payload, accessToken) => {
  const result = await authorizedFetch(
    CUSTOMER_UPDATE_PROFILE,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken
  );

  return result.data;
};
