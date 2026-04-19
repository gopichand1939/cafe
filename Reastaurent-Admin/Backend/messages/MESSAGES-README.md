# Admin Messages Mail System

This document explains the new admin-side mail implementation that was added for notification delivery.

## Goal

The goal of this module is:

- keep mail configuration separate from notifications
- keep reusable mail-sending logic in its own folder
- let admin decide which actions should send email
- send admin email when important customer or order actions happen

So this system is not mixed directly into realtime code or controller code.

## Folder Structure

The implementation is split into two clear backend areas.

### `messages/`

This folder is for admin-configurable mail settings.

Files:

- [message.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message.sql)
- [message-menu.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message-menu.sql)
- [messageModel.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/messageModel.js)
- [MessageController.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/MessageController.js)
- [messageRoutes.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/messageRoutes.js)

Responsibility:

- store message/mail settings in DB
- expose admin APIs to read/update settings
- expose a test-mail API

### `pushmail/`

This folder is for actual email sending logic.

Files:

- [mailTransport.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailTransport.js)
- [mailTemplates.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailTemplates.js)
- [mailService.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailService.js)

Responsibility:

- create reusable nodemailer transport
- build mail subject/body templates
- send notification mail
- send test mail

This separation keeps config and delivery logic clean.

## Database Table

The mail configuration is stored in:

- `message_settings`

SQL file:

- [message.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message.sql)

The table stores:

- `admin_id`
- `admin_email`
- `sender_name`
- `sender_email`
- `smtp_host`
- `smtp_port`
- `smtp_secure`
- `smtp_user`
- `smtp_pass`
- `mail_enabled`
- action toggles for customer and order events
- customer-facing mail toggles for admin-originated actions

Important note:

- this table is **manual SQL only**
- backend does **not** auto-create it
- if you created the table before the second-direction mail work, also run:
  - [message-alter.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message-alter.sql)

## Admin Menu

A new admin sidebar menu was added:

- `messages`
- route: `/messages`

SQL file:

- [message-menu.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message-menu.sql)

This inserts:

- a new module: `Messages`
- a new menu: `Messages`
- menu permissions for existing admins

## Backend APIs

The new APIs are:

- `GET /messages/settings`
- `PUT /messages/settings`
- `POST /messages/test-mail`

Route file:

- [messageRoutes.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/messageRoutes.js)

Controller file:

- [MessageController.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/MessageController.js)

### `GET /messages/settings`

Purpose:

- fetch current admin mail settings

If no DB row exists yet:

- a default in-memory settings object is returned

### `PUT /messages/settings`

Purpose:

- save SMTP config and mail toggles

This stores:

- destination admin email
- sender info
- SMTP host/port/user/password
- secure SMTP flag
- master mail enable flag
- per-event email toggles
- per-event customer mail toggles

### `POST /messages/test-mail`

Purpose:

- send a test email using the currently saved settings

This helps verify SMTP config before relying on live notification mail.

## Technical Flow

The technical mail flow is:

1. Some business event happens.
2. Admin notification is created.
3. Notification service publishes DB/websocket notification as before.
4. After notification creation, mail service checks whether email should also be sent.
5. If message settings allow it, nodemailer sends email to the correct recipient mailbox.

So email sending is attached to notification creation, not directly to controllers.

That makes it reusable and consistent.

## Notification Bridge

The mail bridge is connected in:

- [notificationService.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/notifications/notificationService.js)

Current behavior:

- admin notifications are still saved normally
- websocket still works normally
- email is attempted after notification row creation

This means one event can now create:

- DB notification
- websocket notification
- optional admin email
- optional customer email

## Mail Toggle Logic

Mail sending is controlled by:

- `mail_enabled`

and by per-action flags:

- `notify_customer_created`
- `notify_customer_updated`
- `notify_customer_deleted`
- `notify_order_created`
- `notify_order_updated`
- `notify_order_deleted`

and customer mail flags:

- `notify_customer_mail_customer_created`
- `notify_customer_mail_customer_updated`
- `notify_customer_mail_customer_deleted`
- `notify_customer_mail_order_created`
- `notify_customer_mail_order_updated`
- `notify_customer_mail_order_deleted`

These checks are implemented in:

- [mailService.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailService.js)

