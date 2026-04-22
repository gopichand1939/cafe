import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  PAYMENT_LIST,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import {
  setPaymentData,
  setPaymentSelectedItem,
} from "../../Redux/CardSlice";
import {
  subscribeToAdminRealtimeEvent,
  ADMIN_REALTIME_EVENT_TYPES,
} from "../../realtime/adminRealtimeEvents";
import ActionPopover from "../ActionPopover";
import Table from "../Table";
import { Button } from "../ui";

const NEW_PAYMENT_HIGHLIGHT_MS = 30000;

const formatCurrency = (value, currencyCode = "INR") => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (_error) {
    return `${currencyCode || "INR"} ${amount.toFixed(2)}`;
  }
};

const renderPill = (label, tone = "neutral") => {
  const toneClassMap = {
    success: "bg-emerald-500/15 text-emerald-300",
    warning: "bg-amber-500/15 text-amber-300",
    danger: "bg-rose-500/15 text-rose-300",
    info: "bg-sky-500/15 text-sky-300",
    neutral: "bg-slate-700/60 text-slate-200",
  };

  return (
    <span
      className={`inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-1.5 text-[0.82rem] font-bold ${
        toneClassMap[tone] || toneClassMap.neutral
      }`}
    >
      {label}
    </span>
  );
};

const getPaymentStatusTone = (payment) => {
  if (Number(payment?.is_payment_success) === 1) {
    return "success";
  }

  const normalizedStatus = String(payment?.status || "").toLowerCase();

  if (normalizedStatus.includes("fail")) {
    return "danger";
  }

  if (normalizedStatus.includes("paid") || normalizedStatus.includes("captur")) {
    return "info";
  }

  return "warning";
};

const normalizeOptionValue = (value) => String(value || "").trim();
const formatNullable = (value) => (value === null || value === undefined || value === "" ? "-" : value);
const formatJsonPreview = (value) => {
  const serialized = JSON.stringify(value || {});
  return serialized === "{}" ? "-" : serialized;
};
const truncateValue = (value, maxLength = 18) => {
  const normalized = formatNullable(value);

  if (normalized === "-" || String(normalized).length <= maxLength) {
    return normalized;
  }

  return `${String(normalized).slice(0, maxLength - 1)}...`;
};

