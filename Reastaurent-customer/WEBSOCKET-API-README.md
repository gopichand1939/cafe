# Customer WebSocket API

This file explains how realtime WebSocket updates are implemented in `Reastaurent-customer`.

## Base URL

- Local WebSocket URL: `ws://localhost:15020/ws`
- Deployed WebSocket URL: `wss://cafe-customer-backend.onrender.com/ws`

Frontend config comes from:

- `Frontend/.env`
- `Frontend/src/config/api.js`

## Stack Used

This project is **not using Socket.IO**.

It uses:

- browser `WebSocket` on frontend
- Node.js `ws` package on backend
- PostgreSQL `LISTEN / NOTIFY` for backend event delivery

## High-Level Flow

```text
DB/backend change
-> PostgreSQL NOTIFY event
-> customer backend LISTEN subscriber receives it
-> backend WebSocket gateway broadcasts it
-> frontend hook receives message
-> React state is updated
-> UI refreshes without manual reload
```

## Backend Implementation

### 1. WebSocket server

File:

- `Backend/realtime/menuUpdatesGateway.js`

The backend creates a WebSocket server on:

```text
/ws
```

Message types used:

- `menu.connected`
- `menu.updated`
- `order.updated`
- `notification.updated`

## 2. Authentication on WebSocket

For customer-specific realtime events, the frontend connects like this:

```text
ws://localhost:15020/ws?token=<access_token>
```

The backend reads `token` from the query string and validates it with:

- `verifyAccessToken(...)`
- current DB session check

That logic is in:

- `Backend/realtime/menuUpdatesGateway.js`

If token/session is valid:

- socket gets `customerId`
- order and notification events are filtered for that customer only

If token is missing:

- socket still connects as guest
- guest can receive public menu updates

## 3. PostgreSQL realtime subscribers

Files:

- `Backend/realtime/menuChangeSubscriber.js`
- `Backend/realtime/orderChangeSubscriber.js`
- `Backend/realtime/notificationChangeSubscriber.js`

These open dedicated `pg` clients and run:

- `LISTEN menu_changes`
- `LISTEN order_changes`
- `LISTEN customer_notification_changes`

They also:

- reconnect automatically on disconnect
- parse JSON payloads
- forward parsed changes to the WebSocket gateway

## 4. Event publishers

Files:

- `Backend/realtime/menuEvents.js`
- `Backend/realtime/orderEvents.js`
- `Backend/realtime/notificationEvents.js`
- `Backend/realtime/paymentEvents.js`

These publish events through PostgreSQL:

```sql
SELECT pg_notify($1, $2)
```

Examples:

- order create/update -> `order_changes`
- notification create/update -> `customer_notification_changes`

## 5. Server bootstrap

File:

- `Backend/server.js`

When backend starts, it:

1. creates HTTP server
2. mounts WebSocket gateway
3. starts menu subscriber
4. starts order subscriber
5. starts notification subscriber

So `/ws` and API routes run on the same backend server.

## Frontend Implementation

### 1. Public menu updates

File:

- `Frontend/src/realtime/useMenuUpdates.js`

This hook:

- opens WebSocket connection to `MENU_UPDATES_WS_URL`
- listens for `menu.updated`
- reconnects automatically
- debounces rapid menu messages

This is for public menu/category/addon changes.

### 2. Authenticated customer updates

File:

- `Frontend/src/realtime/useCustomerRealtimeUpdates.js`

This hook:

- reads `accessToken` from storage
- appends it to WebSocket URL as `?token=...`
- listens for:
  - `order.updated`
  - `notification.updated`

This is only active for logged-in customers.

## Frontend State Updates

File:

- `Frontend/src/realtime/applyMenuChange.js`

Incoming menu events do not force a full page reload.

Instead, the app patches local state directly:

- category added/updated/deleted
- item added/updated/deleted
- addon added/updated/deleted

That is why realtime feels instant.

## Message Shapes

### Connected message

```json
{
  "type": "menu.connected",
  "payload": {
    "connectedAt": "2026-04-24T01:00:00.000Z",
    "customerId": 4
  }
}
```

### Menu update message

```json
{
  "type": "menu.updated",
  "payload": {
    "entity": "item",
    "action": "updated",
    "entityId": 18,
    "entityData": {
      "id": 18,
      "item_name": "Veg Burger"
    },
    "broadcastAt": "2026-04-24T01:00:00.000Z"
  }
}
```

### Order update message

```json
{
  "type": "order.updated",
  "payload": {
    "entity": "order",
    "action": "created",
    "orderId": 45,
    "customerId": 4,
    "broadcastAt": "2026-04-24T01:00:00.000Z"
  }
}
```

### Notification update message

```json
{
  "type": "notification.updated",
  "payload": {
    "entity": "notification",
    "action": "created",
    "notificationId": 120,
    "customerId": 4,
    "broadcastAt": "2026-04-24T01:00:00.000Z"
  }
}
```

## Environment Variables

### Backend

File:

- `Backend/.env`

Important values:

```env
PORT=15020
DATABASE_URL=...
REALTIME_DATABASE_URL=...
```

Use a direct DB connection for `REALTIME_DATABASE_URL` when possible, because `LISTEN / NOTIFY` may not work reliably through poolers.

### Frontend

File:

- `Frontend/.env`

Example:

```env
VITE_API_BASE_URL=https://cafe-customer-backend.onrender.com/api
VITE_MENU_UPDATES_WS_URL=wss://cafe-customer-backend.onrender.com/ws
```

Local example:

```env
VITE_API_BASE_URL=http://localhost:15020/api
VITE_MENU_UPDATES_WS_URL=ws://localhost:15020/ws
```

## What Is Realtime Right Now

Working realtime flows:

- menu/category/item/addon updates
- customer order updates
- customer notification updates

## Important Note

There is no separate REST API for WebSocket.

The realtime endpoint is:

```text
GET ws://host/ws
```

or for authenticated customer updates:

```text
GET ws://host/ws?token=<access_token>
```

The backend then pushes messages to the client.

## Quick Summary

- WebSocket endpoint: `/ws`
- Public menu updates work without token
- Customer order/notification updates use `?token=<access_token>`
- Backend uses PostgreSQL `LISTEN / NOTIFY`
- Frontend listens with plain browser `WebSocket`
- No Socket.IO is used
