const notificationModel = require("./notificationModel");
const { publishNotificationChangeSafely } = require("../realtime/notificationEvents");

const normalizePageNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const getNotificationList = async (req, res) => {
  try {
    const page = normalizePageNumber(req.body.page, 1);
    const limit = normalizePageNumber(req.body.limit, 10);
    const isRead =
      req.body.is_read === "" || req.body.is_read === undefined || req.body.is_read === null
        ? null
        : Number(req.body.is_read) === 1
          ? 1
          : 0;
    const entity = req.body.entity ? String(req.body.entity).trim() : "";
    const notificationType = req.body.notification_type
      ? String(req.body.notification_type).trim()
      : "";
    const search = req.body.search ? String(req.body.search).trim() : "";

    const rows = await notificationModel.getNotificationList({
      page,
      limit,
      isRead,
      entity,
      notificationType,
      search,
    });

    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...notification }) => notification);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Notification list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notification list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const notification = await notificationModel.getNotificationById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error fetching notification by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const notification = await notificationModel.markNotificationAsRead(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await publishNotificationChangeSafely({
      entity: "notification",
      action: "updated",
      entityId: notification.id,
      notificationId: notification.id,
      entityData: notification,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const markAllNotificationsAsRead = async (_req, res) => {
  try {
    await notificationModel.markAllNotificationsAsRead();

    await publishNotificationChangeSafely({
      entity: "notification",
      action: "updated",
      entityId: null,
      notificationId: null,
      entityData: {
        scope: "all",
        is_read: 1,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read successfully",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const existingNotification = await notificationModel.getNotificationById(id);

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notificationModel.deleteNotification(id);

    await publishNotificationChangeSafely({
      entity: "notification",
      action: "deleted",
      entityId: existingNotification.id,
      notificationId: existingNotification.id,
      entityData: existingNotification,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getUnreadSummary = async (req, res) => {
  try {
    const limit = normalizePageNumber(req.body.limit, 10);
    const summary = await notificationModel.getUnreadSummary(limit);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching unread notification summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getNotificationList,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadSummary,
};
