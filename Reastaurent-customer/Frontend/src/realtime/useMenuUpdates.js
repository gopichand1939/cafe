import { useEffect, useEffectEvent } from "react";
import { MENU_UPDATES_WS_URL } from "../config/api";

const RECONNECT_DELAY_MS = 2000;
const REFRESH_DEBOUNCE_MS = 250;

export const useMenuUpdates = (onMenuUpdate) => {
  const handleMenuUpdate = useEffectEvent(onMenuUpdate);

  useEffect(() => {
    if (!MENU_UPDATES_WS_URL) {
      console.warn("[menu-events][customer-frontend] MENU_UPDATES_WS_URL is empty");
      return undefined;
    }

    console.log(
      "[menu-events][customer-frontend] Initializing WebSocket listener:",
      MENU_UPDATES_WS_URL
    );

    let socket = null;
    let reconnectTimer = null;
    let refreshTimer = null;
    let isDisposed = false;

    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (isDisposed || reconnectTimer) {
        return;
      }

      console.warn(
        `[menu-events][customer-frontend] WebSocket disconnected. Retrying in ${RECONNECT_DELAY_MS}ms`
      );

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log("[menu-events][customer-frontend] WebSocket message:", message);

        if (message.type !== "menu.updated") {
          return;
        }

        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(() => {
          refreshTimer = null;
          handleMenuUpdate(message.payload);
        }, REFRESH_DEBOUNCE_MS);
      } catch (error) {
        console.error("Failed to parse menu update message:", error);
      }
    };

    const connect = () => {
      console.log(
        "[menu-events][customer-frontend] Opening WebSocket connection:",
        MENU_UPDATES_WS_URL
      );
      socket = new WebSocket(MENU_UPDATES_WS_URL);
      socket.addEventListener("open", () => {
        console.log("[menu-events][customer-frontend] WebSocket connected");
      });
      socket.addEventListener("message", handleMessage);
      socket.addEventListener("error", (error) => {
        console.error("[menu-events][customer-frontend] WebSocket error:", error);
        socket?.close();
      });
      socket.addEventListener("close", (event) => {
        console.warn(
          `[menu-events][customer-frontend] WebSocket closed. code=${event.code} reason=${event.reason || "n/a"}`
        );
        if (!isDisposed) {
          scheduleReconnect();
        }
      });
    };

    connect();

    return () => {
      isDisposed = true;
      clearTimers();

      if (socket) {
        console.log("[menu-events][customer-frontend] Cleaning up WebSocket connection");
        socket.close();
      }
    };
  }, []);
};
