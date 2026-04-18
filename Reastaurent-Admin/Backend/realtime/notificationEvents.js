const db = require("../config/db");

const NOTIFICATION_CHANGES_CHANNEL = "notification_changes";

const buildNotificationChangePayload = ({
  entity = "notification",
  action,
  entityId = null,
  notificationId = null,
  ...rest
}) => ({
  entity,
  action,
  entityId,
  notificationId,
  ...rest,
  emittedAt: new Date().toISOString(),
  source: "admin-backend",
});

const publishNotificationChange = async (change) => {
  const payload = buildNotificationChangePayload(change);

  await db.query("SELECT pg_notify($1, $2)", [
    NOTIFICATION_CHANGES_CHANNEL,
    JSON.stringify(payload),
  ]);

  console.log("[notification-events][admin] Published notification change:", payload);

  return payload;
};

const publishNotificationChangeSafely = async (change) => {
  try {
    await publishNotificationChange(change);
  } catch (error) {
    console.error("Failed to publish notification change event:", error);
  }
};

module.exports = {
  NOTIFICATION_CHANGES_CHANNEL,
  publishNotificationChange,
  publishNotificationChangeSafely,
};
