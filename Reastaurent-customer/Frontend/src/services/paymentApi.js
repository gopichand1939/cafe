import {
  CUSTOMER_CONFIRM_CHECKOUT_SESSION,
  CUSTOMER_CONFIRM_PAYMENT,
  CUSTOMER_CREATE_CHECKOUT_SESSION,
  CUSTOMER_CREATE_PAYMENT_INTENT,
} from "../Utils/Constant";

const parseJsonResponse = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
};

export const createCustomerPaymentIntent = async (
  { amount, orderId },
  accessToken
) => {
  const response = await fetch(CUSTOMER_CREATE_PAYMENT_INTENT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      amount,
      orderId,
    }),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to create payment");
  }

  return result.data;
};

export const confirmCustomerPayment = async (paymentIntentId, accessToken) => {
  const response = await fetch(CUSTOMER_CONFIRM_PAYMENT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      paymentIntentId,
    }),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to confirm payment");
  }

  return result.data;
};

export const createCustomerCheckoutSession = async (
  { orderId, checkoutPayload, successUrl, cancelUrl },
  accessToken
) => {
  const response = await fetch(CUSTOMER_CREATE_CHECKOUT_SESSION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      orderId,
      checkoutPayload,
      successUrl,
      cancelUrl,
    }),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to start checkout");
  }

  return result.data;
};

export const confirmCustomerCheckoutSession = async (sessionId, accessToken) => {
  const response = await fetch(CUSTOMER_CONFIRM_CHECKOUT_SESSION, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      sessionId,
    }),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Failed to confirm checkout");
  }

  return result.data;
};
