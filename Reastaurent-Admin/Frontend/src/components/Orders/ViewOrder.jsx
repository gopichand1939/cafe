import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ORDER_BY_ID } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setOrderSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";
import { Card } from "../ui";

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

function ViewOrder() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedOrder = useSelector((state) => state.card.orderSelectedItem);
  const [order, setOrder] = useState(selectedOrder);

  useEffect(() => {
    if (Number(selectedOrder?.id) === Number(id) && selectedOrder?.items) {
      setOrder(selectedOrder);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetchWithRefreshToken(ORDER_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch order");
        }

        setOrder(data.data);
        dispatch(setOrderSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch order");
        navigate("/orders");
      }
    };

    fetchOrder();
  }, [dispatch, id, navigate, selectedOrder]);

  if (!order) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading order...</div>;
  }

  const displayData = {
    id: order.id,
    order_number: order.order_number || "-",
    customer_name: order.customer_name || "-",
    customer_email: order.customer_email || "-",
    customer_phone: order.customer_phone || "-",
    order_status: order.order_status || "-",
    payment_status: order.payment_status || "-",
    payment_method: order.payment_method || "-",
    currency_code: order.currency_code || "-",
    item_count: order.item_count || 0,
    subtotal_amount: formatCurrency(order.subtotal_amount, order.currency_code),
    discount_amount: formatCurrency(order.discount_amount, order.currency_code),
    addon_amount: formatCurrency(order.addon_amount, order.currency_code),
    tax_amount: formatCurrency(order.tax_amount, order.currency_code),
    delivery_fee: formatCurrency(order.delivery_fee, order.currency_code),
    total_amount: formatCurrency(order.total_amount, order.currency_code),
    order_notes: order.order_notes || "-",
    created_at: new Date(order.created_at).toLocaleString(),
    updated_at: new Date(order.updated_at).toLocaleString(),
    delivery_address: JSON.stringify(order.delivery_address || {}, null, 2),
  };

  const fields = [
    { key: "id", label: "Id" },
    { key: "order_number", label: "Order Number" },
    { key: "customer_name", label: "Customer Name" },
    { key: "customer_email", label: "Customer Email" },
    { key: "customer_phone", label: "Customer Phone" },
    { key: "order_status", label: "Order Status" },
    { key: "payment_status", label: "Payment Status" },
    { key: "payment_method", label: "Payment Method" },
    { key: "currency_code", label: "Currency" },
    { key: "item_count", label: "Item Count" },
    { key: "subtotal_amount", label: "Subtotal" },
    { key: "discount_amount", label: "Discount" },
    { key: "addon_amount", label: "Addon Amount" },
    { key: "tax_amount", label: "Tax Amount" },
    { key: "delivery_fee", label: "Delivery Fee" },
    { key: "total_amount", label: "Total Amount" },
    { key: "order_notes", label: "Order Notes", fullWidth: true },
    {
      key: "delivery_address",
      label: "Delivery Address",
      fullWidth: true,
      render: (data) => (
        <pre className="m-0 whitespace-pre-wrap text-sm">{data.delivery_address}</pre>
      ),
    },
    {
      key: "order_items",
      label: "Items",
      fullWidth: true,
      render: () => (
        <div className="grid gap-3">
          {(order.items || []).length === 0 ? (
            <span className="text-sm text-slate-500">No items found</span>
          ) : (
            (order.items || []).map((item, index) => (
              <Card
                key={item.id || `${item.item_id}-${index}`}
                tone="subtle"
                padding="sm"
                className="grid gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[1rem] font-bold text-text-strong">
                      {item.item_name || "Item"}
                    </div>
                    <div className="text-sm text-text-muted">
                      {item.item_description || "No description"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-text-muted">
                      Qty: {item.quantity || 0}
                    </div>
                    <div className="text-[1rem] font-bold text-text-strong">
                      {formatCurrency(item.line_total, order.currency_code)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="text-sm text-text-base">
                    <span className="font-semibold text-text-muted">Unit:</span>{" "}
                    {formatCurrency(item.unit_price, order.currency_code)}
                  </div>
                  <div className="text-sm text-text-base">
                    <span className="font-semibold text-text-muted">Discount:</span>{" "}
                    {item.discount_price !== null && item.discount_price !== undefined
                      ? formatCurrency(item.discount_price, order.currency_code)
                      : "-"}
                  </div>
                  <div className="text-sm text-text-base">
                    <span className="font-semibold text-text-muted">Final Unit:</span>{" "}
                    {formatCurrency(item.final_unit_price, order.currency_code)}
                  </div>
                  <div className="text-sm text-text-base">
                    <span className="font-semibold text-text-muted">Addon:</span>{" "}
                    {formatCurrency(item.addon_amount, order.currency_code)}
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-text-muted">
                    Selected Addons
                  </div>
                  {(item.selected_addons || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.selected_addons.map((addon, addonIndex) => (
                        <span
                          key={`${addon.id || addon.addon_name || "addon"}-${addonIndex}`}
                          className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-[0.8rem] font-semibold text-brand-700"
                        >
                          {addon.addon_name || "Addon"}{" "}
                          {addon.addon_price
                            ? `(${formatCurrency(addon.addon_price, order.currency_code)})`
                            : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">No addons selected</span>
                  )}
                </div>

                {item.item_notes ? (
                  <div className="text-sm text-text-base">
                    <span className="font-semibold text-text-muted">Item Notes:</span>{" "}
                    {item.item_notes}
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Orders</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">View Order</h2>
        </div>
        <button className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/orders")}>
          Back
        </button>
      </div>

      <div className="mt-[18px] rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="mt-5 grid items-start gap-[22px]">
          <div className="grid min-w-0 max-w-[860px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} fields={fields} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOrder;
