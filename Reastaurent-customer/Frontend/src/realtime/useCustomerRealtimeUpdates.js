import { useEffect, useEffectEvent } from "react";
import { MENU_UPDATES_WS_URL } from "../Utils/Constant";
import { customerAuthStorage } from "../auth/customerAuthStorage";

const RECONNECT_DELAY_MS = 2000;

const buildAuthenticatedWebSocketUrl = (baseUrl, accessToken) => {
  if (!baseUrl || !accessToken) {
    return "";
  }

  try {
    const nextUrl = new URL(
      baseUrl,
      typeof window === "undefined" ? "http://localhost" : window.location.origin
    );

    nextUrl.searchParams.set("token", accessToken);

    if (/^https?:/i.test(nextUrl.protocol)) {
      nextUrl.protocol = nextUrl.protocol.replace(/^http/i, "ws");
    }

    return nextUrl.toString();
  } catch (_error) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}token=${encodeURIComponent(accessToken)}`;
  }
};

export const useCustomerRealtimeUpdates = ({
  customer,
  onOrderUpdate,
  onNotificationUpdate,
}) => {
  const handleOrderUpdate = useEffectEvent(onOrderUpdate || (() => {}));
  const handleNotificationUpdate = useEffectEvent(
    onNotificationUpdate || (() => {})
  );

  useEffect(() => {
    const accessToken = customerAuthStorage.getAccessToken();
    const socketUrl = buildAuthenticatedWebSocketUrl(MENU_UPDATES_WS_URL, accessToken);

    if (!customer?.id || !accessToken || !socketUrl) {
      return undefined;
    }

    let socket = null;
    let reconnectTimer = null;
    let isDisposed = false;

    const scheduleReconnect = () => {
      if (isDisposed || reconnectTimer) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const connect = () => {
      socket = new WebSocket(socketUrl);

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "order.updated") {
            handleOrderUpdate(message.payload);
          }

          if (message.type === "notification.updated") {
            handleNotificationUpdate(message.payload);
          }
        } catch (error) {
          console.error("Failed to parse customer realtime message:", error);
        }
      });

      socket.addEventListener("error", () => {
        socket?.close();
      });

      socket.addEventListener("close", () => {
        if (!isDisposed) {
          scheduleReconnect();
        }
      });
    };

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socket) {
        socket.close();
      }
    };
  }, [customer?.id]);
};
