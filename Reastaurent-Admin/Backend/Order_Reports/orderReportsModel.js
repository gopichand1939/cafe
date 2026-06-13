const db = require("../config/db");
const { filteredOrdersCte } = require("./reportQueries");
const { numberValue } = require("./reportUtils");

const getRestaurantDetails = async (adminId = null) => {
  const values = [];
  const adminFilter = adminId ? "WHERE admin_id = $1" : "";

  if (adminId) {
    values.push(adminId);
  }

  const result = await db.query(
    `
      SELECT
        institution_name,
        restaurant_name,
        timezone_name
      FROM restaurant_settings
      ${adminFilter}
      ORDER BY id ASC
      LIMIT 1;
    `,
    values
  );

  return (
    result.rows[0] || {
      institution_name: "Bagel Master Group",
      restaurant_name: "Bagel Master Cafe",
      timezone_name: "Asia/Kolkata",
    }
  );
};

const ensureOrderReportsAccessControlData = async () => {
  await db.query(`
    INSERT INTO access_modules (module_key, module_name, priority, status)
    VALUES ('reports', 'Reports', 45, 1)
    ON CONFLICT (module_key)
    DO UPDATE SET
      module_name = EXCLUDED.module_name,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP;
  `);

  await db.query(`
    INSERT INTO access_menus (
      parent_menu_id,
      module_id,
      menu_key,
      menu_name,
      route_path,
      icon_key,
      priority,
      status
    )
    SELECT
      NULL,
      module_id,
      'reports',
      'Reports',
      '/reports',
      'reports',
      45,
      1
    FROM access_modules
    WHERE module_key = 'reports'
    ON CONFLICT (menu_key)
    DO UPDATE SET
      module_id = EXCLUDED.module_id,
      menu_name = EXCLUDED.menu_name,
      route_path = EXCLUDED.route_path,
      icon_key = EXCLUDED.icon_key,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP;
  `);

  await db.query(`
    INSERT INTO access_menu_actions (menu_id, action_id, priority, status)
    SELECT am.menu_id, aa.action_id, aa.priority, 1
    FROM access_menus am
    CROSS JOIN access_actions aa
    WHERE am.menu_key = 'reports'
      AND aa.action_key IN ('view')
    ON CONFLICT (menu_id, action_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP;
  `);

  await db.query(`
    INSERT INTO admin_menu_permissions (admin_id, menu_id, action_id, status)
    SELECT adm.id, ama.menu_id, ama.action_id, 1
    FROM admin adm
    CROSS JOIN access_menu_actions ama
    INNER JOIN access_menus am ON am.menu_id = ama.menu_id
    WHERE adm.is_deleted = 0
      AND am.menu_key = 'reports'
    ON CONFLICT (admin_id, menu_id, action_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP;
  `);
};

