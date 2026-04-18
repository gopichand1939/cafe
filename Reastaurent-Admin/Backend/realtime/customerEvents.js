const db = require("../config/db");

const CUSTOMER_CHANGES_CHANNEL = "customer_changes";

const buildCustomerChangePayload = ({
  entity = "customer",
  action,
  entityId = null,
  customerId = null,
  ...rest
}) => ({
  entity,
  action,
  entityId,
  customerId,
  ...rest,
  emittedAt: new Date().toISOString(),
  source: "admin-backend",
});

const publishCustomerChange = async (change) => {
  const payload = buildCustomerChangePayload(change);

  await db.query("SELECT pg_notify($1, $2)", [
    CUSTOMER_CHANGES_CHANNEL,
    JSON.stringify(payload),
  ]);

  console.log("[customer-events][admin] Published customer change:", payload);

  return payload;
};

const publishCustomerChangeSafely = async (change) => {
  try {
    await publishCustomerChange(change);
  } catch (error) {
    console.error("Failed to publish customer change event:", error);
  }
};

module.exports = {
  CUSTOMER_CHANGES_CHANNEL,
  publishCustomerChange,
  publishCustomerChangeSafely,
};
