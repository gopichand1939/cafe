import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CUSTOMER_BY_ID, CUSTOMER_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setCustomerSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";
import { Button, Card, PageSection } from "../ui";

function DeleteCustomer() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedCustomer = useSelector((state) => state.card.customerSelectedItem);
  const [customer, setCustomer] = useState(selectedCustomer);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (Number(selectedCustomer?.id) === Number(id)) {
      setCustomer(selectedCustomer);
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
        dispatch(setCustomerSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch customer");
        navigate("/customer");
      }
    };

    fetchCustomer();
  }, [dispatch, id, navigate, selectedCustomer]);

  const handleDelete = async () => {
    if (!customer?.id) {
      toast.error("No customer selected");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetchWithRefreshToken(CUSTOMER_DELETE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: customer.id }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete customer");
      }

      toast.success("Customer deleted successfully");
      navigate("/customer");
    } catch (error) {
      toast.error(error.message || "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!customer) {
    return <Card>Loading customer...</Card>;
  }

  const displayData = {
    id: customer.id,
    name: customer.name || "-",
    email: customer.email || "-",
    phone: customer.phone || "-",
    is_active: Number(customer.is_active) === 1 ? "Active" : "Inactive",
    created_at: new Date(customer.created_at).toLocaleString(),
    updated_at: new Date(customer.updated_at).toLocaleString(),
  };

  return (
    <div className="ui-page">
      <PageSection
        eyebrow="Customer"
        title="Delete Customer"
        subtitle="Use the centralized danger action below if you want to remove this customer."
        actions={<Button variant="secondary" onClick={() => navigate("/customer")}>Back</Button>}
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
        <Button variant="secondary" onClick={() => navigate("/customer")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default DeleteCustomer;
