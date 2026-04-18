import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import CustomerForm from "./CustomerForm";
import { CUSTOMER_BY_ID, CUSTOMER_UPDATE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedCustomer = useSelector((state) => state.card.customerSelectedItem);
  const [customer, setCustomer] = useState(selectedCustomer);
  const [isLoading, setIsLoading] = useState(!selectedCustomer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Number(selectedCustomer?.id) === Number(id)) {
      setCustomer(selectedCustomer);
      setIsLoading(false);
      return;
    }

    const fetchCustomer = async () => {
      try {
        const response = await fetchWithRefreshToken(CUSTOMER_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch customer");
        }

        setCustomer(data.data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch customer");
        navigate("/customer");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id, navigate, selectedCustomer]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);

    try {
      const response = await fetchWithRefreshToken(CUSTOMER_UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update customer");
      }

      toast.success("Customer updated successfully");
      navigate("/customer");
    } catch (error) {
      toast.error(error.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading customer...</div>;
  }

  return (
    <CustomerForm
      selectedCustomer={customer}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}

export default EditCustomer;
