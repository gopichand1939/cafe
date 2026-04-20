const { Client } = require("pg");
const { PAYMENT_CHANGES_CHANNEL } = require("./paymentEvents");
const { createNotificationFromChange } = require("../notifications/notificationService");

const RECONNECT_DELAY_MS = 3000;

const getRealtimeDatabaseConfig = () => {
  const realtimeDatabaseUrl =
    process.env.REALTIME_DATABASE_URL || process.env.DATABASE_URL || "";

  if (realtimeDatabaseUrl) {
    return {
      connectionString: realtimeDatabaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "postgres",
  };
};

const parsePayload = (payload) => {
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    console.error("Failed to parse payment change payload:", error);
    return null;
  }
};

const startPaymentChangeSubscriber = ({ onPaymentChange } = {}) => {
  let subscriber = null;
  let reconnectTimer = null;
  let isStopped = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (isStopped || reconnectTimer) {
      return;
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_DELAY_MS);
  };

  const handleNotification = async ({ payload }) => {
    console.log("[payment-events][admin] Raw DB notification:", payload);
    const change = parsePayload(payload);

    if (!change) {
      console.warn("[payment-events][admin] Skipping invalid DB notification payload");
      return;
    }

    console.log("[payment-events][admin] Parsed payment change:", change);

    await createNotificationFromChange({
      entity: "payment",
      action: change.action,
      entityId: change.entityId || change.paymentId || null,
      source: change.source || "unknown",
      payload: change,
    });

    if (typeof onPaymentChange === "function") {
      await onPaymentChange(change);
    }
  };

  const connect = async () => {
    if (isStopped) {
      return;
    }

    clearReconnectTimer();
    console.log("[payment-events][admin] Connecting DB LISTEN subscriber...");

    const nextSubscriber = new Client(getRealtimeDatabaseConfig());

    nextSubscriber.on("notification", (notification) => {
      void handleNotification(notification);
    });
    nextSubscriber.on("error", (error) => {
      console.error("Payment change subscriber error:", error);
      if (subscriber === nextSubscriber) {
        subscriber = null;
      }
      scheduleReconnect();
    });
    nextSubscriber.on("end", () => {
      if (subscriber === nextSubscriber) {
        subscriber = null;
      }

      if (!isStopped) {
        console.warn("Payment change subscriber disconnected. Reconnecting...");
        scheduleReconnect();
      }
    });

    try {
      await nextSubscriber.connect();
      await nextSubscriber.query(`LISTEN ${PAYMENT_CHANGES_CHANNEL}`);
      subscriber = nextSubscriber;
      console.log(
        `[payment-events][admin] Listening for payment changes on channel "${PAYMENT_CHANGES_CHANNEL}"`
      );
    } catch (error) {
      console.error("Failed to start payment change subscriber:", error);
      try {
        await nextSubscriber.end();
      } catch (closeError) {
        console.error(
          "Failed to close payment change subscriber after startup error:",
          closeError
        );
      }
      scheduleReconnect();
    }
  };

  void connect();

  return {
    stop: async () => {
      isStopped = true;
      clearReconnectTimer();

      if (subscriber) {
        try {
          await subscriber.end();
        } catch (error) {
          console.error("Failed to stop payment change subscriber:", error);
        } finally {
          subscriber = null;
        }
      }
    },
  };
};

module.exports = {
  startPaymentChangeSubscriber,
};
