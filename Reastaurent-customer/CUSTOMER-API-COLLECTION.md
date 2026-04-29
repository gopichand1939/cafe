# Customer Portal API Collection

## Base URLs

- Deployed API base URL: `https://cafe-customer-backend.onrender.com/api`
- Deployed WebSocket URL: `wss://cafe-customer-backend.onrender.com/ws`
- Local API base URL: `http://localhost:15020/api`
- Local WebSocket URL: `ws://localhost:15020/ws`

## Customer Portal Flow Order

1. `POST /categories`
2. `POST /items-by-category`
3. `POST /item-addons`
4. `POST /auth/login` or `POST /auth/register`
5. `GET /customer/profile`
6. `POST /notifications/unread-summary`
7. `POST /orders/place-order` for cash on delivery
8. `POST /payments/create-checkout-session` for Stripe
9. `POST /payments/confirm-checkout-session` after Stripe redirects back
10. `POST /orders/my-orders`
11. `POST /orders/order-details`
12. `POST /notifications/list`
13. `POST /notifications/mark-as-read`
14. `POST /notifications/mark-all-as-read`
15. `POST /customer/update-profile`
16. `POST /auth/change-password`
17. `POST /auth/logout`

## Main Login API

- API name: `Login Customer`
- Method: `POST`
- Full deployed URL: `https://cafe-customer-backend.onrender.com/api/auth/login`
- Full local URL: `http://localhost:15020/api/auth/login`
- Headers:
- `Content-Type: application/json`
- Body:

```json
{
  "email": "dishant@example.com",
  "password": "123456"
}
```

- Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": 1,
      "name": "Dishant",
      "email": "dishant@example.com",
      "phone": "9876543210"
    },
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token"
  }
}
```

- Error response:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## Auth Header Format

For protected APIs use:

```http
Authorization: Bearer <access_token>
```

## Actually Used vs Available

Actually used in the current customer UI:

- Menu: categories, items-by-category, item-addons
- Auth: register, login, logout, change-password
- Profile: profile, update-profile
- Orders: place-order, my-orders, order-details
- Notifications: unread-summary, list, mark-as-read, mark-all-as-read
- Payments: create-checkout-session, confirm-checkout-session
- Realtime: WebSocket on `/ws`

Available in backend/service layer but not used by the current UI:

- `POST /auth/refresh-token`
- `POST /payments/create-payment-intent`
- `POST /payments/confirm-payment`
- `POST /notifications/by-id`
