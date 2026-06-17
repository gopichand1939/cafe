import { useEffect, useMemo, useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "../ui";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import {
  DASHBOARD_CATEGORY_STATS,
  DASHBOARD_VEG_STATS,
  DASHBOARD_ORDER_STATS,
  ORDER_REPORTS_DASHBOARD,
} from "../../Utils/Constant";
import DashboardCharts from "../Dashboard/DashboardCharts";

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

function OrderReports() {
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState([]);
  const [vegStats, setVegStats] = useState([]);
  const [orderStats, setOrderStats] = useState({
    deliveredCount: 0,
    pendingCount: 0,
    todayCount: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [hourlySales, setHourlySales] = useState([]);

  const loadChartsData = async () => {
    setLoading(true);
    try {
      const fromDate = monthsAgo(4);
      const toDate = today();
      const reportsUrl = `${ORDER_REPORTS_DASHBOARD}?from_date=${fromDate}&to_date=${toDate}&limit=200`;

      const [ordersRes, categoriesRes, vegRes, reportsRes] = await Promise.all([
        fetchWithRefreshToken(DASHBOARD_ORDER_STATS, { method: "POST" }),
        fetchWithRefreshToken(DASHBOARD_CATEGORY_STATS, { method: "POST" }),
        fetchWithRefreshToken(DASHBOARD_VEG_STATS, { method: "POST" }),
        fetchWithRefreshToken(reportsUrl, { method: "GET" }),
      ]);

      const ordersData = await ordersRes.json();
      const categoriesData = await categoriesRes.json();
      const vegData = await vegRes.json();
      const reportsData = await reportsRes.json();

      if (ordersData.success) setOrderStats(ordersData.data);
      if (categoriesData.success) setCategoryStats(categoriesData.data);
      if (vegData.success) setVegStats(vegData.data);

      const payload = reportsData?.data || reportsData || {};
      if (Array.isArray(payload.dailySales)) {
        setDailySales(payload.dailySales);
      }
      if (Array.isArray(payload.hourlySales)) {
        setHourlySales(payload.hourlySales);
      }
    } catch (error) {
      console.error("Failed to load dashboard charts data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChartsData();
  }, []);

  const barChartData = useMemo(() => [
    { name: "Today", count: orderStats.todayCount, fill: "#10b981" },
    { name: "Pending", count: orderStats.pendingCount, fill: "#f59e0b" },
    { name: "Delivered", count: orderStats.deliveredCount, fill: "#3b82f6" },
  ], [orderStats]);

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
          onClick={loadChartsData}
        >
          <LuRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-[18px] grid gap-[24px]">
          <div className="grid gap-[18px] lg:grid-cols-2">
            <Card className="h-[360px] animate-pulse bg-surface-muted/30" />
            <Card className="h-[360px] animate-pulse bg-surface-muted/30" />
            <Card className="col-span-full h-[380px] animate-pulse bg-surface-muted/30" />
            <Card className="col-span-full h-[360px] animate-pulse bg-surface-muted/30" />
          </div>
        </div>
      ) : (
        <div className="mt-[18px] grid gap-[24px]">
          <DashboardCharts
            categoryStats={categoryStats}
            vegStats={vegStats}
            barChartData={barChartData}
          />

          <div className="grid gap-4 xl:grid-cols-2">
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
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderReports;
