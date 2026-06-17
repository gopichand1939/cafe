import { useEffect, useState, lazy, Suspense } from "react";
import {
  LuTrendingUp,
  LuTimer,
  LuLayers,
  LuPackage,
} from "react-icons/lu";
import { Card } from "../ui";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import {
  DASHBOARD_SUMMARY,
  DASHBOARD_ORDER_STATS,
} from "../../Utils/Constant";

// Lazy load the reports section component (heavy)
const DashboardReportsSection = lazy(() => import("./DashboardReportsSection"));

const accentClassMap = {
  success: "text-brand-600 bg-brand-500/15",
  warning: "text-accent-600 bg-accent-500/15",
  info: "text-sky-600 bg-sky-500/15",
  neutral: "text-violet-600 bg-violet-500/15",
};

function StatCard({ title, value, note, accent, loading, Icon }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-[0.88rem] font-bold text-text-muted leading-tight">{title}</span>
      <div className="flex items-center gap-2.5 mt-1 min-w-0">
        <div
          className={`grid h-[32px] w-[32px] shrink-0 place-items-center rounded-lg ${accentClassMap[accent] || "bg-brand-500/15 text-brand-600"}`}
        >
          <Icon size={18} />
        </div>
        {loading ? (
          <div className="h-6 w-16 animate-pulse rounded-md bg-surface-muted" />
        ) : (
          <strong className="text-[1.6rem] leading-none text-text-strong font-black shrink-0">{value}</strong>
        )}
        <span className="text-[0.82rem] font-semibold text-text-muted leading-tight truncate">{note}</span>
      </div>
    </Card>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalItems: 0, totalCategories: 0 });
  const [orderStats, setOrderStats] = useState({
    deliveredCount: 0,
    pendingCount: 0,
    todayCount: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          fetchWithRefreshToken(DASHBOARD_SUMMARY, { method: "POST" }),
          fetchWithRefreshToken(DASHBOARD_ORDER_STATS, { method: "POST" }),
        ]);

        const summaryData = await summaryRes.json();
        const ordersData = await ordersRes.json();

        if (summaryData.success) setSummary(summaryData.data);
        if (ordersData.success) setOrderStats(ordersData.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  return (
    <div className="ui-page content-start">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
        <StatCard
          title="Daily Volume"
          value={orderStats.todayCount}
          note="Orders received today."
          accent="success"
          loading={loading}
          Icon={LuTrendingUp}
        />
        <StatCard
          title="Pending Orders"
          value={orderStats.pendingCount}
          note="Active orders in pipeline."
          accent="warning"
          loading={loading}
          Icon={LuTimer}
        />
        <StatCard
          title="Menu Categories"
          value={summary.totalCategories}
          note="Structured categories."
          accent="info"
          loading={loading}
          Icon={LuLayers}
        />
        <StatCard
          title="Total Items"
          value={summary.totalItems}
          note="Cataloged items."
          accent="neutral"
          loading={loading}
          Icon={LuPackage}
        />
      </section>

      <Suspense fallback={
        <div className="mt-3 grid gap-[24px]">
          <div className="grid gap-4 border-t border-border-subtle pt-3">
            <Card className="h-[160px] animate-pulse bg-surface-muted/30" />
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="h-[360px] animate-pulse bg-surface-muted/30" />
              <Card className="h-[360px] animate-pulse bg-surface-muted/30" />
            </div>
          </div>
        </div>
      }>
        {!loading ? (
          <div className="mt-3 grid gap-[24px]">
            <section className="border-t border-border-subtle pt-3">
              <DashboardReportsSection />
            </section>
          </div>
        ) : null}
      </Suspense>
    </div>
  );
}

export default Dashboard;
