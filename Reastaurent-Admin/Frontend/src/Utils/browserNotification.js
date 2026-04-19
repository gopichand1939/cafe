let permissionRequest = null;

export const isBrowserNotificationSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getBrowserNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return window.Notification.permission;
};

export const requestBrowserNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  if (window.Notification.permission !== "default") {
    return window.Notification.permission;
  }

  if (!permissionRequest) {
    permissionRequest = window.Notification.requestPermission().finally(() => {
      permissionRequest = null;
    });
  }

  return permissionRequest;
};

export const showBrowserNotification = ({
  title,
  body,
  tag,
  requireInteraction = false,
  onClick,
}) => {
  if (!isBrowserNotificationSupported()) {
    return null;
  }

  if (window.Notification.permission !== "granted") {
    return null;
  }

  const notification = new window.Notification(title || "New notification", {
    body: body || "",
    tag: tag || undefined,
    requireInteraction,
  });

  if (typeof onClick === "function") {
    notification.onclick = (event) => {
      event.preventDefault();
      onClick(notification);
    };
  }

  return notification;
};