const renderCompactText = (value, maxLength = 18, extraClassName = "") => {
  const fullValue = formatNullable(value);

  return (
    <span
      className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${extraClassName}`}
      title={fullValue}
    >
      {truncateValue(fullValue, maxLength)}
    </span>
  );
};

function Payment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [highlightedPaymentIds, setHighlightedPaymentIds] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    gateway: "",
    is_payment_success: "",
  });

  const highlightPayment = (paymentId) => {
    if (!paymentId) {
      return;
    }

    setHighlightedPaymentIds((prev) => [...new Set([...prev, Number(paymentId)])]);

    window.setTimeout(() => {
      setHighlightedPaymentIds((prev) =>
        prev.filter((value) => value !== Number(paymentId))
      );
    }, NEW_PAYMENT_HIGHLIGHT_MS);
  };

  const fetchPayments = async (page = 1, limit = 10, activeFilters = filters) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(PAYMENT_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          limit,
          status: activeFilters.status,
          gateway: activeFilters.gateway,
          is_payment_success: activeFilters.is_payment_success,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch payments");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setPaymentData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    return subscribeToAdminRealtimeEvent(
      ADMIN_REALTIME_EVENT_TYPES.PAYMENT_UPDATED,
      (change) => {
        const targetPaymentId =
          change?.paymentId || change?.entityId || change?.entityData?.id || null;

        if (targetPaymentId) {
          highlightPayment(targetPaymentId);
        }

        fetchPayments(currentPage, pageSize, filters);
      }
    );
  }, [currentPage, pageSize, filters]);

  const handlePageChange = (page, nextPageSize) => {
    setCurrentPage(page);
    setPageSize(nextPageSize);
  };

  const handleOpenActions = (event, rowData) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowData);
  };

  const handleCloseActions = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleViewPayment = (rowData) => {
    dispatch(setPaymentSelectedItem(rowData));
    navigate(`/viewpayment/${rowData.id}`);
  };

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    setFilters({
      status: "",
      gateway: "",
      is_payment_success: "",
    });
  };

  const statusOptions = useMemo(
    () =>
      [...new Set(data.map((item) => normalizeOptionValue(item.status)).filter(Boolean))].sort(),
    [data]
  );

  const headers = [
    {
      key: "order_number",
      label: "Order ID",
      width: "150px",
      content: (item) =>
        renderCompactText(item.order_number, 18, "font-semibold"),
    },
    {
      key: "rrn",
      label: "RRN Number",
      width: "180px",
      content: (item) =>
        renderCompactText(item.rrn, 22, "font-mono text-[0.84rem]"),
    },
    {
      key: "customer_name",
      label: "Customer",
      width: "160px",
      content: (item) => renderCompactText(item.customer_name, 18),
    },
    {
      key: "transaction_id",
      label: "Transaction",
      width: "170px",
      content: (item) =>
        renderCompactText(item.transaction_id, 22, "font-mono text-[0.84rem]"),
    },
    {
      key: "amount",
      label: "Amount",
      width: "110px",
      content: (item) => (
        <span className="font-semibold text-text-strong">
          {formatCurrency(item.amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      width: "130px",
      content: (item) =>
        renderPill(
          Number(item.is_payment_success) === 1 ? "Success" : "Pending",
          getPaymentStatusTone(item)
        ),
    },
    {
      key: "created_at",
      label: "Date",
      width: "110px",
      content: (item) =>
        new Date(item.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }),
    },
    {
      key: "customer_phone",
      label: "Phone",
      width: "110px",
      content: (item) => renderCompactText(item.customer_phone, 14),
    },
    {
      key: "customer_email",
      label: "Email",
      width: "180px",
      content: (item) => renderCompactText(item.customer_email, 22),
    },
    {
      key: "payment_method",
      label: "Method",
      width: "100px",
      content: (item) => renderCompactText(item.payment_method, 12),
    },
    {
      key: "failure_message",
      label: "Issue",
      width: "150px",
      content: (item) =>
        renderCompactText(item.failure_message || item.status, 18),
    },
    {
      key: "updated_at",
      label: "Updated",
      width: "136px",
      content: (item) => new Date(item.updated_at).toLocaleString(),
    },
    {
      key: "metadata",
      label: "Metadata",
      width: "88px",
      content: (item) => renderCompactText(formatJsonPreview(item.metadata), 10),
    },
    {
      key: "raw_event",
      label: "Raw Event",
      width: "88px",
      content: (item) => renderCompactText(formatJsonPreview(item.raw_event), 10),
    },
    {
      key: "id",
      label: "Id",
      width: "52px",
      content: (item) => item.id,
    },
    {
      key: "order_id",
      label: "Order Ref",
      width: "80px",
      content: (item) => item.order_id ?? "-",
    },
    {
      key: "customer_id",
      label: "Cust Ref",
      width: "80px",
      content: (item) => item.customer_id ?? "-",
    },
    {
      key: "currency_code",
      label: "Cur",
      width: "60px",
      content: (item) => item.currency_code ?? "-",
    },
    {
      key: "amount_in_paise",
      label: "Paise",
      width: "82px",
      content: (item) => item.amount_in_paise ?? "-",
    },
    {
      key: "provider_payment_id",
      label: "Provider Payment Id",
      width: "150px",
      content: (item) =>
        renderCompactText(item.provider_payment_id, 20, "font-mono text-[0.84rem]"),
    },
    {
      key: "provider_charge_id",
      label: "Provider Charge Id",
      width: "150px",
      content: (item) =>
        renderCompactText(item.provider_charge_id, 20, "font-mono text-[0.84rem]"),
    },
    {
      key: "provider_balance_transaction_id",
      label: "Balance Transaction Id",
      width: "155px",
      content: (item) =>
        renderCompactText(
          item.provider_balance_transaction_id,
          20,
          "font-mono text-[0.84rem]"
        ),
    },
    {
      key: "failure_code",
      label: "Failure Code",
      width: "110px",
      content: (item) => renderCompactText(item.failure_code, 14),
    },
    {
      key: "paid_at",
      label: "Paid At",
      width: "136px",
      content: (item) =>
        item.paid_at ? new Date(item.paid_at).toLocaleString() : "-",
    },
    {
      key: "full_status",
      label: "Gateway Status",
      width: "150px",
      content: (item) => renderCompactText(item.status, 20),
    },
    {
      key: "full_result",
      label: "Result Raw",
      width: "90px",
      content: (item) => (Number(item.is_payment_success) === 1 ? "1" : "0"),
    },
    {
      key: "actions",
      label: "Actions",
      width: "70px",
      sticky: true,
      content: (rowData) => (
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border-0 bg-transparent text-[1.4rem] font-black text-brand-500 transition-colors hover:bg-surface-panel"
          onClick={(event) => handleOpenActions(event, rowData)}
        >
          ...
        </button>
      ),
    },
  ];

  const filterToolbar = (
    <>
      <label className="grid min-w-[88px] max-w-[88px] gap-1">
        <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-text-muted">
          Status
        </span>
        <select
          value={filters.status}
          onChange={(event) => handleFilterChange("status", event.target.value)}
          className="ui-input-base h-10 min-w-[88px] max-w-[88px] rounded-xl px-2 text-[0.76rem]"
        >
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="grid min-w-[88px] max-w-[88px] gap-1">
        <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-text-muted">
          Result
        </span>
        <select
          value={filters.is_payment_success}
          onChange={(event) =>
            handleFilterChange("is_payment_success", event.target.value)
          }
          className="ui-input-base h-10 min-w-[88px] max-w-[88px] rounded-xl px-2 text-[0.76rem]"
        >
          <option value="">All</option>
          <option value="1">Success</option>
          <option value="0">Failed</option>
        </select>
      </label>

      <Button
        variant="ghost"
        onClick={handleResetFilters}
        className="mt-[18px] h-10 min-w-[80px] shrink-0 rounded-xl px-3 text-[0.82rem]"
      >
        Reset
      </Button>
    </>
  );

  return (
    <div className="grid min-h-0 content-start gap-[18px]">
      <section className="min-h-0 overflow-hidden rounded-[8px] border border-border-subtle bg-surface-panel p-[10px]">
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 px-[6px] pb-2 pt-1">
          <div className="grid gap-0.5">
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">
              Finance
            </p>
            <h2 className="m-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1] text-text-strong">
              Payments
            </h2>
          </div>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-brand-500">Payments</strong>
          </div>
        </div>

        <Table
          data={data}
          headers={headers}
          toolbarContent={filterToolbar}
          compactToolbar
          loading={loading}
          searchPlaceholder="Search current page..."
          totalRowsLabel="Total Payments"
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalItems={totalCount}
          getRowClassName={(item) =>
            highlightedPaymentIds.includes(Number(item.id))
              ? "shadow-[inset_0_0_0_2px_rgba(14,165,233,0.18)]"
              : ""
          }
          getRowCellClassName={(item) =>
            highlightedPaymentIds.includes(Number(item.id))
              ? "bg-sky-500/10 animate-pulse"
              : ""
          }
        />
      </section>

      <ActionPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleClose={handleCloseActions}
        selectedRow={selectedRow}
        hideEdit
        hideDelete
        onView={() => handleViewPayment(selectedRow)}
      />
    </div>
  );
}

export default Payment;