So even if notifications are created, email only sends when:

- mail is enabled
- the entity/action toggle is enabled
- SMTP config is valid

Direction logic currently is:

- customer-originated activity -> admin mail
- admin-originated activity -> customer mail

## Nodemailer

Dependency added:

- `nodemailer`

Updated file:

- [package.json](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/package.json)

Transport creation is isolated in:

- [mailTransport.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailTransport.js)

Why this is useful:

- central place for SMTP setup
- reusable for future customer mail
- easy to replace later if provider changes

## Mail Templates

Templates are isolated in:

- [mailTemplates.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailTemplates.js)

Currently added:

- notification email template
- test email template
- customer update email template

## Rich Email Detail Format

Order and customer mails now render the full changed payload in a proper structured format instead of a tiny plain summary.

For order mails, the template shows:

- top stat cards for entity, action, status, and total
- full order summary box
- customer details
- payment details
- amount breakdown
- order notes
- created/updated timestamps
- delivery address in a separate box
- ordered items in a table
- any remaining payload fields in an additional details box

For customer mails, the template shows:

- customer summary box
- activity details
- timestamps
- any remaining payload fields in a structured box

This is implemented in:

- [mailTemplates.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailTemplates.js)

And the full notification payload is passed from:

- [mailService.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/pushmail/mailService.js)

So if an order update payload contains:

- order number
- customer name/email/phone
- status
- totals
- delivery address
- items array

those values now appear directly in the email body in readable boxes and tables.

Why:

- subject/body formatting stays separate from business logic
- future templates can be added cleanly

## Frontend Integration

A full admin `Messages` page was added in frontend.

Files:

- [MessageSettings.jsx](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/components/Messages/MessageSettings.jsx)
- [index.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/components/Messages/index.js)

Routing and sidebar integration:

- [AllRoutes.jsx](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/Router/AllRoutes.jsx)
- [menuConfig.js](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/Utils/menuConfig.js)
- [Sidebar.jsx](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/components/Sidebar/Sidebar.jsx)
- [en.json](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/Utils/i18n/en.json)
- [Constant.jsx](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Frontend/src/Utils/Constant.jsx)

The page lets admin:

- enter SMTP settings
- enable/disable mail system
- choose which actions should send mail
- choose which admin actions should also mail the customer
- send test mail

## What It Sends Right Now

Right now this implementation is for:

- admin email on customer activity notifications
- admin email on order activity notifications
- customer email on admin-originated customer or order activity

Examples:

- customer created
- customer updated
- customer deleted
- order created
- order updated
- order deleted
- admin accepts order -> customer mail
- admin updates order status -> customer mail
- admin updates customer details -> customer mail

## What Is Not Done Yet

This step does **not** yet implement:

- a mail history table
- queued background mail retry system
- per-admin multi-admin distribution logic

So this is now a clean two-direction mail foundation, but still not a full mail history/queue system.

## Required Setup Steps

Before mail will work, do these steps manually:

1. Run [message.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message.sql) in Neon.
2. If the table already existed from the older version, run [message-alter.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message-alter.sql) in Neon.
3. Run [message-menu.sql](C:/Users/Dishant/OneDrive/Desktop/Reastaurent/Reastaurent-Admin/Backend/messages/message-menu.sql) in Neon.
4. Run `npm install` in `Reastaurent-Admin/Backend` to install `nodemailer`.
5. Restart admin backend.
6. Restart admin frontend.
7. Login again.
8. Open `/messages`.
9. Save SMTP settings.
10. Use `Send Test Mail`.

## How It Fits With Existing Realtime

Existing flow already was:

1. customer/order event happens
2. notification row created
3. websocket update sent to admin UI

Now it becomes:

1. customer/order event happens
2. notification row created
3. websocket update sent to admin UI
4. optional admin email sent from message settings rules
5. optional customer email sent when the source is admin-side and the toggle is enabled

So mail is an extra delivery channel, not a replacement.

## Why This Design Is Good

This design was chosen because it is:

- separate
- reusable
- easy to extend
- easy to debug
- consistent with your existing controller/service/module structure

Most important separation:

- `messages/` = settings
- `pushmail/` = sending logic
- `notifications/` = event bridge

That keeps the code understandable later.
