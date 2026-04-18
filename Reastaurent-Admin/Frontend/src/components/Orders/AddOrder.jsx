import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OrderForm from "./OrderForm";
import { ORDER_CREATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function AddOrder() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(ORDER_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to create order");
      }

      toast.success("Order created successfully");
      navigate("/orders");
    } catch (error) {
      toast.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <OrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}

export default AddOrder;
