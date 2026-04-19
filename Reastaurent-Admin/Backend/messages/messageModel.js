const db = require("../config/db");

const normalizeMessageSettings = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    smtp_secure: Number(row.smtp_secure),
    mail_enabled: Number(row.mail_enabled),
    notify_customer_created: Number(row.notify_customer_created),
    notify_customer_updated: Number(row.notify_customer_updated),
    notify_customer_deleted: Number(row.notify_customer_deleted),
    notify_order_created: Number(row.notify_order_created),
    notify_order_updated: Number(row.notify_order_updated),
    notify_order_deleted: Number(row.notify_order_deleted),
    notify_customer_mail_customer_created: Number(
      row.notify_customer_mail_customer_created
    ),
    notify_customer_mail_customer_updated: Number(
      row.notify_customer_mail_customer_updated
    ),
    notify_customer_mail_customer_deleted: Number(
      row.notify_customer_mail_customer_deleted
    ),
    notify_customer_mail_order_created: Number(row.notify_customer_mail_order_created),
    notify_customer_mail_order_updated: Number(row.notify_customer_mail_order_updated),
    notify_customer_mail_order_deleted: Number(row.notify_customer_mail_order_deleted),
  };
};

const defaultSettings = (admin) => ({
  admin_id: admin?.id || null,
  admin_email: admin?.email || "",
  sender_name: "Bagel Master Cafe",
  sender_email: admin?.email || "",
  smtp_host: "",
  smtp_port: 587,
  smtp_secure: 0,
  smtp_user: "",
  smtp_pass: "",
  mail_enabled: 0,
  notify_customer_created: 1,
  notify_customer_updated: 1,
  notify_customer_deleted: 1,
  notify_order_created: 1,
  notify_order_updated: 1,
  notify_order_deleted: 1,
  notify_customer_mail_customer_created: 1,
  notify_customer_mail_customer_updated: 1,
  notify_customer_mail_customer_deleted: 1,
  notify_customer_mail_order_created: 1,
  notify_customer_mail_order_updated: 1,
  notify_customer_mail_order_deleted: 1,
  created_at: null,
  updated_at: null,
});

const messageModel = {
  getByAdminId: async (admin) => {
    const query = `
      SELECT *
      FROM message_settings
      WHERE admin_id = $1
      LIMIT 1;
    `;

    const result = await db.query(query, [admin.id]);
    const row = result.rows[0];
    return row ? normalizeMessageSettings(row) : defaultSettings(admin);
  },

  upsertByAdminId: async ({
    adminId,
    adminEmail,
    senderName,
    senderEmail,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    mailEnabled,
    notifyCustomerCreated,
    notifyCustomerUpdated,
    notifyCustomerDeleted,
    notifyOrderCreated,
    notifyOrderUpdated,
    notifyOrderDeleted,
    notifyCustomerMailCustomerCreated,
    notifyCustomerMailCustomerUpdated,
    notifyCustomerMailCustomerDeleted,
    notifyCustomerMailOrderCreated,
    notifyCustomerMailOrderUpdated,
    notifyCustomerMailOrderDeleted,
  }) => {
    const query = `
      INSERT INTO message_settings (
        admin_id,
        admin_email,
        sender_name,
        sender_email,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_pass,
        mail_enabled,
        notify_customer_created,
        notify_customer_updated,
        notify_customer_deleted,
        notify_order_created,
        notify_order_updated,
        notify_order_deleted,
        notify_customer_mail_customer_created,
        notify_customer_mail_customer_updated,
        notify_customer_mail_customer_deleted,
        notify_customer_mail_order_created,
        notify_customer_mail_order_updated,
        notify_customer_mail_order_deleted
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      ON CONFLICT (admin_id)
      DO UPDATE SET
        admin_email = EXCLUDED.admin_email,
        sender_name = EXCLUDED.sender_name,
        sender_email = EXCLUDED.sender_email,
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_secure = EXCLUDED.smtp_secure,
        smtp_user = EXCLUDED.smtp_user,
        smtp_pass = EXCLUDED.smtp_pass,
        mail_enabled = EXCLUDED.mail_enabled,
        notify_customer_created = EXCLUDED.notify_customer_created,
        notify_customer_updated = EXCLUDED.notify_customer_updated,
        notify_customer_deleted = EXCLUDED.notify_customer_deleted,
        notify_order_created = EXCLUDED.notify_order_created,
        notify_order_updated = EXCLUDED.notify_order_updated,
        notify_order_deleted = EXCLUDED.notify_order_deleted,
        notify_customer_mail_customer_created = EXCLUDED.notify_customer_mail_customer_created,
        notify_customer_mail_customer_updated = EXCLUDED.notify_customer_mail_customer_updated,
        notify_customer_mail_customer_deleted = EXCLUDED.notify_customer_mail_customer_deleted,
        notify_customer_mail_order_created = EXCLUDED.notify_customer_mail_order_created,
        notify_customer_mail_order_updated = EXCLUDED.notify_customer_mail_order_updated,
        notify_customer_mail_order_deleted = EXCLUDED.notify_customer_mail_order_deleted,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(query, [
      adminId,
      adminEmail,
      senderName,
      senderEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      mailEnabled,
      notifyCustomerCreated,
      notifyCustomerUpdated,
      notifyCustomerDeleted,
      notifyOrderCreated,
      notifyOrderUpdated,
      notifyOrderDeleted,
      notifyCustomerMailCustomerCreated,
      notifyCustomerMailCustomerUpdated,
      notifyCustomerMailCustomerDeleted,
      notifyCustomerMailOrderCreated,
      notifyCustomerMailOrderUpdated,
      notifyCustomerMailOrderDeleted,
    ]);

    return normalizeMessageSettings(result.rows[0] || null);
  },
};

module.exports = messageModel;
