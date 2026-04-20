import {
  CUSTOMER_CONFIRM_PAYMENT,
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
