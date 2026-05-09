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

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

const today = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const buildUrl = (baseUrl, filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return `${baseUrl}?${params.toString()}`;
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
      <strong className="mt-2 block text-2xl leading-tight text-text-strong">{value}</strong>
    </div>
  );
}

function OrderReports() {
  const [filters, setFilters] = useState({
    from_date: today(),
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

      setReport(data.data);
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
  const payments = report?.payments || [];
  const topProducts = report?.topProducts || [];
  const hourlySales = report?.hourlySales || [];
  const dailySales = report?.dailySales || [];
  const statusAnalytics = report?.statusAnalytics || [];

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
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-text-strong px-4 font-bold text-white"
          onClick={loadReport}
        >
          <LuRefreshCw size={18} />
          Refresh
        </button>
      </div>

      <Card className="grid gap-4" padding="md">
        <div className="grid gap-3 md:grid-cols-4">
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
            <BarChart data={hourlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour_label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total_sales" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Top Products</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="item_name" type="category" width={130} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="total_sales" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="grid min-h-[360px] gap-4">
          <h2 className="m-0 text-lg font-bold text-text-strong">Payment Analytics</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={payments}
                dataKey="total_amount"
                nameKey="payment_status"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={3}
              >
                {payments.map((entry, index) => (
                  <Cell key={`${entry.payment_status}-${entry.payment_method}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <Card className="grid gap-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-bold text-text-strong">Orders Table</h2>
          <div className="text-sm font-semibold text-text-muted">
            Peak: {summary.peak_sales_hour || "-"} - Top Product: {summary.top_selling_product || "-"}
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--color-border-subtle)]">
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border-subtle">
                  <td className="px-4 py-3 font-bold text-text-strong">{order.order_number}</td>
                  <td className="px-4 py-3 text-text-base">{order.customer_name}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-text-muted">{order.ordered_items}</td>
                  <td className="px-4 py-3 text-text-base">{order.order_status}</td>
                  <td className="px-4 py-3 text-text-base">{order.payment_status}</td>
                  <td className="px-4 py-3 text-text-base">{order.payment_method}</td>
                  <td className="px-4 py-3 text-right font-bold text-text-strong">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center font-semibold text-text-muted">
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
