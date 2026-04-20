import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ORDER_LIST,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../common/StatusPill";
import Table from "../Table";
import ActionPopover from "../ActionPopover";
import {
  setOrderData,
  setOrderSelectedItem,
} from "../../Redux/CardSlice";
import { subscribeToAdminRealtimeEvent, ADMIN_REALTIME_EVENT_TYPES } from "../../realtime/adminRealtimeEvents";

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

const truncateValue = (value, maxLength = 18) => {
  const normalized = String(value || "-");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}...`;
};

const renderCompactText = (value, maxLength = 18, className = "") => (
  <span
    className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${className}`}
    title={String(value || "-")}
  >
    {truncateValue(value, maxLength)}
  </span>
);

const parseOrderedItems = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const renderMethodPill = (method = "") => {
  const normalizedMethod = String(method || "unknown").toLowerCase();
  const toneClassName =
    normalizedMethod === "stripe"
      ? "bg-sky-100 text-sky-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex min-w-[108px] items-center justify-center rounded-full px-3 py-1.5 text-[0.8rem] font-bold ${toneClassName}`}
    >
      {normalizedMethod.replace(/_/g, " ")}
    </span>
  );
};

const renderPaymentFlowPill = (paymentStatus = "") => {
  const isPaid = String(paymentStatus || "").toLowerCase() === "paid";

  return (
    <span
      className={`inline-flex min-w-[132px] items-center justify-center rounded-full px-3 py-1.5 text-[0.8rem] font-bold ${
        isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {isPaid ? "Payment Success" : "Order Pending"}
    </span>
  );
};

function Order() {
  const NEW_ORDER_HIGHLIGHT_MS = 30000;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [highlightedOrderIds, setHighlightedOrderIds] = useState([]);

  const highlightOrder = (orderId) => {
    if (!orderId) {
      return;
    }

    setHighlightedOrderIds((prev) => [...new Set([...prev, Number(orderId)])]);

    window.setTimeout(() => {
      setHighlightedOrderIds((prev) => prev.filter((value) => value !== Number(orderId)));
    }, NEW_ORDER_HIGHLIGHT_MS);
  };

  const applyRealtimeOrderChange = (change) => {
    const action = String(change?.action || "").toLowerCase();
    const realtimeOrder = change?.entityData || null;
    const targetOrderId = Number(change?.orderId || change?.entityId || realtimeOrder?.id || 0);

    if (!targetOrderId) {
      return;
    }

    if (action === "created" && realtimeOrder) {
      setTotalCount((prev) => prev + 1);
      setData((prev) => {
        const nextData = [
          realtimeOrder,
          ...prev.filter((item) => Number(item.id) !== targetOrderId),
        ].slice(0, pageSize);

        dispatch(setOrderData(nextData));
        return nextData;
      });
      return;
    }

    if (action === "updated" && realtimeOrder) {
      setData((prev) => {
        const nextData = prev.map((item) =>
          Number(item.id) === targetOrderId ? { ...item, ...realtimeOrder } : item
        );

        dispatch(setOrderData(nextData));
        return nextData;
      });
      return;
    }

    if (action === "deleted") {
      setTotalCount((prev) => Math.max(prev - 1, 0));
      setData((prev) => {
        const nextData = prev.filter((item) => Number(item.id) !== targetOrderId);

        dispatch(setOrderData(nextData));
        return nextData;
      });
    }
  };

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(ORDER_LIST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, limit }),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch orders");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
      dispatch(setOrderData(responseData.data || []));
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    return subscribeToAdminRealtimeEvent(
      ADMIN_REALTIME_EVENT_TYPES.ORDER_UPDATED,
      (change) => {
        const targetOrderId = change?.orderId || change?.entityId || null;

        if (change?.action === "created" && targetOrderId) {
          highlightOrder(targetOrderId);
          applyRealtimeOrderChange(change);
          setCurrentPage(1);
          fetchData(1, pageSize);
          return;
        }

        if (targetOrderId) {
          highlightOrder(targetOrderId);
        }

        applyRealtimeOrderChange(change);
        fetchData(currentPage, pageSize);
      }
    );
  }, [currentPage, pageSize]);

  const handleRowAction = (rowData, target) => {
    dispatch(setOrderSelectedItem(rowData));
    navigate(target(rowData.id));
  };

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

  const headers = [
    { key: "id", label: "Id", width: "45px" },
    {
      key: "order_number",
      label: "Order Number",
      width: "145px",
      content: (item) => renderCompactText(item.order_number, 18, "font-semibold"),
    },
    {
      key: "payment_flow",
      label: "Payment Flow",
      width: "145px",
      content: (item) => renderPaymentFlowPill(item.payment_status),
    },
    {
      key: "customer_name",
      label: "Customer Name",
      width: "170px",
      content: (item) => renderCompactText(item.customer_name, 22),
    },
    { key: "customer_phone", label: "Phone", width: "120px" },
    {
      key: "item_count",
      label: "Items",
      width: "70px",
    },
    {
      key: "ordered_items",
      label: "Ordered Items",
      width: "280px",
      content: (item) => {
        const orderedItems = parseOrderedItems(item.ordered_items);

        if (orderedItems.length === 0) {
          return <span className="text-sm text-slate-500">-</span>;
        }

        return (
          <div className="grid justify-items-start gap-1 text-left">
            {orderedItems.map((orderedItem, index) => (
              <span
                key={`${item.id}-ordered-item-${index}`}
                className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-1 text-[0.75rem] font-semibold text-brand-700"
                title={orderedItem}
              >
                {orderedItem}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "payment_method",
      label: "Payment Method",
      width: "120px",
      content: (item) => renderMethodPill(item.payment_method),
    },
    {
      key: "subtotal_amount",
      label: "Subtotal",
      width: "110px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.subtotal_amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "discount_amount",
      label: "Discount",
      width: "110px",
      content: (item) => (
        <span className="font-semibold text-emerald-700">
          {formatCurrency(item.discount_amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "addon_amount",
      label: "Addons",
      width: "100px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.addon_amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "tax_amount",
      label: "Tax",
      width: "90px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.tax_amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "delivery_fee",
      label: "Delivery",
      width: "100px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.delivery_fee, item.currency_code)}
        </span>
      ),
    },
    {
      key: "total_amount",
      label: "Total",
      width: "110px",
      content: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.total_amount, item.currency_code)}
        </span>
      ),
    },
    {
      key: "order_status",
      label: "Order Status",
      width: "95px",
      content: (item) => <StatusPill active={item.order_status !== "cancelled"} label={item.order_status} />,
    },
    {
      key: "payment_status",
      label: "Payment Status",
      width: "95px",
      content: (item) => <StatusPill active={item.payment_status === "paid"} label={item.payment_status} />,
    },
    {
      key: "order_notes",
      label: "Order Notes",
      width: "180px",
      content: (item) => renderCompactText(item.order_notes || "-", 24),
    },
    {
      key: "created_at",
      label: "Created At",
      width: "150px",
      content: (item) => new Date(item.created_at).toLocaleString(),
    },
    {
      key: "updated_at",
      label: "Updated At",
      width: "150px",
      content: (item) => new Date(item.updated_at).toLocaleString(),
    },
    {
      key: "actions",
      label: "Actions",
      width: "70px",
      sticky: true,
      content: (rowData) => (
        <button
          type="button"
          className="h-9 w-9 rounded-[8px] border-0 bg-transparent text-[1.3rem] font-extrabold text-blue-600"
          onClick={(event) => handleOpenActions(event, rowData)}
        >
          ...
        </button>
      ),
    },
  ];

  return (
    <div className="grid min-h-0 content-start gap-[18px]">
      <section className="min-h-0 overflow-hidden rounded-[8px] border border-[#d8ece3] bg-[#e7f7f0] p-[10px]">
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 px-[6px] pb-2 pt-1">
          <button
            className="min-w-[92px] rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white"
            onClick={() => navigate("/addorder")}
          >
            Add
          </button>
          <div className="flex items-center gap-[10px] font-semibold text-slate-500">
            <span>Home</span>
            <span>/</span>
            <strong className="text-[#3f9773]">Orders</strong>
          </div>
        </div>

        <Table
          data={data}
          headers={headers}
          loading={loading}
          searchPlaceholder="Search..."
          totalRowsLabel="Total Rows"
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalItems={totalCount}
          getRowClassName={(item) =>
            highlightedOrderIds.includes(Number(item.id))
              ? "shadow-[inset_0_0_0_2px_rgba(249,115,22,0.24)]"
              : ""
          }
          getRowCellClassName={(item) =>
            highlightedOrderIds.includes(Number(item.id))
              ? "bg-[linear-gradient(90deg,rgba(255,247,237,0.98)_0%,rgba(255,237,213,0.98)_100%)] animate-pulse"
              : "hover:bg-[#f8fcfa]"
          }
        />
      </section>

      <ActionPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        handleClose={handleCloseActions}
        selectedRow={selectedRow}
        onEdit={() => handleRowAction(selectedRow, (value) => `/editorder/${value}`)}
        onView={() => handleRowAction(selectedRow, (value) => `/vieworder/${value}`)}
        onDelete={() => handleRowAction(selectedRow, (value) => `/deleteorder/${value}`)}
      />
    </div>
  );
}

export default Order;
