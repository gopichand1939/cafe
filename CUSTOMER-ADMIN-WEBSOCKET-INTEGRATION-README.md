# Customer Portal and Admin Panel WebSocket Integration

This file explains how realtime updates move between the admin panel and the customer portal in this project.

## Short answer

The customer portal and admin panel are **not directly connected to each other with one shared WebSocket**.

Instead, this project uses this bridge:

`Frontend -> Backend -> PostgreSQL LISTEN/NOTIFY -> Backend subscriber -> WebSocket -> Frontend`

So the real integration is:

1. one or both backends publish a database event
2. subscriber services listen to that event
3. each backend pushes the update to its own frontend through `/ws`

## Main idea

There are **two separate WebSocket gateways**:

- customer backend gateway: `Reastaurent-customer/Backend/realtime/menuUpdatesGateway.js`
- admin backend gateway: `Reastaurent-Admin/Backend/realtime/adminUpdatesGateway.js`

There are also **two separate frontend socket listeners**:

- customer portal listeners:
  `Reastaurent-customer/Frontend/src/realtime/useMenuUpdates.js`
  `Reastaurent-customer/Frontend/src/realtime/useCustomerRealtimeUpdates.js`
- admin panel listener:
  `Reastaurent-Admin/Frontend/src/realtime/useAdminRealtimeUpdates.js`

So:

- admin frontend talks to admin backend
- customer frontend talks to customer backend
- PostgreSQL notifications connect the whole realtime system together

## Flow 1: Admin menu change -> Customer portal updates live

This is the path used when admin creates, edits, disables, or deletes categories, items, or addons.

### Step 1: Admin backend changes menu data

When admin updates menu data, controllers publish a menu change event:

- `Reastaurent-Admin/Backend/category/CategoryController.js`
- `Reastaurent-Admin/Backend/items/ItemController.js`
- `Reastaurent-Admin/Backend/addons/AddonController.js`

They call:

- `Reastaurent-Admin/Backend/realtime/menuEvents.js`

That file sends:

- PostgreSQL channel: `menu_changes`

using `pg_notify(...)`.

### Step 2: Customer backend listens for that DB event

The customer backend starts a subscriber in:

- `Reastaurent-customer/Backend/server.js`

using:

- `Reastaurent-customer/Backend/realtime/menuChangeSubscriber.js`

That subscriber does four things:

1. `LISTEN menu_changes`
2. parse the payload
3. clear menu cache with `resetMenuCache()`
4. forward the change to the customer WebSocket gateway

## Step 3: Customer backend broadcasts to browser clients

The customer WebSocket server is in:

- `Reastaurent-customer/Backend/realtime/menuUpdatesGateway.js`

It broadcasts:

- `menu.updated`

on socket path:

- `/ws`

## Step 4: Customer frontend receives and patches UI

The public menu listener is:

- `Reastaurent-customer/Frontend/src/realtime/useMenuUpdates.js`

The menu state patching logic is:

- `Reastaurent-customer/Frontend/src/realtime/applyMenuChange.js`

The main screen using it is:

- `Reastaurent-customer/Frontend/src/Pages/Home/Home.jsx`

So the final live path is:

`Admin panel action -> admin backend -> pg_notify(menu_changes) -> customer backend LISTEN -> customer /ws -> customer browser updates menu`

## Flow 2: Customer order/payment activity -> Admin panel updates live

This is the path used when a customer places an order or payment state changes.

### Step 1: Customer backend publishes order/payment changes

Customer-side publishers include:

- `Reastaurent-customer/Backend/orders/orderController.js`
- `Reastaurent-customer/Backend/payments/paymentService.js`
- `Reastaurent-customer/Backend/realtime/orderEvents.js`
- `Reastaurent-customer/Backend/realtime/paymentEvents.js`

Important DB channels include:

- `order_changes`
- `payment_changes`

### Step 2: Admin backend listens to those channels

