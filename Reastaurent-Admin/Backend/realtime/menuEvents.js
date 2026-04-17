const db = require("../config/db");

const MENU_CHANGES_CHANNEL = "menu_changes";

const buildMenuChangePayload = ({
  entity,
  action,
  entityId = null,
  categoryId = null,
  itemId = null,
  ...rest
}) => ({
  entity,
  action,
  entityId,
  categoryId,
  itemId,
  ...rest,
  emittedAt: new Date().toISOString(),
  source: "admin-backend",
});

const publishMenuChange = async (change) => {
  const payload = buildMenuChangePayload(change);

  await db.query("SELECT pg_notify($1, $2)", [
    MENU_CHANGES_CHANNEL,
    JSON.stringify(payload),
  ]);

  console.log("[menu-events][admin] Published menu change:", payload);

  return payload;
};

const publishMenuChangeSafely = async (change) => {
  try {
    await publishMenuChange(change);
  } catch (error) {
    console.error("Failed to publish menu change event:", error);
  }
};

module.exports = {
  MENU_CHANGES_CHANNEL,
  publishMenuChange,
  publishMenuChangeSafely,
};
