const { Client } = require("pg");
const { CUSTOMER_CHANGES_CHANNEL } = require("./customerEvents");
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
    console.error("Failed to parse customer change payload:", error);
    return null;
  }
};

const startCustomerChangeSubscriber = () => {
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
    console.log("[customer-events][admin] Raw DB notification:", payload);
    const change = parsePayload(payload);

    if (!change) {
      console.warn("[customer-events][admin] Skipping invalid DB notification payload");
      return;
    }

    console.log("[customer-events][admin] Parsed customer change:", change);

    await createNotificationFromChange({
      entity: "customer",
      action: change.action,
      entityId: change.entityId || change.customerId || null,
      source: change.source || "unknown",
      payload: change,
    });
  };

  const connect = async () => {
    if (isStopped) {
      return;
    }

    clearReconnectTimer();
    console.log("[customer-events][admin] Connecting DB LISTEN subscriber...");

    const nextSubscriber = new Client(getRealtimeDatabaseConfig());

    nextSubscriber.on("notification", (notification) => {
      void handleNotification(notification);
    });
    nextSubscriber.on("error", (error) => {
      console.error("Customer change subscriber error:", error);
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
        console.warn("Customer change subscriber disconnected. Reconnecting...");
        scheduleReconnect();
      }
    });

    try {
      await nextSubscriber.connect();
      await nextSubscriber.query(`LISTEN ${CUSTOMER_CHANGES_CHANNEL}`);
      subscriber = nextSubscriber;
      console.log(`[customer-events][admin] Listening for customer changes on channel "${CUSTOMER_CHANGES_CHANNEL}"`);
    } catch (error) {
      console.error("Failed to start customer change subscriber:", error);
      try {
        await nextSubscriber.end();
      } catch (closeError) {
        console.error("Failed to close customer change subscriber after startup error:", closeError);
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
          console.error("Failed to stop customer change subscriber:", error);
        } finally {
          subscriber = null;
        }
      }
    },
  };
};

module.exports = {
  startCustomerChangeSubscriber,
};
