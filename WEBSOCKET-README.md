# WebSocket Realtime Flow

This document explains the final working WebSocket implementation in this project.

This version is clean and optimized:

- admin changes menu data
- customer backend receives the change in realtime
- customer portal updates automatically
- only the changed part of UI is updated
- no full page refresh
- no extra API refetch for the realtime update itself

## What this covers

Realtime is implemented for:

- categories
- items
- addons
- image changes that happen during category/item updates

## Final high-level flow

```text
Admin action
  -> Admin backend saves data
  -> Admin backend publishes PostgreSQL NOTIFY event
  -> Customer backend LISTEN receives the event
  -> Customer backend clears server cache
  -> Customer backend broadcasts WebSocket message
  -> Customer frontend receives the event payload
  -> Customer frontend patches local state directly
  -> UI updates without extra refetch
```

## Important improvement from the first version

Earlier, the customer frontend was doing this:

```text
socket message -> call APIs again -> rerender UI
```

That worked, but it caused:

- extra database load
- repeated API calls
- unnecessary rerenders

Now the customer frontend does this:

```text
socket message -> update only changed state in memory -> rerender only affected UI
```

So the current implementation is more efficient and cleaner.

## Why this structure is clean

We kept responsibilities separated:

### Admin backend

- saves data
- publishes menu events

### Customer backend

- listens for database notifications
- clears backend cache
- broadcasts WebSocket messages

### Customer frontend

- opens one WebSocket connection
- receives typed events
- updates local state directly

This gives:

- clean separation
- reusable realtime pipeline
- no direct coupling between admin UI and customer UI
- easy future extension

## Files involved

### Admin backend

- `Reastaurent-Admin/Backend/realtime/menuEvents.js`
- `Reastaurent-Admin/Backend/category/CategoryController.js`
- `Reastaurent-Admin/Backend/items/ItemController.js`
- `Reastaurent-Admin/Backend/addons/AddonController.js`

### Customer backend

- `Reastaurent-customer/Backend/server.js`
- `Reastaurent-customer/Backend/realtime/menuEvents.js`
- `Reastaurent-customer/Backend/realtime/menuChangeSubscriber.js`
- `Reastaurent-customer/Backend/realtime/menuUpdatesGateway.js`
- `Reastaurent-customer/Backend/cache/menuCache.js`
- `Reastaurent-customer/Backend/AllGetControler.js`

### Customer frontend

- `Reastaurent-customer/Frontend/src/realtime/useMenuUpdates.js`
- `Reastaurent-customer/Frontend/src/realtime/applyMenuChange.js`
- `Reastaurent-customer/Frontend/src/services/menuApi.js`
- `Reastaurent-customer/Frontend/src/config/api.js`
- `Reastaurent-customer/Frontend/src/App.jsx`
- `Reastaurent-customer/Frontend/vite.config.js`

## Step 1: Admin backend publishes menu events

File:

- `Reastaurent-Admin/Backend/realtime/menuEvents.js`

The admin backend sends a PostgreSQL notification with:

```sql
SELECT pg_notify($1, $2)
```

Channel used:

```text
menu_changes
```

### Event payload structure

The payload now contains both metadata and the changed entity data.

Common fields:

- `entity`
- `action`
- `entityId`
- `categoryId`
- `itemId`
- `emittedAt`
- `source`

Optional fields:

- `entityData`
- `previousCategoryId`
- `previousItemId`

### Example category event

```json
{
  "entity": "category",
  "action": "created",
  "entityId": 26,
  "categoryId": 26,
  "itemId": null,
  "entityData": {
    "id": 26,
    "category_name": "Wraps",
    "category_description": "Fresh wraps",
    "category_image": "https://res.cloudinary.com/...",
    "category_image_url": "https://res.cloudinary.com/...",
    "is_deleted": 0,
    "is_active": 1
  },
  "emittedAt": "...",
  "source": "admin-backend"
}
```

### Example item update event

```json
{
  "entity": "item",
  "action": "updated",
  "entityId": 18,
  "categoryId": 5,
  "itemId": 18,
  "previousCategoryId": 3,
  "entityData": {
    "id": 18,
    "category_id": 5,
    "item_name": "Veg Burger",
    "item_image": "https://res.cloudinary.com/...",
    "item_image_url": "https://res.cloudinary.com/...",
    "is_deleted": 0,
    "is_active": 1
  },
  "emittedAt": "...",
  "source": "admin-backend"
}
```

### Where publish is triggered

After successful:

- category create/update/delete
- item create/update/delete
- addon create/update/delete

Only successful mutations trigger realtime events.

## Step 2: Customer backend listens for database events

File:

- `Reastaurent-customer/Backend/realtime/menuChangeSubscriber.js`

This file creates a dedicated PostgreSQL client and runs:

```sql
LISTEN menu_changes
```

When a notification arrives:

1. raw payload is received
2. payload is parsed
3. customer backend cache is cleared
4. callback sends the change to WebSocket gateway

### Important database note

Realtime `LISTEN/NOTIFY` should use a direct database connection, not a pooler connection.

That is why customer backend supports:

```env
REALTIME_DATABASE_URL=
```

Recommended setup:

- `DATABASE_URL` for normal pooled queries
- `REALTIME_DATABASE_URL` for direct `LISTEN/NOTIFY`

If a pooler is used for realtime, notifications may not arrive reliably.

## Step 3: Customer backend broadcasts WebSocket messages

File:

- `Reastaurent-customer/Backend/realtime/menuUpdatesGateway.js`

This file creates the WebSocket server using the `ws` package.

Socket path:

```text
/ws
```

Message types:

- `menu.connected`
- `menu.updated`

