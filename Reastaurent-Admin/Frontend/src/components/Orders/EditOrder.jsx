import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import OrderForm from "./OrderForm";
import {
  ORDER_BY_ID,
  ORDER_UPDATE_STATUS,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function EditOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedOrder = useSelector((state) => state.card.orderSelectedItem);
  const [order, setOrder] = useState(selectedOrder);
  const [isLoading, setIsLoading] = useState(!selectedOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedOrder?.id) === Number(id)) {
      setOrder(selectedOrder);
      setIsLoading(false);
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
      } catch (error) {
        toast.error(error.message || "Failed to fetch order");
        navigate("/orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, selectedOrder]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(ORDER_UPDATE_STATUS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update order");
      }

      toast.success("Order updated successfully");
      navigate("/orders");
    } catch (error) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading order...</div>;
  }

  return (
    <OrderForm
      initialValues={order}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      mode="edit"
    />
  );
}

export default EditOrder;
