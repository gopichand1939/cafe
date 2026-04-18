import {
  CUSTOMER_NOTIFICATION_BY_ID,
  CUSTOMER_NOTIFICATION_LIST,
  CUSTOMER_NOTIFICATION_MARK_ALL_READ,
  CUSTOMER_NOTIFICATION_MARK_READ,
  CUSTOMER_NOTIFICATION_UNREAD_SUMMARY,
} from "../Utils/Constant";

const parseJsonResponse = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

const authorizedPost = async (url, payload, accessToken) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload || {}),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request failed");
  }

  return result;
};

export const fetchCustomerNotifications = async (
  accessToken,
  payload = {
    page: 1,
    limit: 20,
  }
) => {
  const result = await authorizedPost(CUSTOMER_NOTIFICATION_LIST, payload, accessToken);
  return result;
};

export const fetchCustomerNotificationById = async (id, accessToken) => {
  const result = await authorizedPost(CUSTOMER_NOTIFICATION_BY_ID, { id }, accessToken);
  return result.data;
};

export const markCustomerNotificationAsRead = async (id, accessToken) => {
  const result = await authorizedPost(
    CUSTOMER_NOTIFICATION_MARK_READ,
    { id },
    accessToken
  );
  return result.data;
};

export const markAllCustomerNotificationsAsRead = async (accessToken) => {
  const result = await authorizedPost(
    CUSTOMER_NOTIFICATION_MARK_ALL_READ,
    {},
    accessToken
  );
  return result;
};

export const fetchCustomerUnreadNotificationSummary = async (
  accessToken,
  limit = 10
) => {
  const result = await authorizedPost(
    CUSTOMER_NOTIFICATION_UNREAD_SUMMARY,
    { limit },
    accessToken
  );
  return result.data;
};
