import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CUSTOMER_BY_ID, CUSTOMER_DELETE } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setCustomerSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";

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
    return <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">Loading customer...</div>;
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
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Customer</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">Delete Customer</h2>
        </div>
        <button className="self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/customer")}>
          Back
        </button>
      </div>

      <div className="mt-[18px] rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="mt-5 grid items-start gap-[22px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <KeyValueDisplay data={displayData} />
          </div>
        </div>
      </div>

      <div className="mt-0.5 flex flex-wrap gap-2.5">
        <button className="rounded-[8px] border-0 bg-red-600 px-4 py-[11px] font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button className="rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900 transition hover:-translate-y-px" onClick={() => navigate("/customer")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DeleteCustomer;
