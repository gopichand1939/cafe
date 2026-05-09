const buildReportWhereClause = (filters, startIndex = 1) => {
  const values = [filters.fromDate, filters.toDate, filters.timezone];
  const clauses = [
    "o.is_deleted = 0",
    `o.created_at >= ($${startIndex}::date::timestamp AT TIME ZONE $${startIndex + 2})`,
    `o.created_at < (($${startIndex + 1}::date + INTERVAL '1 day')::timestamp AT TIME ZONE $${startIndex + 2})`,
  ];

  if (filters.paymentStatus) {
    values.push(filters.paymentStatus);
    clauses.push(`o.payment_status = $${startIndex + values.length - 1}`);
  }

  if (filters.orderStatus) {
    values.push(filters.orderStatus);
    clauses.push(`o.order_status = $${startIndex + values.length - 1}`);
  }

  if (filters.paymentMethod) {
    values.push(filters.paymentMethod);
    clauses.push(`o.payment_method = $${startIndex + values.length - 1}`);
  }

  return {
    where: clauses.join(" AND "),
    values,
  };
};

const filteredOrdersCte = (filters) => {
  const { where, values } = buildReportWhereClause(filters);

  return {
    values,
    cte: `
      WITH filtered_orders AS (
        SELECT
          o.*,
          (o.created_at AT TIME ZONE $3)::date AS restaurant_order_date,
          EXTRACT(HOUR FROM o.created_at AT TIME ZONE $3)::INT AS restaurant_order_hour
        FROM orders o
        WHERE ${where}
      )
    `,
  };
};

module.exports = {
  buildReportWhereClause,
  filteredOrdersCte,
};
