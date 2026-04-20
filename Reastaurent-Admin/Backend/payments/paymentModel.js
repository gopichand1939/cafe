const db = require("../config/db");

const normalizePayment = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    metadata: row.metadata || {},
    raw_event: row.raw_event || {},
  };
};

const getPaymentList = async ({
  page,
  limit,
  status = "",
  gateway = "",
  isPaymentSuccess = null,
  orderId = null,
  customerId = null,
  search = "",
}) => {
  const filters = ["1 = 1"];
  const values = [];

  if (status) {
    values.push(status);
    filters.push(`p.status = $${values.length}`);
  }

  if (gateway) {
    values.push(gateway);
    filters.push(`p.gateway = $${values.length}`);
  }

  if (isPaymentSuccess !== null) {
    values.push(Number(isPaymentSuccess) === 1 ? 1 : 0);
    filters.push(`p.is_payment_success = $${values.length}`);
  }

  if (orderId) {
    values.push(orderId);
    filters.push(`p.order_id = $${values.length}`);
  }

  if (customerId) {
    values.push(customerId);
    filters.push(`p.customer_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    filters.push(`(
      p.rrn ILIKE $${values.length}
      OR p.transaction_id ILIKE $${values.length}
      OR p.provider_payment_id ILIKE $${values.length}
      OR p.provider_charge_id ILIKE $${values.length}
      OR o.order_number ILIKE $${values.length}
      OR o.customer_name ILIKE $${values.length}
      OR o.customer_email ILIKE $${values.length}
      OR o.customer_phone ILIKE $${values.length}
    )`);
  }

  values.push(limit);
  const limitPosition = values.length;
  values.push((page - 1) * limit);
  const offsetPosition = values.length;

  const query = `
    SELECT
      p.id,
      p.order_id,
      o.order_number,
      p.customer_id,
      COALESCE(c.name, o.customer_name) AS customer_name,
      COALESCE(c.email, o.customer_email) AS customer_email,
      COALESCE(c.phone, o.customer_phone) AS customer_phone,
      p.gateway,
      p.rrn,
      p.transaction_id,
      p.provider_payment_id,
      p.provider_charge_id,
      p.provider_balance_transaction_id,
      p.amount,
      p.amount_in_paise,
      p.currency_code,
      p.payment_method,
      p.status,
      p.is_payment_success,
      p.failure_code,
      p.failure_message,
      p.paid_at,
      p.created_at,
      p.updated_at,
      COUNT(*) OVER()::INT AS total_records
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE ${filters.join(" AND ")}
    ORDER BY p.id DESC
    LIMIT $${limitPosition} OFFSET $${offsetPosition};
  `;

  const result = await db.query(query, values);
  return result.rows.map(normalizePayment);
};

const getPaymentById = async (id) => {
  const query = `
    SELECT
      p.*,
      o.order_number,
      o.order_status,
      o.payment_status AS order_payment_status,
      o.total_amount AS order_total_amount,
      COALESCE(c.name, o.customer_name) AS customer_name,
      COALESCE(c.email, o.customer_email) AS customer_email,
      COALESCE(c.phone, o.customer_phone) AS customer_phone
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.id = $1
    LIMIT 1;
  `;

  const result = await db.query(query, [id]);
  return normalizePayment(result.rows[0] || null);
};

const getPaymentSummary = async () => {
  const query = `
    SELECT
      COUNT(*)::INT AS total_payments,
      COUNT(*) FILTER (WHERE is_payment_success = 1)::INT AS successful_payments,
      COUNT(*) FILTER (WHERE is_payment_success = 0)::INT AS pending_or_failed_payments,
      COALESCE(SUM(amount) FILTER (WHERE is_payment_success = 1), 0)::NUMERIC(12, 2) AS successful_amount,
      COALESCE(SUM(amount) FILTER (WHERE is_payment_success = 0), 0)::NUMERIC(12, 2) AS pending_or_failed_amount,
      COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::INT AS today_payments,
      COALESCE(SUM(amount) FILTER (
        WHERE is_payment_success = 1
          AND created_at::date = CURRENT_DATE
      ), 0)::NUMERIC(12, 2) AS today_successful_amount
    FROM payments;
  `;

  const result = await db.query(query);
  return result.rows[0] || {};
};

module.exports = {
  normalizePayment,
  getPaymentList,
  getPaymentById,
  getPaymentSummary,
};
