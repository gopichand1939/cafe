const messageModel = require("../messages/messageModel");
const { createMailTransport } = require("./mailTransport");
const {
  buildNotificationEmailTemplate,
  buildTestEmailTemplate,
  buildCustomerNotificationEmailTemplate,
} = require("./mailTemplates");

const MAIL_TOGGLE_MAP = {
  order: {
    created: "notify_order_created",
    updated: "notify_order_updated",
    deleted: "notify_order_deleted",
  },
  customer: {
    created: "notify_customer_created",
    updated: "notify_customer_updated",
    deleted: "notify_customer_deleted",
  },
};

const CUSTOMER_MAIL_TOGGLE_MAP = {
  order: {
    created: "notify_customer_mail_order_created",
    updated: "notify_customer_mail_order_updated",
    deleted: "notify_customer_mail_order_deleted",
  },
  customer: {
    created: "notify_customer_mail_customer_created",
    updated: "notify_customer_mail_customer_updated",
    deleted: "notify_customer_mail_customer_deleted",
  },
};

const shouldSendNotificationMail = (settings, notification) => {
  if (!settings || Number(settings.mail_enabled) !== 1) {
    return false;
  }

  const entityMap = MAIL_TOGGLE_MAP[notification?.entity];
  const toggleKey = entityMap?.[notification?.action];

  if (!toggleKey) {
    return false;
  }

  return Number(settings[toggleKey]) === 1;
};

const shouldSendCustomerNotificationMail = (settings, notification) => {
  if (!settings || Number(settings.mail_enabled) !== 1) {
    return false;
  }

  const entityMap = CUSTOMER_MAIL_TOGGLE_MAP[notification?.entity];
  const toggleKey = entityMap?.[notification?.action];

  if (!toggleKey) {
    return false;
  }

  return Number(settings[toggleKey]) === 1;
};

const sendMailWithSettings = async ({ settings, to, subject, html }) => {
  const transport = createMailTransport(settings);

  if (!transport || !to) {
    return false;
  }

  await transport.sendMail({
    from: settings.sender_email
      ? `"${settings.sender_name}" <${settings.sender_email}>`
      : `"${settings.sender_name}" <${settings.smtp_user}>`,
    to,
    subject,
    html,
  });

  return true;
};

const sendAdminNotificationMail = async ({ notification, admin }) => {
  const settings = await messageModel.getByAdminId(admin);

  if (!shouldSendNotificationMail(settings, notification)) {
    return false;
  }

  const template = buildNotificationEmailTemplate({
    title: notification.title,
    message: notification.message,
    source: notification.source,
    entity: notification.entity,
    action: notification.action,
    payload: notification.payload || {},
  });

  return sendMailWithSettings({
    settings,
    to: settings.admin_email,
    subject: template.subject,
    html: template.html,
  });
};

const resolveCustomerEmail = (notification) => {
  if (notification?.entity === "order") {
    return notification?.payload?.entityData?.customer_email || "";
  }

  if (notification?.entity === "customer") {
    return notification?.payload?.entityData?.email || "";
  }

  return "";
};

const sendCustomerNotificationMail = async ({ notification, admin }) => {
  const settings = await messageModel.getByAdminId(admin);

  if (!shouldSendCustomerNotificationMail(settings, notification)) {
    return false;
  }

  const customerEmail = resolveCustomerEmail(notification);

  if (!customerEmail) {
    return false;
  }

  const template = buildCustomerNotificationEmailTemplate({
    title: notification.title,
    message: notification.message,
    action: notification.action,
    entity: notification.entity,
    source: notification.source,
    payload: notification.payload || {},
  });

  return sendMailWithSettings({
    settings,
    to: customerEmail,
    subject: template.subject,
    html: template.html,
  });
};

const sendAdminNotificationMailSafely = async ({ notification, admin }) => {
  try {
    return await sendAdminNotificationMail({ notification, admin });
  } catch (error) {
    console.error("Failed to send admin notification mail:", error);
    return false;
  }
};

const sendCustomerNotificationMailSafely = async ({ notification, admin }) => {
  try {
    return await sendCustomerNotificationMail({ notification, admin });
  } catch (error) {
    console.error("Failed to send customer notification mail:", error);
    return false;
  }
};

const sendTestAdminMailSafely = async ({ settings, admin }) => {
  try {
    if (Number(settings.mail_enabled) !== 1) {
      return false;
    }

    const template = buildTestEmailTemplate({
      adminName: admin?.name,
    });

    return await sendMailWithSettings({
      settings,
      to: settings.admin_email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error("Failed to send test admin mail:", error);
    return false;
  }
};

module.exports = {
  sendAdminNotificationMail,
  sendAdminNotificationMailSafely,
  sendCustomerNotificationMail,
  sendCustomerNotificationMailSafely,
  sendTestAdminMailSafely,
};
