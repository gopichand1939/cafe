import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ORDER_BY_ID,
  ORDER_DELETE,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setOrderSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";
import { Button, Card, PageSection } from "../ui";

function DeleteOrder() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedOrder = useSelector((state) => state.card.orderSelectedItem);
  const [order, setOrder] = useState(selectedOrder);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (Number(selectedOrder?.id) === Number(id)) {
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

  const handleDelete = async () => {
    if (!order?.id) {
      toast.error("No order selected");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetchWithRefreshToken(ORDER_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: order.id }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete order");
      }

      toast.success("Order deleted successfully");
      navigate("/orders");
    } catch (error) {
      toast.error(error.message || "Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!order) {
    return <Card>Loading order...</Card>;
  }

  const displayData = {
    id: order.id,
    order_number: order.order_number || "-",
    customer_name: order.customer_name || "-",
    customer_phone: order.customer_phone || "-",
    order_status: order.order_status || "-",
    payment_status: order.payment_status || "-",
    total_amount: Number(order.total_amount || 0).toFixed(2),
    created_at: new Date(order.created_at).toLocaleString(),
    updated_at: new Date(order.updated_at).toLocaleString(),
  };

  return (
    <div className="ui-page">
      <PageSection
        eyebrow="Orders"
        title="Delete Order"
        subtitle="Use the centralized danger action below if you want to remove this order record."
        actions={<Button variant="secondary" onClick={() => navigate("/orders")}>Back</Button>}
      />

      <Card tone="danger" className="mt-0">
        <div className="mt-5 grid items-start gap-[22px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} />
          </div>
        </div>
      </Card>

      <div className="mt-0.5 flex flex-wrap gap-2.5">
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/orders")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default DeleteOrder;
