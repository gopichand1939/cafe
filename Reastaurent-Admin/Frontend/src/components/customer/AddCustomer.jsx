import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import CustomerForm from "./CustomerForm";
import { CUSTOMER_CREATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function AddCustomer() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(CUSTOMER_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to create customer");
      }

      toast.success("Customer created successfully");
      navigate("/customer");
    } catch (error) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <CustomerForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} />;
}

export default AddCustomer;
