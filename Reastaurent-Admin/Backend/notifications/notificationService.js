const notificationModel = require("./notificationModel");
const { publishNotificationChangeSafely } = require("../realtime/notificationEvents");

const buildOrderNotificationContent = (change) => {
  const orderNumber =
    change?.entityData?.order_number || `#${change?.orderId || change?.entityId || ""}`;
  const customerName = change?.entityData?.customer_name || "Customer";
  const orderStatus = change?.entityData?.order_status || "placed";

  switch (change?.action) {
    case "created":
      return {
        notificationType: "order_alert",
        title: `New order ${orderNumber}`,
        message: `${customerName} placed a new order with status ${orderStatus}.`,
        redirectPath: "/orders",
      };
    case "updated":
      return {
        notificationType: "order_alert",
        title: `Order ${orderNumber} updated`,
        message: `${customerName}'s order is now ${String(orderStatus).replace(/_/g, " ")}.`,
        redirectPath: "/orders",
      };
    case "deleted":
      return {
        notificationType: "order_alert",
        title: `Order ${orderNumber} deleted`,
        message: `${customerName}'s order entry was deleted.`,
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

  if (notification) {
    await publishNotificationChangeSafely({
      entity: "notification",
      action: "created",
      entityId: notification.id,
      notificationId: notification.id,
      entityData: notification,
    });
  }

  return notification;
};

module.exports = {
  createNotificationFromChange,
};