const getSummary = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte},
      top_product AS (
        SELECT
          oi.item_name,
          SUM(oi.quantity)::INT AS total_quantity,
          SUM(oi.line_total)::NUMERIC(12, 2) AS total_sales
        FROM filtered_orders fo
        JOIN order_items oi ON oi.order_id = fo.id
        GROUP BY oi.item_name
        ORDER BY total_quantity DESC, total_sales DESC
        LIMIT 1
      ),
      top_customer AS (
        SELECT
          customer_id,
          customer_name,
          SUM(total_amount)::NUMERIC(12, 2) AS total_spent
        FROM filtered_orders
        GROUP BY customer_id, customer_name
        ORDER BY total_spent DESC
        LIMIT 1
      ),
      peak_hour AS (
        SELECT
          restaurant_order_hour,
          SUM(total_amount)::NUMERIC(12, 2) AS total_sales
        FROM filtered_orders
        GROUP BY restaurant_order_hour
        ORDER BY total_sales DESC
        LIMIT 1
      )
      SELECT
        COUNT(*)::INT AS total_orders,
        COUNT(*) FILTER (WHERE order_status = 'delivered')::INT AS completed_orders,
        COUNT(*) FILTER (WHERE order_status = 'delivered')::INT AS total_delivered,
        COUNT(*) FILTER (WHERE order_status = 'cancelled')::INT AS cancelled_orders,
        COUNT(*) FILTER (WHERE order_status = 'cancelled')::INT AS total_cancelled,
        COUNT(*) FILTER (WHERE order_status NOT IN ('delivered', 'cancelled'))::INT AS pending_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::NUMERIC(12, 2) AS paid_amount,
        COALESCE(SUM(total_amount) FILTER (
          WHERE payment_method = 'cash_on_delivery'
            AND payment_status <> 'paid'
            AND order_status <> 'cancelled'
        ), 0)::NUMERIC(12, 2) AS cod_pending_amount,
        COALESCE(AVG(total_amount), 0)::NUMERIC(12, 2) AS average_order_value,
        COALESCE(SUM(tax_amount), 0)::NUMERIC(12, 2) AS total_tax_collected,
        COALESCE(SUM(discount_amount), 0)::NUMERIC(12, 2) AS total_discounts,
        (SELECT item_name FROM top_product) AS top_selling_product,
        (SELECT total_quantity FROM top_product) AS top_selling_quantity,
        (SELECT total_sales FROM top_product) AS top_selling_sales,
        (SELECT customer_name FROM top_customer) AS top_customer,
        (SELECT total_spent FROM top_customer) AS top_customer_spend,
        (SELECT restaurant_order_hour FROM peak_hour) AS peak_sales_hour
      FROM filtered_orders;
    `,
    values
  );

  const row = result.rows[0] || {};
  const peakHour = row.peak_sales_hour === null || row.peak_sales_hour === undefined
    ? null
    : Number(row.peak_sales_hour);

  return {
    total_orders: numberValue(row.total_orders),
    completed_orders: numberValue(row.completed_orders),
    cancelled_orders: numberValue(row.cancelled_orders),
    pending_orders: numberValue(row.pending_orders),
    total_delivered: numberValue(row.total_delivered),
    total_cancelled: numberValue(row.total_cancelled),
    total_revenue: numberValue(row.total_revenue),
    paid_amount: numberValue(row.paid_amount),
    cod_pending_amount: numberValue(row.cod_pending_amount),
    average_order_value: numberValue(row.average_order_value),
    total_tax_collected: numberValue(row.total_tax_collected),
    total_discounts: numberValue(row.total_discounts),
    top_selling_product: row.top_selling_product || null,
    top_selling_quantity: numberValue(row.top_selling_quantity),
    top_selling_sales: numberValue(row.top_selling_sales),
    top_customer: row.top_customer || null,
    top_customer_spend: numberValue(row.top_customer_spend),
    peak_sales_hour: formatHourRange(peakHour),
  };
};

const formatHourRange = (hour) => {
  if (hour === null || Number.isNaN(hour)) {
    return null;
  }

  const start = hour % 24;
  const end = (hour + 1) % 24;
  return `${formatHour(start)} - ${formatHour(end)}`;
};

const formatHour = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const value = hour % 12 || 12;
  return `${String(value).padStart(2, "0")} ${suffix}`;
};

const getOrders = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  values.push(filters.limit);
  const limitPosition = values.length;
  values.push((filters.page - 1) * filters.limit);
  const offsetPosition = values.length;

  const result = await db.query(
    `
      ${cte}
      SELECT
        fo.id,
        fo.order_number,
        fo.customer_id,
        fo.customer_name,
        fo.customer_email,
        fo.customer_phone,
        fo.order_status,
        fo.payment_status,
        fo.payment_method,
        fo.currency_code,
        fo.item_count,
        fo.subtotal_amount,
        fo.discount_amount,
        fo.tax_amount,
        fo.delivery_fee,
        fo.total_amount,
        fo.restaurant_order_date,
        fo.created_at,
        COALESCE(
          string_agg(CONCAT(oi.item_name, ' x', oi.quantity::text), ', ' ORDER BY oi.id)
            FILTER (WHERE oi.id IS NOT NULL),
          ''
        ) AS ordered_items,
        COUNT(*) OVER()::INT AS total_records
      FROM filtered_orders fo
      LEFT JOIN order_items oi ON oi.order_id = fo.id
      GROUP BY fo.id, fo.order_number, fo.customer_id, fo.customer_name, fo.customer_email,
        fo.customer_phone, fo.order_status, fo.payment_status, fo.payment_method,
        fo.currency_code, fo.item_count, fo.subtotal_amount, fo.discount_amount,
        fo.tax_amount, fo.delivery_fee, fo.total_amount, fo.restaurant_order_date, fo.created_at
      ORDER BY fo.created_at DESC
      LIMIT $${limitPosition} OFFSET $${offsetPosition};
    `,
    values
  );

  return result.rows;
};

const getPaymentSummary = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte}
      SELECT
        payment_status,
        payment_method,
        COUNT(*)::INT AS total_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_amount
      FROM filtered_orders
      GROUP BY payment_status, payment_method
      ORDER BY total_amount DESC;
    `,
    values
  );

  return result.rows;
};

const getTopProducts = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  values.push(filters.limit);

  const result = await db.query(
    `
      ${cte}
      SELECT
        oi.item_name,
        SUM(oi.quantity)::INT AS total_quantity,
        COALESCE(SUM(oi.line_total), 0)::NUMERIC(12, 2) AS total_sales
      FROM filtered_orders fo
      JOIN order_items oi ON oi.order_id = fo.id
      GROUP BY oi.item_name
      ORDER BY total_quantity DESC, total_sales DESC
      LIMIT $${values.length};
    `,
    values
  );

  return result.rows;
};

