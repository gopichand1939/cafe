import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PAYMENT_BY_ID } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { setPaymentSelectedItem } from "../../Redux/CardSlice";
import KeyValueDisplay from "../common/KeyValueDisplay";
import PageHeader from "../common/PageHeader";
import { Button, Card } from "../ui";

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

function ViewPayment() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedPayment = useSelector((state) => state.card.paymentSelectedItem);
  const [payment, setPayment] = useState(selectedPayment);

  useEffect(() => {
    const hasDetailFields =
      selectedPayment &&
      Object.prototype.hasOwnProperty.call(selectedPayment, "order_status") &&
      Object.prototype.hasOwnProperty.call(selectedPayment, "order_payment_status") &&
      Object.prototype.hasOwnProperty.call(selectedPayment, "order_total_amount");

    if (
      Number(selectedPayment?.id) === Number(id) &&
      selectedPayment?.transaction_id &&
      hasDetailFields
    ) {
      setPayment(selectedPayment);
      return;
    }

    const fetchPayment = async () => {
      try {
        const response = await fetchWithRefreshToken(PAYMENT_BY_ID, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: Number(id) }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch payment");
        }

        setPayment(data.data);
        dispatch(setPaymentSelectedItem(data.data));
      } catch (error) {
        toast.error(error.message || "Failed to fetch payment");
        navigate("/payments");
      }
    };

    fetchPayment();
  }, [dispatch, id, navigate, selectedPayment]);

  const displayData = useMemo(() => {
    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      order_number: payment.order_number || "-",
      order_status: payment.order_status || "-",
      order_payment_status: payment.order_payment_status || "-",
      customer_name: payment.customer_name || "-",
      customer_email: payment.customer_email || "-",
      customer_phone: payment.customer_phone || "-",
      gateway: payment.gateway || "-",
      rrn: payment.rrn || "-",
      transaction_id: payment.transaction_id || "-",
      provider_payment_id: payment.provider_payment_id || "-",
      provider_charge_id: payment.provider_charge_id || "-",
      provider_balance_transaction_id:
        payment.provider_balance_transaction_id || "-",
      amount: formatCurrency(payment.amount, payment.currency_code),
      amount_in_paise: payment.amount_in_paise ?? "-",
      order_total_amount: formatCurrency(
        payment.order_total_amount,
        payment.currency_code
      ),
      currency_code: payment.currency_code || "-",
      payment_method: payment.payment_method || "-",
      status: payment.status || "-",
      is_payment_success:
        Number(payment.is_payment_success) === 1 ? "Success" : "Pending / Failed",
      failure_code: payment.failure_code || "-",
      failure_message: payment.failure_message || "-",
      paid_at: payment.paid_at ? new Date(payment.paid_at).toLocaleString() : "-",
      created_at: payment.created_at
        ? new Date(payment.created_at).toLocaleString()
        : "-",
      updated_at: payment.updated_at
        ? new Date(payment.updated_at).toLocaleString()
        : "-",
      metadata: JSON.stringify(payment.metadata || {}, null, 2),
      raw_event: JSON.stringify(payment.raw_event || {}, null, 2),
    };
  }, [payment]);

  if (!displayData) {
    return (
      <div className="ui-page">
        <Card className="flex min-h-[200px] items-center justify-center text-text-muted">
          Loading payment...
        </Card>
      </div>
    );
  }

  const fields = [
    { key: "id", label: "Id" },
    { key: "order_number", label: "Order Number" },
    { key: "order_status", label: "Order Status" },
    { key: "order_payment_status", label: "Order Payment Status" },
    { key: "customer_name", label: "Customer Name" },
    { key: "customer_email", label: "Customer Email" },
    { key: "customer_phone", label: "Customer Phone" },
    { key: "gateway", label: "Gateway" },
    { key: "rrn", label: "RRN" },
    { key: "transaction_id", label: "Transaction Id" },
    { key: "provider_payment_id", label: "Provider Payment Id", fullWidth: true },
    { key: "provider_charge_id", label: "Provider Charge Id", fullWidth: true },
    {
      key: "provider_balance_transaction_id",
      label: "Provider Balance Transaction Id",
      fullWidth: true,
    },
    { key: "amount", label: "Amount" },
    { key: "amount_in_paise", label: "Amount In Paise" },
    { key: "order_total_amount", label: "Order Total" },
    { key: "currency_code", label: "Currency" },
    { key: "payment_method", label: "Payment Method" },
    { key: "status", label: "Status" },
    { key: "is_payment_success", label: "Result" },
    { key: "failure_code", label: "Failure Code" },
    { key: "failure_message", label: "Failure Message", fullWidth: true },
    { key: "paid_at", label: "Paid At" },
    { key: "created_at", label: "Created At" },
    { key: "updated_at", label: "Updated At" },
    {
      key: "metadata",
      label: "Metadata",
      fullWidth: true,
      render: (data) => (
        <pre className="m-0 whitespace-pre-wrap text-sm">{data.metadata}</pre>
      ),
    },
    {
      key: "raw_event",
      label: "Raw Event",
      fullWidth: true,
      render: (data) => (
        <pre className="m-0 max-h-[360px] overflow-auto whitespace-pre-wrap text-sm">
          {data.raw_event}
        </pre>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageHeader
          eyebrow="Finance"
          title="View Payment"
          actions={
            <Button variant="secondary" onClick={() => navigate("/payments")}>
              Back
            </Button>
          }
        />
      </div>

      <div className="px-6 pb-6">
        <Card>
          <div className="grid min-w-0 content-start gap-[18px]">
            <KeyValueDisplay data={displayData} fields={fields} />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ViewPayment;