The admin backend starts subscribers in:

- `Reastaurent-Admin/Backend/server.js`

Important subscriber files:

- `Reastaurent-Admin/Backend/realtime/orderChangeSubscriber.js`
- `Reastaurent-Admin/Backend/realtime/paymentChangeSubscriber.js`
- `Reastaurent-Admin/Backend/realtime/customerChangeSubscriber.js`
- `Reastaurent-Admin/Backend/realtime/notificationChangeSubscriber.js`

For order and customer changes, admin backend also creates admin notifications from those events.

### Step 3: Admin backend broadcasts to admin WebSocket clients

The admin WebSocket server is:

- `Reastaurent-Admin/Backend/realtime/adminUpdatesGateway.js`

It sends event types such as:

- `order.updated`
- `payment.updated`
- `customer.updated`
- `notification.updated`

on:

- `/ws`

### Step 4: Admin frontend reacts to those events

The admin browser hook is:

- `Reastaurent-Admin/Frontend/src/realtime/useAdminRealtimeUpdates.js`

The shell that reacts to new notifications is:

- `Reastaurent-Admin/Frontend/src/components/common/AppShell.jsx`

So the live path is:

`Customer action -> customer backend -> pg_notify(order/payment change) -> admin backend LISTEN -> admin /ws -> admin panel refreshes notifications/orders/payments`

## Flow 3: Customer-specific updates back to logged-in customer

The customer backend also uses the same `/ws` gateway for authenticated customer events.

### Customer socket auth

Customer socket auth is handled in:

- `Reastaurent-customer/Backend/realtime/menuUpdatesGateway.js`

If `?token=...` is present and valid:

- socket gets `customerId`

Then the backend can send only matching updates for:

- `order.updated`
- `notification.updated`

The customer frontend hook is:

- `Reastaurent-customer/Frontend/src/realtime/useCustomerRealtimeUpdates.js`

This is used in:

- `Reastaurent-customer/Frontend/src/Pages/Home/Home.jsx`

So a logged-in customer gets only their own order and notification updates.

## Authentication model

### Customer portal

- public menu socket can connect without token
- logged-in customer socket adds `?token=<access_token>`
- backend resolves `customerId` from token when valid

### Admin panel

- admin socket requires `?token=<access_token>`
- invalid admin token closes socket with code `1008`
- frontend retries and refreshes token when needed

## Important point

There is **no direct browser-to-browser socket** between:

- customer portal
- admin panel

They communicate indirectly through:

1. PostgreSQL realtime events
2. backend subscribers
3. separate backend WebSocket gateways

That is why the architecture stays clean:

- admin backend owns admin events
- customer backend owns customer-facing menu and customer socket delivery
- database notifications connect both systems

## Architecture summary

### Admin to customer menu sync

`Admin Frontend -> Admin Backend -> menu_changes -> Customer Backend -> Customer WebSocket -> Customer Frontend`

### Customer to admin order sync

`Customer Frontend -> Customer Backend -> order_changes/payment_changes -> Admin Backend -> Admin WebSocket -> Admin Frontend`

### Customer personal realtime updates

`Customer Backend -> Customer WebSocket -> Logged-in Customer Browser`

## WebSocket endpoints in code

Both gateways use:

- `/ws`

Configured from frontend constants:

- admin: `Reastaurent-Admin/Frontend/src/Utils/Constant.jsx`
- customer: `Reastaurent-customer/Frontend/src/config/api.js`
- customer re-export: `Reastaurent-customer/Frontend/src/Utils/Constant.jsx`

## Final conclusion

If someone asks, "How is WebSocket integrated from customer portal to admin panel?"

The correct explanation for this repo is:

- not one shared socket between both UIs
- each backend has its own WebSocket server
- PostgreSQL `LISTEN / NOTIFY` is the bridge between systems
- admin menu changes reach the customer portal through the customer backend socket
- customer order/payment changes reach the admin panel through the admin backend socket
