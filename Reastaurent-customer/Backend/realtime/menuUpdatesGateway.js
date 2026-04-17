const { WebSocket, WebSocketServer } = require("ws");

const MENU_SOCKET_PATH = "/ws";
const MENU_SOCKET_MESSAGE_TYPES = {
  CONNECTED: "menu.connected",
  UPDATED: "menu.updated",
};

const createMenuUpdatesGateway = (server) => {
  const webSocketServer = new WebSocketServer({
    server,
    path: MENU_SOCKET_PATH,
  });

  webSocketServer.on("connection", (socket) => {
    console.log(
      `[menu-events][customer-backend] WebSocket client connected. Total clients: ${webSocketServer.clients.size}`
    );

    socket.send(
      JSON.stringify({
        type: MENU_SOCKET_MESSAGE_TYPES.CONNECTED,
        payload: {
          connectedAt: new Date().toISOString(),
        },
      })
    );

    socket.on("close", () => {
      console.log(
        `[menu-events][customer-backend] WebSocket client disconnected. Total clients: ${webSocketServer.clients.size}`
      );
    });
  });

  const broadcastMenuUpdate = (change) => {
    console.log(
      `[menu-events][customer-backend] Broadcasting menu update to ${webSocketServer.clients.size} client(s):`,
      change
    );

    const message = JSON.stringify({
      type: MENU_SOCKET_MESSAGE_TYPES.UPDATED,
      payload: {
        ...change,
        broadcastAt: new Date().toISOString(),
      },
    });

    for (const client of webSocketServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  return {
    broadcastMenuUpdate,
    getClientCount: () => webSocketServer.clients.size,
  };
};

module.exports = {
  MENU_SOCKET_PATH,
  MENU_SOCKET_MESSAGE_TYPES,
  createMenuUpdatesGateway,
};
