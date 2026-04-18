import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ORDER_BY_ID } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setOrderSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";

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
    item_count: order.item_count || 0,
    subtotal_amount: Number(order.subtotal_amount || 0).toFixed(2),
    discount_amount: Number(order.discount_amount || 0).toFixed(2),
    addon_amount: Number(order.addon_amount || 0).toFixed(2),
    tax_amount: Number(order.tax_amount || 0).toFixed(2),
    delivery_fee: Number(order.delivery_fee || 0).toFixed(2),
    total_amount: Number(order.total_amount || 0).toFixed(2),
    order_notes: order.order_notes || "-",
    created_at: new Date(order.created_at).toLocaleString(),
    updated_at: new Date(order.updated_at).toLocaleString(),
    delivery_address: JSON.stringify(order.delivery_address || {}, null, 2),
    items: (order.items || [])
      .map(
        (item) =>
          `${item.item_name} x${item.quantity} - ${Number(item.line_total || 0).toFixed(2)}`
      )
      .join("\n") || "-",
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
      key: "items",
      label: "Items",
      fullWidth: true,
      render: (data) => (
        <pre className="m-0 whitespace-pre-wrap text-sm">{data.items}</pre>
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
