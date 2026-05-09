const DEFAULT_TIMEZONE = "Asia/Kolkata";

const ORDER_STATUS_VALUES = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "refunded"];

const PAYMENT_METHOD_VALUES = [
  "cash_on_delivery",
  "card",
  "upi",
  "net_banking",
  "wallet",
  "stripe",
  "razorpay",
];

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const input = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }

  const date = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : input;
};

const todayInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const lookup = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
};

const normalizeTimezone = (timezone) => {
  const candidate = String(timezone || "").trim() || DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch (_error) {
    return DEFAULT_TIMEZONE;
  }
};

const normalizeFilters = (query = {}, fallbackTimezone = DEFAULT_TIMEZONE) => {
  const timezone = normalizeTimezone(query.timezone || fallbackTimezone);
  const today = todayInTimezone(timezone);
  const fromDate = toIsoDate(query.from_date) || toIsoDate(query.date) || today;
  const toDate = toIsoDate(query.to_date) || fromDate;
  const paymentStatus = String(query.payment_status || "").trim();
  const orderStatus = String(query.order_status || "").trim();
  const paymentMethod = String(query.payment_method || "").trim();
  const limit = Math.min(Math.max(parseInt(query.limit || "100", 10) || 100, 1), 1000);
  const page = Math.max(parseInt(query.page || "1", 10) || 1, 1);

  return {
    fromDate,
    toDate,
    timezone,
    paymentStatus,
    orderStatus,
    paymentMethod,
    limit,
    page,
  };
};

const validateFilters = (filters) => {
  if (filters.fromDate > filters.toDate) {
    return "from_date must be before or equal to to_date";
  }

  if (filters.paymentStatus && !PAYMENT_STATUS_VALUES.includes(filters.paymentStatus)) {
    return `payment_status must be one of: ${PAYMENT_STATUS_VALUES.join(", ")}`;
  }

  if (filters.orderStatus && !ORDER_STATUS_VALUES.includes(filters.orderStatus)) {
    return `order_status must be one of: ${ORDER_STATUS_VALUES.join(", ")}`;
  }

  if (filters.paymentMethod && !PAYMENT_METHOD_VALUES.includes(filters.paymentMethod)) {
    return `payment_method must be one of: ${PAYMENT_METHOD_VALUES.join(", ")}`;
  }

  return "";
};

const numberValue = (value) => Number(value || 0);

const formatCurrency = (value, currencyCode = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode || "INR",
    maximumFractionDigits: 2,
  }).format(numberValue(value));

const formatDateTime = (date = new Date(), timezone = DEFAULT_TIMEZONE) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: normalizeTimezone(timezone),
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

const csvEscape = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rowsToCsv = (rows, columns) => {
  const header = columns.map((column) => csvEscape(column.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => csvEscape(row[column.key])).join(",")
  );

  return [header, ...lines].join("\n");
};

module.exports = {
  DEFAULT_TIMEZONE,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  normalizeFilters,
  validateFilters,
  normalizeTimezone,
  numberValue,
  formatCurrency,
  formatDateTime,
  rowsToCsv,
};
