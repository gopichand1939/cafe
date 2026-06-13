import { useEffect, useMemo, useState } from "react";
import {
  LuDownload,
  LuFileSpreadsheet,
  LuFileText,
  LuRefreshCw,
  LuSearch,
} from "react-icons/lu";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import {
  ORDER_REPORTS_DASHBOARD,
  ORDER_REPORTS_EXPORT_CSV,
  ORDER_REPORTS_EXPORT_EXCEL,
  ORDER_REPORTS_EXPORT_PDF,
} from "../../Utils/Constant";

const paymentStatusOptions = ["", "paid", "pending", "failed", "refunded"];
const orderStatusOptions = [
  "",
  "placed",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const paymentMethodOptions = [
  "",
  "cash_on_delivery",

  "stripe",

];

const formatFilterLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];
const paymentColors = {
  paid: "#3b82f6",
  pending: "#10b981",
  failed: "#ef4444",
  refunded: "#f59e0b",
  unknown: "#64748b",
};

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (count) => {
  const date = new Date();
  date.setMonth(date.getMonth() - count);
  return date.toISOString().slice(0, 10);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatHourlyMetric = (value, name) =>
  String(name || "").toLowerCase().includes("sales")
    ? formatCurrency(value)
    : `${Number(value || 0)} delivered`;

const renderHourlyTick = (value) => {
  const label = String(value || "");
  const [start] = label.split(" - ");
  return start || label;
};

const buildUrl = (baseUrl, filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return `${baseUrl}?${params.toString()}`;
};

const getReportPayload = (responseData) => responseData?.data || responseData || {};

const normalizePaymentAnalytics = (paymentRows) => {
  if (!Array.isArray(paymentRows)) {
    return [];
  }

  const grouped = paymentRows.reduce((result, row) => {
    const status = row.payment_status || "unknown";
    const current = result[status] || {
      payment_status: status,
      payment_method: "",
      total_orders: 0,
      total_amount: 0,
      methods: [],
    };
    const method = row.payment_method || "-";

    return {
      ...result,
      [status]: {
        ...current,
        payment_method: current.payment_method || method,
        total_orders: current.total_orders + Number(row.total_orders || 0),
        total_amount: current.total_amount + Number(row.total_amount || 0),
        methods: current.methods.includes(method) ? current.methods : [...current.methods, method],
      },
    };
  }, {});

  return Object.values(grouped).filter((row) => row.total_amount > 0 || row.total_orders > 0);
};

function StatTile({ label, value, tone = "emerald" }) {
  const toneMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone] || toneMap.emerald}`}>
      <p className="m-0 text-sm font-bold opacity-80">{label}</p>
      <strong className="mt-2 block text-2xl leading-tight text-current">{value}</strong>
    </div>
  );
}

function OrderReports() {
  const [filters, setFilters] = useState({
    from_date: monthsAgo(4),
    to_date: today(),
    payment_status: "",
    order_status: "",
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryFilters = useMemo(
    () => ({
      ...filters,
      limit: "200",
    }),
    [filters]
  );

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchWithRefreshToken(buildUrl(ORDER_REPORTS_DASHBOARD, queryFilters));
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load reports");
      }

      const payload = getReportPayload(data);
      console.log("API RESPONSE", data);
      console.log("PAYMENTS", payload.payments || []);
      console.log("DAILY SALES", payload.dailySales || []);
      setReport(payload);
    } catch (requestError) {
      setError(requestError.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const downloadReport = async (url, extension) => {
    const response = await fetchWithRefreshToken(buildUrl(url, queryFilters));
    const blob = await response.blob();

    if (!response.ok) {
      setError("Download failed");
      return;
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `order-report-${filters.from_date}-to-${filters.to_date}.${extension}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const summary = report?.summary || {};
  const orders = report?.orders || [];
  const displayedOrders = useMemo(
    () =>
      filters.payment_method
        ? orders.filter((order) => String(order.payment_method || "") === filters.payment_method)
        : orders,
    [filters.payment_method, orders]
  );
  const selectedMethodOrderCount = displayedOrders.length;
  const payments = normalizePaymentAnalytics(report?.payments);
  const topProducts = Array.isArray(report?.topProducts) ? report.topProducts : [];
  const topProductChartData = useMemo(
    () =>
      topProducts
        .slice(0, 8)
        .map((product) => ({
          ...product,
          total_sales: Number(product.total_sales || 0),
          total_quantity: Number(product.total_quantity || 0),
        }))
        .filter((product) => product.total_sales > 0),
    [topProducts]
  );
  const hourlySales = Array.isArray(report?.hourlySales) ? report.hourlySales : [];
  const dailySales = Array.isArray(report?.dailySales) ? report.dailySales : [];
  const statusAnalytics = Array.isArray(report?.statusAnalytics) ? report.statusAnalytics : [];

  return (
    <div className="ui-page content-start">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="m-0 text-sm font-black uppercase tracking-[0.16em] text-brand-600">
            Reports
          </p>
          <h1 className="m-0 text-3xl font-bold text-text-strong">Order Reports Dashboard</h1>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 font-bold text-white shadow-[0_10px_22px_rgba(16,185,129,0.2)] transition hover:bg-brand-600"
          onClick={loadReport}
        >
          <LuRefreshCw size={18} />
          Refresh
        </button>
      </div>

      <Card className="grid gap-4" padding="md">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="grid gap-2 text-sm font-bold text-text-muted">
            From Date
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="min-h-11 rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-muted">
            To Date
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="min-h-11 rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-muted">
            Payment Status
            <select
              name="payment_status"
              value={filters.payment_status}
              onChange={handleFilterChange}
              className="min-h-11 rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
            >
              {paymentStatusOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-muted">
            Order Status
            <select
              name="order_status"
              value={filters.order_status}
              onChange={handleFilterChange}
              className="min-h-11 rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
            >
              {orderStatusOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-text-muted">
            Method
            <select
              name="payment_method"
              value={filters.payment_method}
              onChange={handleFilterChange}
              className="min-h-11 rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
            >
              {paymentMethodOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? formatFilterLabel(option) : "All"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-500 px-4 font-bold text-white"
            onClick={loadReport}
          >
            <LuSearch size={18} />
            Apply
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 font-bold text-text-strong"
            onClick={() => downloadReport(ORDER_REPORTS_EXPORT_PDF, "pdf")}
          >
            <LuFileText size={18} />
            Download PDF
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 font-bold text-text-strong"
            onClick={() => downloadReport(ORDER_REPORTS_EXPORT_EXCEL, "xlsx")}
          >
            <LuFileSpreadsheet size={18} />
            Download Excel
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 font-bold text-text-strong"
            onClick={() => downloadReport(ORDER_REPORTS_EXPORT_CSV, "csv")}
          >
            <LuDownload size={18} />
            Download CSV
          </button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Orders" value={loading ? "..." : summary.total_orders || 0} />
        <StatTile label="Revenue" value={loading ? "..." : formatCurrency(summary.total_revenue)} tone="blue" />
        <StatTile label="COD Pending" value={loading ? "..." : formatCurrency(summary.cod_pending_amount)} tone="amber" />
        <StatTile label="Paid Amount" value={loading ? "..." : formatCurrency(summary.paid_amount)} />
        <StatTile label="Delivered" value={loading ? "..." : summary.total_delivered || 0} tone="blue" />
        <StatTile label="Cancelled" value={loading ? "..." : summary.total_cancelled || 0} tone="rose" />
        <StatTile label="Average Order Value" value={loading ? "..." : formatCurrency(summary.average_order_value)} />
        <StatTile label="Total Tax" value={loading ? "..." : formatCurrency(summary.total_tax_collected)} tone="blue" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Sales Chart</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sales_date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="total_revenue" stroke="#10b981" strokeWidth={3} />
              <Line type="monotone" dataKey="paid_amount" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Hourly Sales Analytics</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={hourlySales} margin={{ top: 12, right: 18, left: 6, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour_label" tickFormatter={renderHourlyTick} minTickGap={18} />
              <YAxis yAxisId="sales" tickFormatter={(value) => formatCurrency(value)} width={74} />
              <YAxis yAxisId="orders" orientation="right" allowDecimals={false} width={44} />
              <Tooltip formatter={formatHourlyMetric} />
              <Legend />
              <Line
                yAxisId="sales"
                type="monotone"
                dataKey="total_sales"
                name="Hourly sales"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="delivered_orders"
                name="Delivered orders"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Top Products</h2>
          {topProductChartData.length > 0 ? (
            <div className="grid min-h-[280px] items-center gap-4 lg:grid-cols-[minmax(160px,0.72fr)_minmax(260px,1.08fr)]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={topProductChartData}
                    dataKey="total_sales"
                    nameKey="item_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={3}
                    stroke="var(--color-surface-panel)"
                    strokeWidth={3}
                  >
                    {topProductChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.item_name}-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid max-h-[260px] content-start gap-2 overflow-y-auto pr-1">
                {topProductChartData.map((product, index) => (
                  <div
                    key={`${product.item_name}-${index}`}
                    className="grid grid-cols-[12px_minmax(0,1fr)] gap-2 rounded-lg border border-border-subtle p-3"
                  >
                    <span
                      className="mt-1 h-3 w-3 rounded-[3px]"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black text-text-strong">
                          {product.item_name}
                        </span>
                        <span className="text-sm font-black text-text-strong">
                          {formatCurrency(product.total_sales)}
                        </span>
                      </div>
                      <p className="m-0 mt-1 text-xs font-semibold text-text-muted">
                        {product.total_quantity} sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-border-subtle text-sm font-semibold text-text-muted">
              No top product analytics available.
            </div>
          )}
        </Card>

        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Payment Analytics</h2>
          {payments?.length > 0 ? (
            <div className="grid min-h-[280px] items-center gap-4 lg:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1fr)]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={payments}
                    dataKey="total_amount"
                    nameKey="payment_status"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="var(--color-surface-panel)"
                    strokeWidth={3}
                  >
                    {payments?.map((entry, index) => (
                      <Cell
                        key={`${entry.payment_status}-${entry.payment_method}`}
                        fill={paymentColors[entry.payment_status] || colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid content-center gap-2">
                {payments?.map((payment, index) => (
                  <div
                    key={`${payment.payment_status}-${index}`}
                    className="grid grid-cols-[12px_minmax(0,1fr)] gap-2 rounded-lg border border-border-subtle p-3"
                  >
                    <span
                      className="mt-1 h-3 w-3 rounded-[3px]"
                      style={{ backgroundColor: paymentColors[payment.payment_status] || colors[index % colors.length] }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black capitalize text-text-strong">
                          {payment.payment_status}
                        </span>
                        <span className="text-sm font-black text-text-strong">
                          {formatCurrency(payment.total_amount)}
                        </span>
                      </div>
                      <p className="m-0 mt-1 text-xs font-semibold text-text-muted">
                        {payment.total_orders} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-border-subtle text-sm font-semibold text-text-muted">
              No payment analytics available.
            </div>
          )}
        </Card>
      </section>

      <Card className="grid gap-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="m-0 text-lg font-bold text-text-strong">Orders Table</h2>
            <div className="text-sm font-semibold text-text-muted">
              Peak: {summary.peak_sales_hour || "-"} - Top Product: {summary.top_selling_product || "-"}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="rounded-lg border border-border-subtle bg-surface-panel px-3 py-2 text-sm font-semibold text-text-muted">
              {filters.payment_method ? `${formatFilterLabel(filters.payment_method)} Orders` : "Total Orders"}
              <span className="ml-2 font-black text-text-strong">{selectedMethodOrderCount}</span>
            </div>
            <label className="grid gap-1 text-sm font-bold text-text-muted">
              Method Filter
              <select
                name="payment_method"
                value={filters.payment_method}
                onChange={handleFilterChange}
                className="min-h-10 min-w-[220px] rounded-lg border border-border-subtle bg-white px-3 text-text-strong"
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option || "all-table"} value={option}>
                    {option ? formatFilterLabel(option) : "All Methods"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--color-border-subtle)]">
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                {/*
                <th className="px-4 py-3">Items</th>
                */}
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map((order) => (
                <tr key={order.id} className="border-b border-border-subtle">
                  <td className="px-4 py-3 font-bold text-text-strong">{order.order_number}</td>
                  <td className="px-4 py-3 text-text-base">{order.customer_name}</td>
                  {/*
                  <td className="max-w-[280px] truncate px-4 py-3 text-text-muted">{order.ordered_items}</td>
                  */}
                  <td className="px-4 py-3 text-text-base">{order.order_status}</td>
                  <td className="px-4 py-3 text-text-base">{order.payment_status}</td>
                  <td className="px-4 py-3 text-text-base">{order.payment_method}</td>
                  <td className="px-4 py-3 text-right font-bold text-text-strong">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              ))}
              {!loading && displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center font-semibold text-text-muted">
                    No orders found for this report range.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="m-0 text-lg font-bold text-text-strong">Order Status Analytics</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statusAnalytics.map((status) => (
            <div key={status.order_status} className="rounded-lg border border-border-subtle p-4">
              <p className="m-0 text-sm font-bold capitalize text-text-muted">{status.order_status}</p>
              <strong className="mt-2 block text-2xl text-text-strong">{status.total_orders}</strong>
              <span className="text-sm font-semibold text-brand-600">{formatCurrency(status.total_amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default OrderReports;
