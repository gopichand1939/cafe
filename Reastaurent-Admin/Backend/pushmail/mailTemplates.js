const escapeHtml = (value = "") =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const humanize = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatCurrency = (value, currencyCode = "INR") => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return escapeHtml(String(value));
  }

  return escapeHtml(`${currencyCode} ${amount.toFixed(2)}`);
};

const buildCustomerOrderMailCopy = ({ payload = {}, fallbackTitle = "", fallbackMessage = "" }) => {
  const entityData = payload?.entityData || {};
  const customerName = entityData?.customer_name || "Customer";
  const orderNumber = entityData?.order_number || payload?.orderNumber || "your order";
  const orderStatus = String(entityData?.order_status || payload?.order_status || "").toLowerCase();

  const copyMap = {
    placed: {
      title: `Order ${orderNumber} placed successfully`,
      message: `Hi ${customerName}, your order (${orderNumber}) has been placed successfully.`,
    },
    accepted: {
      title: `Order ${orderNumber} accepted`,
      message: `Hi ${customerName}, your order (${orderNumber}) is now accepted and being prepared.`,
    },
    preparing: {
      title: `Order ${orderNumber} is being prepared`,
      message: `Hi ${customerName}, your order (${orderNumber}) is now being prepared.`,
    },
    ready: {
      title: `Order ${orderNumber} is ready`,
      message: `Hi ${customerName}, your order (${orderNumber}) is ready.`,
    },
    out_for_delivery: {
      title: `Order ${orderNumber} is out for delivery`,
      message: `Hi ${customerName}, your order (${orderNumber}) is out for delivery.`,
    },
    delivered: {
      title: `Order ${orderNumber} delivered`,
      message: `Hi ${customerName}, your order (${orderNumber}) has been delivered. Enjoy your meal!`,
    },
    cancelled: {
      title: `Order ${orderNumber} cancelled`,
      message: `Hi ${customerName}, your order (${orderNumber}) has been cancelled.`,
    },
    pending: {
      title: `Order ${orderNumber} is pending`,
      message: `Hi ${customerName}, your order (${orderNumber}) is currently pending.`,
    },
  };

  return copyMap[orderStatus] || {
    title: fallbackTitle,
    message: fallbackMessage,
  };
};

const buildStatCard = (label, value, accentColor) => `
  <div style="min-width:150px;flex:1;background:#ffffff;border:1px solid #e2e8f0;border-top:4px solid ${accentColor};border-radius:14px;padding:14px 16px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px">${escapeHtml(label)}</div>
    <div style="font-size:18px;font-weight:700;color:#0f172a">${value}</div>
  </div>
`;

const buildKeyValueGrid = (title, rows, palette) => {
  const validRows = rows.filter((row) => row && row.value !== undefined);

  if (!validRows.length) {
    return "";
  }

  return `
    <div style="margin-top:18px;background:${palette.soft};border:1px solid ${palette.border};border-radius:16px;overflow:hidden">
      <div style="padding:14px 18px;background:${palette.header};font-size:15px;font-weight:700;color:${palette.title}">
        ${escapeHtml(title)}
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <tbody>
          ${validRows
            .map(
              (row) => `
                <tr>
                  <td style="width:34%;padding:12px 18px;border-top:1px solid ${palette.border};font-size:13px;font-weight:700;color:#334155;vertical-align:top">
                    ${escapeHtml(row.label)}
                  </td>
                  <td style="padding:12px 18px;border-top:1px solid ${palette.border};font-size:13px;color:#0f172a;vertical-align:top;line-height:1.6">
                    ${row.isHtml ? row.value : escapeHtml(formatValue(row.value))}
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
};