### On connection

The customer browser receives:

```json
{
  "type": "menu.connected",
  "payload": {
    "connectedAt": "..."
  }
}
```

### On menu update

The customer browser receives:

```json
{
  "type": "menu.updated",
  "payload": {
    "entity": "item",
    "action": "updated",
    "entityId": 18,
    "categoryId": 5,
    "itemId": 18,
    "entityData": {
      "id": 18,
      "item_name": "Veg Burger"
    },
    "broadcastAt": "..."
  }
}
```

## Step 4: Customer backend cache is cleared

Files:

- `Reastaurent-customer/Backend/cache/menuCache.js`
- `Reastaurent-customer/Backend/AllGetControler.js`

The customer backend still has normal API cache for standard page loads.

When a realtime event arrives, it resets:

- category cache
- item cache
- addon cache

This is useful because if the customer later calls regular APIs again, they should return fresh data.

## Step 5: Customer frontend opens the WebSocket connection

File:

- `Reastaurent-customer/Frontend/src/realtime/useMenuUpdates.js`

This hook is responsible for:

- opening the socket
- listening to `menu.updated`
- reconnecting automatically
- handling disconnects cleanly
- debouncing rapid messages
- sending debug logs

This keeps socket logic separated from UI rendering logic.

## Step 6: Customer frontend patches local state directly

Files:

- `Reastaurent-customer/Frontend/src/realtime/applyMenuChange.js`
- `Reastaurent-customer/Frontend/src/App.jsx`

This is the most important part of the final solution.

The customer frontend no longer refetches all APIs after every admin change.

Instead, it uses the event payload to patch in-memory React state.

### Category changes

When category event comes:

- add new category to state
- update changed category in state
- remove deleted/inactive category from state
- keep selection valid

### Item changes

When item event comes:

- update item only in the selected category if relevant
- remove item from old category if category changed
- add item to new category if it now belongs to selected category
- close modal if selected item is deleted/inactive

### Addon changes

When addon event comes:

- patch addon cache only for affected item
- patch open addon modal data only for selected item
- remove moved/deleted addon from previous item if needed

This means:

- no full page refresh
- no full API refetch
- no repeated unnecessary database hits

## Why this is efficient now

Current realtime updates happen like this:

```text
admin change -> one DB notify -> one socket message -> direct local state patch
```

That is much lighter than:

```text
admin change -> socket message -> categories API -> items API -> addons API
```

So the final version reduces:

- DB load
- network traffic
- UI flicker
- repeated rerenders

## Development setup

File:

- `Reastaurent-customer/Frontend/vite.config.js`

In development, Vite proxies:

- `/api`
- `/images`
- `/ws`

Default local targets:

- customer API and WebSocket: `http://localhost:15020`
- images: `http://localhost:15013`

## Environment variables used

### Admin frontend

File:

- `Reastaurent-Admin/Frontend/.env`

Use local backend in development:

```env
VITE_BACKEND_BASE_URL=http://localhost:15013
```

### Admin backend

File:

- `Reastaurent-Admin/Backend/.env`

Example:

```env
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
PORT=15013
IMAGE_STORAGE_PROVIDER=cloudinary
```

### Customer backend

File:

- `Reastaurent-customer/Backend/.env`

Example:

```env
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require
REALTIME_DATABASE_URL=postgresql://...direct-host.../neondb?sslmode=require
PORT=15020
```

### Customer frontend

Optional overrides can be used, but local defaults already work through Vite proxy.

## Commands

### Install customer backend WebSocket dependency

```powershell
cd Reastaurent-customer/Backend
npm install ws
```

### Start admin backend

```powershell
cd Reastaurent-Admin/Backend
node server.js
```

### Start customer backend

```powershell
cd Reastaurent-customer/Backend
node server.js
```

### Start admin frontend

```powershell
cd Reastaurent-Admin/Frontend
npm run dev
```

### Start customer frontend

```powershell
cd Reastaurent-customer/Frontend
npm run dev
```

## Debug logs now available

We added logs across the realtime chain.

### Admin backend logs

Example:

```text
[menu-events][admin] Published menu change: ...
```

### Customer backend logs

Examples:

```text
[menu-events][customer-backend] Connecting DB LISTEN subscriber...
[menu-events][customer-backend] Listening for menu changes on channel "menu_changes"
[menu-events][customer-backend] Raw DB notification: ...
[menu-events][customer-backend] Broadcasting menu update to 1 client(s): ...
```

### Customer frontend logs

Examples:

```text
[menu-events][customer-frontend] Initializing WebSocket listener: ...
[menu-events][customer-frontend] WebSocket connected
[menu-events][customer-frontend] menu.updated received: ...
[menu-events][customer-frontend] Applying item change without refetch
```

## What is realtime right now

Currently working in realtime:

- category create/update/delete
- item create/update/delete
- addon create/update/delete
- related image updates

## What is not realtime yet

This structure is ready for future features, but they are not implemented yet:

- restaurant settings updates
- order events
- table status
- availability updates

## How future features should follow this pattern

Recommended approach:

1. save data in backend
2. publish typed event
3. listen in customer backend
4. broadcast typed WebSocket payload
5. patch only the affected frontend state

That keeps future realtime features efficient too.

## Final summary

The WebSocket is not directly connecting admin UI to customer UI.

The actual working flow is:

1. admin backend saves data
2. admin backend publishes `menu_changes`
3. customer backend listens with a direct realtime DB connection
4. customer backend clears cache and broadcasts `/ws` update
5. customer frontend receives `menu.updated`
6. customer frontend patches only the changed state
7. UI updates instantly without extra API refetch

That is the current clean, reusable, and optimized implementation.
