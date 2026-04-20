const Stripe = require("stripe");
const db = require("../config/db");
const { publishOrderChangeSafely } = require("../realtime/orderEvents");
const { publishPaymentChangeSafely } = require("../realtime/paymentEvents");

const STRIPE_CURRENCY = "inr";
const PAYMENT_GATEWAY = "stripe";
const STRIPE_MIN_INR_AMOUNT = Number(process.env.STRIPE_MIN_INR_AMOUNT || 50);

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return Stripe(process.env.STRIPE_SECRET_KEY);
};

const normalizeAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
};

const toPaise = (amount) => Math.round(amount * 100);

const generateRrn = () => {
  const stamp = Date.now().toString().slice(-10);
  const randomPart = Math.floor(Math.random() * 900000 + 100000);
  return `PAY-${stamp}-${randomPart}`;
};

const getCustomerOrder = async ({ orderId, customerId }) => {
  const query = `
    SELECT
      id,
      order_number,
      customer_id,
      customer_email,
      payment_status,
      payment_method,
      total_amount,
      currency_code,
      is_deleted
    FROM orders
    WHERE id = $1
      AND customer_id = $2
      AND is_deleted = 0
    LIMIT 1;
  `;

  const result = await db.query(query, [orderId, customerId]);
  return result.rows[0] || null;
};

