const messageModel = require("./messageModel");
const { sendTestAdminMailSafely } = require("../pushmail/mailService");

const normalizeFlag = (value, fallback = 0) => (Number(value) === 1 ? 1 : fallback);

const getMessageSettings = async (req, res) => {
  try {
    const settings = await messageModel.getByAdminId(req.admin);

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching message settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateMessageSettings = async (req, res) => {
  try {
    const {
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
      notify_customer_mail_order_deleted,
    } = req.body;

    if (!admin_email || !sender_name) {
      return res.status(400).json({
        success: false,
        message: "admin_email and sender_name are required",
      });
    }

    const settings = await messageModel.upsertByAdminId({
      adminId: req.admin.id,
      adminEmail: String(admin_email).trim().toLowerCase(),
      senderName: String(sender_name).trim(),
      senderEmail: String(sender_email || "").trim().toLowerCase(),
      smtpHost: String(smtp_host || "").trim(),
      smtpPort: Number(smtp_port) || 587,
      smtpSecure: normalizeFlag(smtp_secure, 0),
      smtpUser: String(smtp_user || "").trim(),
      smtpPass: String(smtp_pass || ""),
      mailEnabled: normalizeFlag(mail_enabled, 0),
      notifyCustomerCreated: normalizeFlag(notify_customer_created, 1),
      notifyCustomerUpdated: normalizeFlag(notify_customer_updated, 1),
      notifyCustomerDeleted: normalizeFlag(notify_customer_deleted, 1),
      notifyOrderCreated: normalizeFlag(notify_order_created, 1),
      notifyOrderUpdated: normalizeFlag(notify_order_updated, 1),
      notifyOrderDeleted: normalizeFlag(notify_order_deleted, 1),
      notifyCustomerMailCustomerCreated: normalizeFlag(
        notify_customer_mail_customer_created,
        1
      ),
      notifyCustomerMailCustomerUpdated: normalizeFlag(
        notify_customer_mail_customer_updated,
        1
      ),
      notifyCustomerMailCustomerDeleted: normalizeFlag(
        notify_customer_mail_customer_deleted,
        1
      ),
      notifyCustomerMailOrderCreated: normalizeFlag(
        notify_customer_mail_order_created,
        1
      ),
      notifyCustomerMailOrderUpdated: normalizeFlag(
        notify_customer_mail_order_updated,
        1
      ),
      notifyCustomerMailOrderDeleted: normalizeFlag(
        notify_customer_mail_order_deleted,
        1
      ),
    });

    return res.status(200).json({
      success: true,
      message: "Message settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating message settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const sendTestMessage = async (req, res) => {
  try {
    const settings = await messageModel.getByAdminId(req.admin);
    const delivered = await sendTestAdminMailSafely({
      settings,
      admin: req.admin,
    });

    if (!delivered) {
      return res.status(400).json({
        success: false,
        message: "Test mail could not be sent. Check mail settings first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test mail sent successfully",
    });
  } catch (error) {
    console.error("Error sending test mail:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getMessageSettings,
  updateMessageSettings,
  sendTestMessage,
};
