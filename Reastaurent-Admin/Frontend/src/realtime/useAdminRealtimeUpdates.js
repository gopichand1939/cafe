import { useEffect, useEffectEvent } from "react";
import { ADMIN_UPDATES_WS_URL } from "../Utils/Constant";
import { getAccessToken } from "../Utils/authStorage";
import {
  ADMIN_REALTIME_EVENT_TYPES,
  emitAdminRealtimeEvent,
} from "./adminRealtimeEvents";

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

export const useAdminRealtimeUpdates = ({
  onOrderUpdate,
  onCustomerUpdate,
  onNotificationUpdate,
}) => {
  const handleOrderUpdate = useEffectEvent(onOrderUpdate || (() => {}));
  const handleCustomerUpdate = useEffectEvent(onCustomerUpdate || (() => {}));
  const handleNotificationUpdate = useEffectEvent(
    onNotificationUpdate || (() => {})
  );

  useEffect(() => {
    const accessToken = getAccessToken();
    const socketUrl = buildAuthenticatedWebSocketUrl(ADMIN_UPDATES_WS_URL, accessToken);

    if (!accessToken || !socketUrl) {
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

          if (message.type === ADMIN_REALTIME_EVENT_TYPES.ORDER_UPDATED) {
            emitAdminRealtimeEvent(ADMIN_REALTIME_EVENT_TYPES.ORDER_UPDATED, message.payload);
            handleOrderUpdate(message.payload);
          }

          if (message.type === ADMIN_REALTIME_EVENT_TYPES.CUSTOMER_UPDATED) {
            emitAdminRealtimeEvent(
              ADMIN_REALTIME_EVENT_TYPES.CUSTOMER_UPDATED,
              message.payload
            );
            handleCustomerUpdate(message.payload);
          }

          if (message.type === ADMIN_REALTIME_EVENT_TYPES.NOTIFICATION_UPDATED) {
            emitAdminRealtimeEvent(
              ADMIN_REALTIME_EVENT_TYPES.NOTIFICATION_UPDATED,
              message.payload
            );
            handleNotificationUpdate(message.payload);
          }
        } catch (error) {
          console.error("Failed to parse admin realtime message:", error);
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
  }, []);
};