const createPaymentRecord = async ({
  orderId,
  customerId,
  paymentIntent,
  amount,
  amountInPaise,
  metadata,
}) => {
  const query = `
    INSERT INTO payments (
      order_id,
      customer_id,
      gateway,
      rrn,
      transaction_id,
      amount,
      amount_in_paise,
      currency_code,
      status,
      is_payment_success,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10::jsonb)
    ON CONFLICT (transaction_id)
    DO UPDATE SET
      order_id = EXCLUDED.order_id,
      customer_id = EXCLUDED.customer_id,
      rrn = payments.rrn,
      amount = EXCLUDED.amount,
      amount_in_paise = EXCLUDED.amount_in_paise,
      currency_code = EXCLUDED.currency_code,
      status = EXCLUDED.status,
      metadata = EXCLUDED.metadata,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const result = await db.query(query, [
    orderId,
    customerId,
    PAYMENT_GATEWAY,
    generateRrn(),
    paymentIntent.id,
    amount,
    amountInPaise,
    String(paymentIntent.currency || STRIPE_CURRENCY).toUpperCase(),
    paymentIntent.status,
    JSON.stringify(metadata || {}),
  ]);

  const payment = result.rows[0] || null;

  if (payment) {
    await publishPaymentChangeSafely({
      entity: "payment",
      action: "created",
      entityId: payment.id,
      paymentId: payment.id,
      orderId: payment.order_id,
      customerId: payment.customer_id,
      entityData: payment,
    });
  }

  return payment;
};

const createPaymentIntent = async ({ amount, orderId = null, customer }) => {
  if (!customer?.id) {
    const error = new Error("Customer authentication is required");
    error.statusCode = 401;
    throw error;
  }

  let order = null;
  let payableAmount = normalizeAmount(amount);

  if (orderId) {
    order = await getCustomerOrder({
      orderId: Number(orderId),
      customerId: customer.id,
    });

    if (!order) {
      const error = new Error("Order not found for this customer");
      error.statusCode = 404;
      throw error;
    }

    if (String(order.payment_status || "").toLowerCase() === "paid") {
      const error = new Error("This order is already paid");
      error.statusCode = 400;
      throw error;
    }

    payableAmount = normalizeAmount(order.total_amount);
  }

  if (!payableAmount) {
    const error = new Error("A valid amount is required");
    error.statusCode = 400;
    throw error;
  }

  if (payableAmount < STRIPE_MIN_INR_AMOUNT) {
    const error = new Error(
      `Online payment minimum is Rs ${STRIPE_MIN_INR_AMOUNT.toFixed(
        2
      )}. Please add more items or choose cash on delivery.`
    );
    error.statusCode = 400;
    throw error;
  }

  const amountInPaise = toPaise(payableAmount);
  const metadata = {
    orderId: order?.id ? String(order.id) : "",
    orderNumber: order?.order_number || "",
    customerId: String(customer.id),
    customerEmail: customer.email || order?.customer_email || "",
  };

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountInPaise,
    currency: STRIPE_CURRENCY,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
    metadata,
  });

  const payment = await createPaymentRecord({
    orderId: order?.id || null,
    customerId: customer.id,
    paymentIntent,
    amount: payableAmount,
    amountInPaise,
    metadata,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    payment,
  };
};

const buildOrderRealtimePayload = (order) =>
  order
    ? {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        item_count: order.item_count,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }
    : null;

const getOrderById = async (orderId) => {
  const query = `
    SELECT
      id,
      order_number,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      order_status,
      payment_status,
      payment_method,
      total_amount,
      item_count,
      created_at,
      updated_at
    FROM orders
    WHERE id = $1
      AND is_deleted = 0
    LIMIT 1;
  `;

  const result = await db.query(query, [orderId]);
  return result.rows[0] || null;
};

const markOrderPaid = async ({ orderId, paymentMethod = "stripe" }) => {
  if (!orderId) {
    return null;
  }

  const query = `
    UPDATE orders
    SET
      payment_status = 'paid',
      payment_method = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND is_deleted = 0
    RETURNING
      id,
      order_number,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      order_status,
      payment_status,
      payment_method,
      total_amount,
      item_count,
      created_at,
      updated_at;
  `;

  const result = await db.query(query, [orderId, paymentMethod]);
  const order = result.rows[0] || null;

  if (order) {
    await publishOrderChangeSafely({
      entity: "order",
      action: "updated",
      entityId: order.id,
      orderId: order.id,
      customerId: order.customer_id,
      entityData: buildOrderRealtimePayload(order),
    });
  }

  return order;
};

const updatePaymentFromSucceededIntent = async ({ paymentIntent, event }) => {
  const orderId = Number(paymentIntent.metadata?.orderId || 0) || null;
  const customerId = Number(paymentIntent.metadata?.customerId || 0) || null;
  const chargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id || null;

  const query = `
    UPDATE payments
    SET
      order_id = COALESCE($2, order_id),
      customer_id = COALESCE($3, customer_id),
      provider_payment_id = $4,
      provider_charge_id = $5,
      amount = $6,
      amount_in_paise = $7,
      currency_code = $8,
      payment_method = COALESCE($9, payment_method),
      status = $10,
      is_payment_success = 1,
      failure_code = NULL,
      failure_message = NULL,
      metadata = $11::jsonb,
      raw_event = $12::jsonb,
      paid_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE transaction_id = $1
    RETURNING *;
  `;

  const result = await db.query(query, [
    paymentIntent.id,
    orderId,
    customerId,
    paymentIntent.id,
    chargeId,
    Number((paymentIntent.amount_received / 100).toFixed(2)),
    paymentIntent.amount_received,
    String(paymentIntent.currency || STRIPE_CURRENCY).toUpperCase(),
    paymentIntent.payment_method_types?.[0] || "stripe",
    paymentIntent.status,
    JSON.stringify(paymentIntent.metadata || {}),
    JSON.stringify(event || {}),
  ]);

  if (orderId) {
    await markOrderPaid({
      orderId,
      paymentMethod: "stripe",
    });
  }

  const payment = result.rows[0] || null;

  if (payment) {
    await publishPaymentChangeSafely({
      entity: "payment",
      action: "succeeded",
      entityId: payment.id,
      paymentId: payment.id,
      orderId: payment.order_id,
      customerId: payment.customer_id,
      entityData: payment,
    });
  }

  return payment;
};

const updatePaymentFromFailedIntent = async ({ paymentIntent, event }) => {
  const query = `
    UPDATE payments
    SET
      status = $2,
      is_payment_success = 0,
      failure_code = $3,
      failure_message = $4,
      raw_event = $5::jsonb,
      updated_at = CURRENT_TIMESTAMP
    WHERE transaction_id = $1
    RETURNING *;
  `;

  const result = await db.query(query, [
    paymentIntent.id,
    paymentIntent.status,
    paymentIntent.last_payment_error?.code || null,
    paymentIntent.last_payment_error?.message || null,
    JSON.stringify(event || {}),
  ]);

  const payment = result.rows[0] || null;

  if (payment) {
    await publishPaymentChangeSafely({
      entity: "payment",
      action: "failed",
      entityId: payment.id,
      paymentId: payment.id,
      orderId: payment.order_id,
      customerId: payment.customer_id,
      entityData: payment,
    });
  }

  return payment;
};

const confirmPayment = async ({ paymentIntentId, customer }) => {
  if (!paymentIntentId) {
    const error = new Error("paymentIntentId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!customer?.id) {
    const error = new Error("Customer authentication is required");
    error.statusCode = 401;
    throw error;
  }

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const metadataCustomerId = Number(paymentIntent.metadata?.customerId || 0);

  if (metadataCustomerId !== Number(customer.id)) {
    const error = new Error("Payment does not belong to this customer");
    error.statusCode = 403;
    throw error;
  }

  if (paymentIntent.status !== "succeeded") {
    const error = new Error(`Payment is not successful yet. Current status: ${paymentIntent.status}`);
    error.statusCode = 400;
    throw error;
  }

  const payment = await updatePaymentFromSucceededIntent({
    paymentIntent,
    event: {
      type: "frontend.payment_confirmed",
      id: `frontend_${paymentIntent.id}`,
    },
  });
  const orderId = Number(paymentIntent.metadata?.orderId || 0);
  const order = orderId ? await getOrderById(orderId) : null;

  return {
    payment,
    order,
  };
};

const handleStripeWebhook = async ({ rawBody, signature }) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    const error = new Error("STRIPE_WEBHOOK_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }

  if (event.type === "payment_intent.succeeded") {
    await updatePaymentFromSucceededIntent({
      paymentIntent: event.data.object,
      event,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    await updatePaymentFromFailedIntent({
      paymentIntent: event.data.object,
      event,
    });
  }

  return event;
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getOrderById,
};
