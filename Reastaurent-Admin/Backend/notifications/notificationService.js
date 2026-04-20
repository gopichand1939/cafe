const notificationModel = require("./notificationModel");
const { publishNotificationChangeSafely } = require("../realtime/notificationEvents");
const {
  sendAdminNotificationMailSafely,
  sendCustomerNotificationMailSafely,
} = require("../pushmail/mailService");

const humanize = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const buildOrderNotificationContent = (change) => {
  const orderNumber =
    change?.entityData?.order_number || `#${change?.orderId || change?.entityId || ""}`;
  const customerName = change?.entityData?.customer_name || "Customer";
  const orderStatus = change?.entityData?.order_status || "placed";
  const statusLabel = humanize(orderStatus);

  switch (change?.action) {
    case "created":
      return {
        notificationType: "order_alert",
        title: `New order placed: ${orderNumber}`,
        message: `${customerName} placed a new order. Current status: ${statusLabel}.`,
        redirectPath: "/orders",
      };
    case "updated":
      return {
        notificationType: "order_alert",
        title: `Order ${orderNumber} ${String(orderStatus || "").replace(/_/g, " ")}`,
        message: `${customerName}'s order status changed to ${statusLabel}.`,
        redirectPath: "/orders",
      };
    case "deleted":
      return {
        notificationType: "order_alert",
        title: `Order ${orderNumber} deleted`,
        message: `${customerName}'s order record was deleted.`,
        redirectPath: "/orders",
      };
    default:
      return {
        notificationType: "order_alert",
        title: `Order ${orderNumber} activity`,
        message: `${customerName}'s order had a new activity.`,
        redirectPath: "/orders",
      };
  }
};

const buildCustomerNotificationContent = (change) => {
  const customerName = change?.entityData?.name || `Customer #${change?.customerId || change?.entityId || ""}`;

  switch (change?.action) {
    case "created":
      return {
        notificationType: "customer_alert",
        title: `New customer ${customerName}`,
        message: `${customerName} was added to the system.`,
        redirectPath: "/customers",
      };
    case "updated":
      return {
        notificationType: "customer_alert",
        title: `Customer ${customerName} updated`,
        message: `${customerName}'s details were updated.`,
        redirectPath: "/customers",
      };
    case "deleted":
      return {
        notificationType: "customer_alert",
        title: `Customer ${customerName} deleted`,
        message: `${customerName}'s record was deleted.`,
        redirectPath: "/customers",
      };
    default:
      return {
        notificationType: "customer_alert",
        title: `Customer ${customerName} activity`,
        message: `${customerName} has a new activity.`,
        redirectPath: "/customers",
      };
  }
};

const buildPaymentNotificationContent = (change) => {
  const orderNumber =
    change?.entityData?.order_number ||
    change?.payload?.entityData?.order_number ||
    `#${change?.orderId || change?.entityId || ""}`;
  const customerName =
    change?.entityData?.customer_name ||
    change?.payload?.entityData?.customer_name ||
    "Customer";
  const gateway = humanize(change?.entityData?.gateway || "stripe");
  const paymentStatus = String(
    change?.entityData?.status || change?.payload?.entityData?.status || change?.action || "updated"
  );
  const paymentStatusLabel = humanize(paymentStatus);

  switch (change?.action) {
    case "created":
      return {
        notificationType: "payment_alert",
        title: `Payment initiated for ${orderNumber}`,
        message: `${customerName} started a ${gateway} payment. Current status: ${paymentStatusLabel}.`,
        redirectPath: "/payments",
      };
    case "succeeded":
      return {
        notificationType: "payment_alert",
        title: `Payment successful for ${orderNumber}`,
        message: `${customerName}'s ${gateway} payment was completed successfully.`,
        redirectPath: "/payments",
      };
    case "failed":
      return {
        notificationType: "payment_alert",
        title: `Payment failed for ${orderNumber}`,
        message: `${customerName}'s ${gateway} payment failed. Status: ${paymentStatusLabel}.`,
        redirectPath: "/payments",
      };
    default:
      return {
        notificationType: "payment_alert",
        title: `Payment update for ${orderNumber}`,
        message: `${customerName}'s ${gateway} payment changed to ${paymentStatusLabel}.`,
        redirectPath: "/payments",
      };
  }
};

const resolveTargetAdmin = ({ payload }) => ({
  id: 1,
  email: payload?.adminEmail || process.env.DEFAULT_ADMIN_EMAIL || "",
  name: "Admin",
});

const shouldSendAdminMailForSource = (payload = {}) =>
  String(payload.source || "").toLowerCase() !== "admin-backend";

const shouldSendCustomerMailForSource = (payload = {}) =>
  String(payload.source || "").toLowerCase() === "admin-backend";

const createNotificationFromChange = async ({
  entity,
  action,
  entityId = null,
  source = "",
  payload = {},
}) => {
  let content = null;

  if (entity === "order") {
    content = buildOrderNotificationContent(payload);
  } else if (entity === "customer") {
    content = buildCustomerNotificationContent(payload);
  } else if (entity === "payment") {
    content = buildPaymentNotificationContent(payload);
  }

  if (!content) {
    return null;
  }

  const notification = await notificationModel.createNotification({
    notificationType: content.notificationType,
    entity,
    action,
    entityId,
    title: content.title,
    message: content.message,
    redirectPath: content.redirectPath,
    source,
    payload,
  });

  if (notification && notification.wasExisting !== true) {
    await publishNotificationChangeSafely({
      entity: "notification",
      action: "created",
      entityId: notification.id,
      notificationId: notification.id,
      entityData: notification,
    });

    const targetAdmin = resolveTargetAdmin({ payload });

    if (shouldSendAdminMailForSource(payload)) {
      await sendAdminNotificationMailSafely({
        notification,
        admin: targetAdmin,
      });
    }

    if (shouldSendCustomerMailForSource(payload)) {
      await sendCustomerNotificationMailSafely({
        notification,
        admin: targetAdmin,
      });
    }
  }

  return notification;
};

module.exports = {
  createNotificationFromChange,
};
