const db = require("../config/db");

const ORDER_CHANGES_CHANNEL = "order_changes";

const buildOrderChangePayload = ({
  entity = "order",
  action,
  entityId = null,
  orderId = null,
  customerId = null,
  ...rest
}) => ({
  entity,
  action,
  entityId,
  orderId,
  customerId,
  ...rest,
  emittedAt: new Date().toISOString(),
  source: "admin-backend",
});

const publishOrderChange = async (change) => {
  const payload = buildOrderChangePayload(change);

  await db.query("SELECT pg_notify($1, $2)", [
    ORDER_CHANGES_CHANNEL,
    JSON.stringify(payload),
  ]);

  console.log("[order-events][admin] Published order change:", payload);

  return payload;
};

const publishOrderChangeSafely = async (change) => {
  try {
    await publishOrderChange(change);
  } catch (error) {
    console.error("Failed to publish order change event:", error);
  }
};

module.exports = {
  ORDER_CHANGES_CHANNEL,
  publishOrderChange,
  publishOrderChangeSafely,
};
