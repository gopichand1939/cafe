const express = require("express");
const {
  getNotificationList,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadSummary,
} = require("./NotificationController");

const router = express.Router();

router.post("/notification_list", getNotificationList);
router.post("/get_notification_byId", getNotificationById);
router.post("/mark_notification_as_read", markNotificationAsRead);
router.post("/mark_all_notifications_as_read", markAllNotificationsAsRead);
router.post("/delete_notification", deleteNotification);
router.post("/unread_notification_summary", getUnreadSummary);

module.exports = router;