const buildItemsTable = (items = [], currencyCode = "INR") => {
  if (!Array.isArray(items) || !items.length) {
    return "";
  }

  return `
    <div style="margin-top:18px;background:#ffffff;border:1px solid #dbeafe;border-radius:16px;overflow:hidden">
      <div style="padding:14px 18px;background:#eff6ff;font-size:15px;font-weight:700;color:#1d4ed8">
        Ordered Items
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#475569;border-top:1px solid #dbeafe">Item</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#475569;border-top:1px solid #dbeafe">Qty</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#475569;border-top:1px solid #dbeafe">Unit Price</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#475569;border-top:1px solid #dbeafe">Final Price</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#475569;border-top:1px solid #dbeafe">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item) => {
              const addons = Array.isArray(item?.selected_addons) && item.selected_addons.length
                ? `<div style="margin-top:6px;font-size:12px;color:#475569"><strong>Addons:</strong> ${escapeHtml(
                    item.selected_addons
                      .map((addon) => addon?.addon_name || addon?.name || JSON.stringify(addon))
                      .join(", ")
                  )}</div>`
                : "";
              const notes = item?.item_notes
                ? `<div style="margin-top:6px;font-size:12px;color:#475569"><strong>Notes:</strong> ${escapeHtml(
                    item.item_notes
                  )}</div>`
                : "";

              return `
                <tr>
                  <td style="padding:14px;border-top:1px solid #dbeafe;vertical-align:top">
                    <div style="font-size:14px;font-weight:700;color:#0f172a">${escapeHtml(
                      item?.item_name || "Item"
                    )}</div>
                    <div style="margin-top:4px;font-size:12px;color:#475569;line-height:1.5">${escapeHtml(
                      item?.item_description || ""
                    )}</div>
                    ${addons}
                    ${notes}
                  </td>
                  <td style="padding:14px;border-top:1px solid #dbeafe;vertical-align:top;font-size:13px;color:#0f172a">${escapeHtml(
                    formatValue(item?.quantity)
                  )}</td>
                  <td style="padding:14px;border-top:1px solid #dbeafe;vertical-align:top;font-size:13px;color:#0f172a">${formatCurrency(
                    item?.unit_price,
                    currencyCode
                  )}</td>
                  <td style="padding:14px;border-top:1px solid #dbeafe;vertical-align:top;font-size:13px;color:#0f172a">${formatCurrency(
                    item?.final_unit_price ?? item?.discount_price,
                    currencyCode
                  )}</td>
                  <td style="padding:14px;border-top:1px solid #dbeafe;vertical-align:top;font-size:13px;font-weight:700;color:#0f172a">${formatCurrency(
                    item?.line_total,
                    currencyCode
                  )}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
};

