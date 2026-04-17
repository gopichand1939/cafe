# Realtime Pattern Guide

This document defines the standard realtime pattern for this project.

Use this same structure for all future realtime features, including:

- menu
- customer updates
- orders
- restaurant settings
- availability
- table status

The goal is consistency:

- same backend flow
- same payload style
- same frontend update style
- same naming pattern
- same logging pattern

## Core rule

Every realtime feature should follow this exact flow:

```text
Controller saves data
  -> publish typed event
  -> customer backend receives DB event
  -> customer backend broadcasts WebSocket message
  -> frontend receives typed payload
  -> frontend patches only affected local state
```

Do not default to:

- full page refresh
- full app refresh
- refetch all APIs after every event

## Standard architecture

### 1. Controller layer

Each controller should:

- validate input
- save/update/delete data
- publish realtime event after success

Controllers should not:

- manage socket connections directly
- contain broadcast logic
- contain frontend-specific logic

### 2. Realtime event helper

Each domain should have a small publish helper file.

Example:

```text
Backend/realtime/menuEvents.js
Backend/realtime/orderEvents.js
Backend/realtime/customerEvents.js
```

Purpose:

- build payload
- publish PostgreSQL `NOTIFY`
- expose safe wrapper like `publish...Safely`

### 3. Customer backend listener

Customer backend should:

- `LISTEN` to DB events
- parse payload
- clear related backend cache if needed
- send the event to WebSocket gateway

### 4. WebSocket gateway

Gateway should:

- own socket server creation
- own connected client handling
- own broadcast logic

Gateway should not:

- query database
- contain business logic

### 5. Frontend socket hook

Each frontend realtime area should have a hook.

Example:

```text
src/realtime/useMenuUpdates.js
src/realtime/useOrderUpdates.js
src/realtime/useCustomerUpdates.js
```

Purpose:

- open socket
- listen to typed messages
- reconnect
- pass payload to state updater

### 6. Frontend state patch utility

Each domain should have a pure patch helper.

Example:

```text
src/realtime/applyMenuChange.js
src/realtime/applyOrderChange.js
src/realtime/applyCustomerChange.js
```

Purpose:

- take current state
- take event payload
- return next state

This keeps UI components cleaner and makes behavior reusable.

## Standard event payload shape

All realtime payloads should follow the same base structure.

Required fields:

- `entity`
- `action`
- `entityId`
- `emittedAt`
- `source`

Optional relationship fields:

- `categoryId`
- `itemId`
- `orderId`
- `customerId`
- `tableId`
- `previousCategoryId`
- `previousItemId`
- `previousStatus`

Optional data fields:

- `entityData`
- `meta`

## Recommended payload example

```json
{
  "entity": "order",
  "action": "updated",
  "entityId": 42,
  "orderId": 42,
  "customerId": 9,
  "entityData": {
    "id": 42,
    "status": "preparing",
    "total": 549
  },
  "emittedAt": "2026-04-17T12:00:00.000Z",
  "source": "admin-backend"
}
```

## Standard action names

Use consistent action names everywhere:

- `created`
- `updated`
- `deleted`

Only introduce extra actions if really needed:

- `status_changed`
- `assigned`
- `completed`

If standard CRUD works, prefer that.

## Standard entity names

Use lowercase singular names:

- `category`
- `item`
- `addon`
- `order`
- `customer`
- `restaurant`

Do not mix plural and singular randomly.

## Controller publishing pattern

After successful mutation, controller should publish like this:

```js
await publishOrderChangeSafely({
  entity: "order",
  action: "updated",
  entityId: updatedOrder.id,
  orderId: updatedOrder.id,
  previousStatus: existingOrder.status,
  entityData: updatedOrder,
});
```

This is the standard style to follow.

## Logging pattern

Use consistent logs everywhere.

Examples:

### Admin/backend side

```text
[order-events][admin] Published order change: ...
```

### Customer backend side

```text
[order-events][customer-backend] Raw DB notification: ...
[order-events][customer-backend] Broadcasting order update to 2 client(s): ...
```

### Frontend side

```text
[order-events][customer-frontend] WebSocket connected
[order-events][customer-frontend] order.updated received: ...
```

Keep log prefixes consistent by domain.

## Rules for frontend updates

Frontend should patch only the affected state.

Good:

- update one order in order list
- remove one deleted category
- update one item card
- patch one customer profile section

Avoid:

- refetch all data on every message
- rerender the whole app if only one record changed

## When refetch is acceptable

Refetch is allowed only when:

- payload does not contain enough data
- derived state is too complex to patch safely
- first implementation needs safe fallback temporarily

But final preferred pattern is:

```text
typed event -> direct local state patch
```

## Backend cache rule

If customer backend caches API data:

- clear only affected cache area if possible
- if selective invalidation is hard, clear domain cache

Cache invalidation belongs in customer backend listener layer, not frontend.

## Naming conventions

Recommended names:

### Backend

- `publishMenuChangeSafely`
- `publishOrderChangeSafely`
- `startMenuChangeSubscriber`
- `startOrderChangeSubscriber`
- `createMenuUpdatesGateway`
- `createOrderUpdatesGateway`

### Frontend

- `useMenuUpdates`
- `useOrderUpdates`
- `applyMenuChange`
- `applyOrderChange`

Keep naming predictable and domain-based.

## File structure recommendation

### Backend

```text
Backend/
├─ realtime/
│  ├─ menuEvents.js
│  ├─ orderEvents.js
│  ├─ customerEvents.js
│  ├─ menuChangeSubscriber.js
│  ├─ orderChangeSubscriber.js
│  └─ menuUpdatesGateway.js
```

### Frontend

```text
src/
├─ realtime/
│  ├─ useMenuUpdates.js
│  ├─ useOrderUpdates.js
│  ├─ applyMenuChange.js
│  └─ applyOrderChange.js
```

## Example future order implementation

If we add orders, follow this exact pattern:

1. order controller saves or updates order
2. order controller publishes `order` event
3. customer/backend listener receives DB notification
4. gateway broadcasts `order.updated`
5. frontend hook receives it
6. `applyOrderChange.js` updates local order state only

Do not build a different pattern just for orders.

## Consistency checklist

Before adding any new realtime feature, check:

- controller publishes event after success
- event helper exists for that domain
- payload shape matches standard
- customer backend listener handles event cleanly
- gateway broadcasts typed message
- frontend hook exists
- frontend patch utility exists
- no unnecessary full refetch
- logs follow standard prefix

## Final rule

For every new realtime feature in this project, use the same pattern already used for:

- category
- item
- addon

That should be treated as the reference implementation.