const getHourlySales = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte}
      SELECT
        restaurant_order_hour AS hour,
        COUNT(*)::INT AS total_orders,
        COUNT(*) FILTER (WHERE order_status = 'delivered')::INT AS delivered_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_sales
      FROM filtered_orders
      GROUP BY restaurant_order_hour
      ORDER BY restaurant_order_hour ASC;
    `,
    values
  );

  const hourlyMap = result.rows.reduce((accumulator, row) => {
    const hour = Number(row.hour);
    accumulator[hour] = {
      hour,
      total_orders: numberValue(row.total_orders),
      delivered_orders: numberValue(row.delivered_orders),
      total_sales: numberValue(row.total_sales),
    };
    return accumulator;
  }, {});

  return Array.from({ length: 24 }, (_, hour) => {
    const entry = hourlyMap[hour] || {
      hour,
      total_orders: 0,
      delivered_orders: 0,
      total_sales: 0,
    };

    return {
      ...entry,
      hour_label: formatHourRange(hour),
      short_hour_label: formatHour(hour),
    };
  });
};

const getDailySales = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte}
      SELECT
        restaurant_order_date AS sales_date,
        COUNT(*)::INT AS total_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::NUMERIC(12, 2) AS paid_amount,
        COALESCE(SUM(tax_amount), 0)::NUMERIC(12, 2) AS tax_amount,
        COALESCE(SUM(discount_amount), 0)::NUMERIC(12, 2) AS discount_amount
      FROM filtered_orders
      GROUP BY restaurant_order_date
      ORDER BY restaurant_order_date ASC;
    `,
    values
  );

  return result.rows;
};

const getStatusAnalytics = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte}
      SELECT
        order_status,
        COUNT(*)::INT AS total_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_amount
      FROM filtered_orders
      GROUP BY order_status
      ORDER BY total_orders DESC;
    `,
    values
  );

  return result.rows;
};

const getTaxSummary = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  const result = await db.query(
    `
      ${cte}
      SELECT
        COALESCE(SUM(subtotal_amount), 0)::NUMERIC(12, 2) AS subtotal_amount,
        COALESCE(SUM(tax_amount), 0)::NUMERIC(12, 2) AS tax_amount,
        COALESCE(SUM(discount_amount), 0)::NUMERIC(12, 2) AS discount_amount,
        COALESCE(SUM(delivery_fee), 0)::NUMERIC(12, 2) AS delivery_fee,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_amount
      FROM filtered_orders;
    `,
    values
  );

  return result.rows[0] || {};
};

const getCustomerAnalytics = async (filters) => {
  const { cte, values } = filteredOrdersCte(filters);
  values.push(filters.limit);

  const result = await db.query(
    `
      ${cte}
      SELECT
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        COUNT(*)::INT AS total_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC(12, 2) AS total_spent,
        COALESCE(AVG(total_amount), 0)::NUMERIC(12, 2) AS average_order_value
      FROM filtered_orders
      GROUP BY customer_id, customer_name, customer_email, customer_phone
      ORDER BY total_spent DESC
      LIMIT $${values.length};
    `,
    values
  );

  return result.rows;
};

const getCodPending = async (filters) => {
  return getOrders({
    ...filters,
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
  });
};

const getFullReport = async (filters, adminId = null) => {
  const [
    restaurant,
    summary,
    orders,
    payments,
    topProducts,
    hourlySales,
    dailySales,
    statusAnalytics,
    taxSummary,
    customerAnalytics,
    codPending,
  ] = await Promise.all([
    getRestaurantDetails(adminId),
    getSummary(filters),
    getOrders({ ...filters, limit: Math.min(filters.limit, 200) }),
    getPaymentSummary(filters),
    getTopProducts({ ...filters, limit: 20 }),
    getHourlySales(filters),
    getDailySales(filters),
    getStatusAnalytics(filters),
    getTaxSummary(filters),
    getCustomerAnalytics({ ...filters, limit: 20 }),
    getCodPending({ ...filters, limit: 200 }),
  ]);

  return {
    restaurant,
    filters,
    summary,
    orders,
    payments,
    topProducts,
    hourlySales,
    dailySales,
    statusAnalytics,
    taxSummary,
    customerAnalytics,
    codPending,
  };
};

module.exports = {
  ensureOrderReportsAccessControlData,
  getRestaurantDetails,
  getSummary,
  getOrders,
  getPaymentSummary,
  getTopProducts,
  getHourlySales,
  getDailySales,
  getStatusAnalytics,
  getTaxSummary,
  getCustomerAnalytics,
  getCodPending,
  getFullReport,
};