const buildNotificationBody = ({
  eyebrow,
  eyebrowColor,
  title,
  message,
  source = "",
  entity = "",
  action = "",
  payload = {},
  accent = "#16a34a",
  sectionPalette,
}) => {
  const entityData = payload?.entityData || {};
  const currencyCode = entityData?.currency_code || payload?.currency_code || "INR";
  const statusText =
    entity === "order"
      ? humanize(entityData?.order_status || payload?.order_status || action)
      : humanize(action);
  const displayAction =
    entity === "order" && String(action).toLowerCase() === "updated"
      ? statusText
      : humanize(action);

  const primaryStats = [
    buildStatCard("Entity", escapeHtml(humanize(entity)), accent),
    buildStatCard(entity === "order" ? "Order Action" : "Action", escapeHtml(displayAction), accent),
    buildStatCard("Status", escapeHtml(statusText), accent),
  ];

  if (entity === "order") {
    primaryStats.push(
      buildStatCard(
        "Order Total",
        formatCurrency(entityData?.total_amount, currencyCode),
        accent
      )
    );
  }

  const orderSection =
    entity === "order"
      ? buildKeyValueGrid(
          "Order Summary",
          [
            { label: "Order Number", value: entityData?.order_number || payload?.orderNumber },
            { label: "Order Id", value: entityData?.id || payload?.orderId || payload?.entityId },
            { label: "Customer Name", value: entityData?.customer_name },
            { label: "Customer Email", value: entityData?.customer_email },
            { label: "Customer Phone", value: entityData?.customer_phone },
            { label: "Order Status", value: humanize(entityData?.order_status) },
            { label: "Payment Status", value: humanize(entityData?.payment_status) },
            { label: "Payment Method", value: humanize(entityData?.payment_method) },
            { label: "Items Count", value: entityData?.item_count },
            { label: "Subtotal Amount", value: `${currencyCode} ${entityData?.subtotal_amount ?? "-"}` },
            { label: "Discount Amount", value: `${currencyCode} ${entityData?.discount_amount ?? "-"}` },
            { label: "Addon Amount", value: `${currencyCode} ${entityData?.addon_amount ?? "-"}` },
            { label: "Tax Amount", value: `${currencyCode} ${entityData?.tax_amount ?? "-"}` },
            { label: "Delivery Fee", value: `${currencyCode} ${entityData?.delivery_fee ?? "-"}` },
            { label: "Total Amount", value: `${currencyCode} ${entityData?.total_amount ?? "-"}` },
            { label: "Order Notes", value: entityData?.order_notes || "-" },
            { label: "Created At", value: entityData?.created_at || payload?.createdAt },
            { label: "Updated At", value: entityData?.updated_at || payload?.updatedAt },
            { label: "Source", value: source || payload?.source || "-" },
          ],
          sectionPalette
        )
      : "";

  const customerSection =
    entity === "customer"
      ? buildKeyValueGrid(
          "Customer Summary",
          [
            { label: "Customer Id", value: entityData?.id || payload?.customerId || payload?.entityId },
            { label: "Name", value: entityData?.name },
            { label: "Email", value: entityData?.email },
            { label: "Phone", value: entityData?.phone },
            { label: "Status", value: Number(entityData?.is_active) === 1 ? "Active" : "Inactive" },
            { label: "Deleted", value: Number(entityData?.is_deleted) === 1 ? "Yes" : "No" },
            { label: "Created At", value: entityData?.created_at || payload?.createdAt },
            { label: "Updated At", value: entityData?.updated_at || payload?.updatedAt },
            { label: "Source", value: source || payload?.source || "-" },
          ],
          sectionPalette
        )
      : "";

  const addressSection =
    entity === "order"
      ? buildKeyValueGrid(
          "Delivery Address",
          [
            { label: "Recipient Name", value: entityData?.delivery_address?.recipient_name },
            { label: "Phone", value: entityData?.delivery_address?.phone },
            { label: "Line 1", value: entityData?.delivery_address?.line1 },
            { label: "Line 2", value: entityData?.delivery_address?.line2 },
            { label: "Landmark", value: entityData?.delivery_address?.landmark },
            { label: "City", value: entityData?.delivery_address?.city },
            { label: "State", value: entityData?.delivery_address?.state },
            { label: "Pincode", value: entityData?.delivery_address?.pincode },
          ],
          sectionPalette
        )
      : "";

  const itemsSection = entity === "order" ? buildItemsTable(entityData?.items || [], currencyCode) : "";
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:24px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.14em;color:${eyebrowColor};text-transform:uppercase">${escapeHtml(
          eyebrow
        )}</p>
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.3">${escapeHtml(title)}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.8;color:#334155">${escapeHtml(message)}</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px">${primaryStats.join("")}</div>
        ${orderSection}
        ${customerSection}
        ${addressSection}
        ${itemsSection}
      </div>
    </div>
  `;
};

const buildNotificationEmailTemplate = ({
  title,
  message,
  source,
  entity,
  action,
  payload,
}) => ({
  subject: `[Bagel Master Cafe] ${title}`,
  html: buildNotificationBody({
    eyebrow: "Admin Notification Mail",
    eyebrowColor: "#16a34a",
    title,
    message,
    source,
    entity,
    action,
    payload,
    accent: "#16a34a",
    sectionPalette: {
      soft: "#f0fdf4",
      border: "#bbf7d0",
      header: "#dcfce7",
      title: "#166534",
    },
  }),
});

const buildTestEmailTemplate = ({ adminName }) => ({
  subject: "[Bagel Master Cafe] Test mail successful",
  html: `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.14em;color:#16a34a;text-transform:uppercase">Admin Message Settings</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3">Mail configuration works</h1>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">
          Hello ${escapeHtml(adminName || "Admin")}, this is a successful test message from Bagel Master Cafe.
        </p>
      </div>
    </div>
  `,
});

const buildCustomerNotificationEmailTemplate = ({
  title,
  message,
  action,
  entity,
  source,
  payload,
}) => {
  const customerCopy =
    entity === "order"
      ? buildCustomerOrderMailCopy({
          payload,
          fallbackTitle: title,
          fallbackMessage: message,
        })
      : { title, message };

  return {
    subject: `[Bagel Master Cafe] ${customerCopy.title}`,
    html: buildNotificationBody({
      eyebrow: "Customer Update Mail",
      eyebrowColor: "#f97316",
      title: customerCopy.title,
      message: customerCopy.message,
      source,
      entity,
      action,
      payload,
      accent: "#f97316",
      sectionPalette: {
        soft: "#fff7ed",
        border: "#fed7aa",
        header: "#ffedd5",
        title: "#c2410c",
      },
    }),
  };
};

module.exports = {
  buildNotificationEmailTemplate,
  buildTestEmailTemplate,
  buildCustomerNotificationEmailTemplate,
};
