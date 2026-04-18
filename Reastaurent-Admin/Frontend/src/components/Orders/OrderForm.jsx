import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CUSTOMER_LIST,
  ITEM_LIST,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

const cardClassName =
  "rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]";

const defaultAddress = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

const createEmptyLineItem = () => ({
  item_id: "",
  quantity: 1,
  selected_addons: [],
  item_notes: "",
});

function OrderForm({
  initialValues = null,
  onSubmit,
  isSubmitting = false,
  mode = "create",
}) {
  const isEditMode = mode === "edit";
  const [customerOptions, setCustomerOptions] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [formState, setFormState] = useState({
    customer_id: initialValues?.customer_id || "",
    payment_method: initialValues?.payment_method || "cash_on_delivery",
    payment_status: initialValues?.payment_status || "pending",
    order_status: initialValues?.order_status || "placed",
    currency_code: initialValues?.currency_code || "INR",
    order_notes: initialValues?.order_notes || "",
    delivery_address: initialValues?.delivery_address || defaultAddress,
    tax_amount: initialValues?.tax_amount ?? 0,
    delivery_fee: initialValues?.delivery_fee ?? 0,
    items:
      initialValues?.items?.length > 0
        ? initialValues.items.map((item) => ({
            item_id: item.item_id || "",
            quantity: Number(item.quantity) || 1,
            selected_addons: Array.isArray(item.selected_addons)
              ? item.selected_addons
              : [],
            item_notes: item.item_notes || "",
          }))
        : [createEmptyLineItem()],
  });

  useEffect(() => {
    const loadDependencies = async () => {
      setLoadingDependencies(true);

      try {
        const [customersResponse, itemsResponse] = await Promise.all([
          fetchWithRefreshToken(CUSTOMER_LIST, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ page: 1, limit: 500 }),
          }),
          fetchWithRefreshToken(ITEM_LIST, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ page: 1, limit: 500 }),
          }),
        ]);

        const [customersData, itemsData] = await Promise.all([
          customersResponse.json(),
          itemsResponse.json(),
        ]);

        if (!customersResponse.ok || customersData.success === false) {
          throw new Error(customersData.message || "Failed to fetch customers");
        }

        if (!itemsResponse.ok || itemsData.success === false) {
          throw new Error(itemsData.message || "Failed to fetch items");
        }

        setCustomerOptions(customersData.data || []);
        setItemOptions(itemsData.data || []);
      } catch (error) {
        toast.error(error.message || "Failed to load order form data");
      } finally {
        setLoadingDependencies(false);
      }
    };

    loadDependencies();
  }, []);

  const itemMap = useMemo(
    () =>
      itemOptions.reduce((accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
      }, {}),
    [itemOptions]
  );

  const totals = useMemo(() => {
    return formState.items.reduce(
      (accumulator, lineItem) => {
        const item = itemMap[Number(lineItem.item_id)];

        if (!item) {
          return accumulator;
        }

        const quantity = Math.max(Number(lineItem.quantity) || 0, 0);
        const unitPrice = Number(item.price || 0);
        const discountPrice =
          item.discount_price !== null && item.discount_price !== undefined && item.discount_price !== ""
            ? Number(item.discount_price)
            : null;
        const finalUnitPrice =
          discountPrice !== null && discountPrice < unitPrice
            ? discountPrice
            : unitPrice;

        const lineSubtotal = unitPrice * quantity;
        const lineDiscount = (unitPrice - finalUnitPrice) * quantity;
        const lineTotal = finalUnitPrice * quantity;

        return {
          subtotal_amount: accumulator.subtotal_amount + lineSubtotal,
          discount_amount: accumulator.discount_amount + lineDiscount,
          total_amount: accumulator.total_amount + lineTotal,
        };
      },
      {
        subtotal_amount: 0,
        discount_amount: 0,
        total_amount: 0,
      }
    );
  }, [formState.items, itemMap]);

  const finalTotal =
    totals.total_amount +
    Number(formState.tax_amount || 0) +
    Number(formState.delivery_fee || 0);

  const handleRootChange = (key, value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddressChange = (key, value) => {
    setFormState((prev) => ({
      ...prev,
      delivery_address: {
        ...prev.delivery_address,
        [key]: value,
      },
    }));
  };

  const handleLineItemChange = (index, key, value) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value,
            }
          : item
      ),
    }));
  };

  const addLineItem = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
    }));
  };

  const removeLineItem = (index) => {
    setFormState((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((_, itemIndex) => itemIndex !== index)
          : [createEmptyLineItem()],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isEditMode) {
      onSubmit({
        id: initialValues?.id,
        order_status: formState.order_status,
        payment_status: formState.payment_status,
      });
      return;
    }

    const normalizedItems = formState.items
      .filter((item) => Number(item.item_id) > 0)
      .map((lineItem) => {
        const sourceItem = itemMap[Number(lineItem.item_id)];

        return {
          item_id: sourceItem.id,
          category_id: sourceItem.category_id,
          item_name: sourceItem.item_name,
          item_description: sourceItem.item_description || "",
          item_image: sourceItem.item_image_url || "",
          quantity: Number(lineItem.quantity) || 1,
          unit_price: Number(sourceItem.price || 0),
          discount_price:
            sourceItem.discount_price === null ||
            sourceItem.discount_price === undefined ||
            sourceItem.discount_price === ""
              ? null
              : Number(sourceItem.discount_price),
          selected_addons: Array.isArray(lineItem.selected_addons)
            ? lineItem.selected_addons
            : [],
          item_notes: lineItem.item_notes || "",
        };
      });

    onSubmit({
      customer_id: Number(formState.customer_id),
      payment_method: formState.payment_method,
      payment_status: formState.payment_status,
      order_status: formState.order_status,
      currency_code: formState.currency_code,
      order_notes: formState.order_notes,
      delivery_address: formState.delivery_address,
      tax_amount: Number(formState.tax_amount || 0),
      delivery_fee: Number(formState.delivery_fee || 0),
      items: normalizedItems,
    });
  };

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">
            Orders
          </p>
          <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">
            {isEditMode ? "Update Order Status" : "Create Order"}
          </h2>
        </div>
      </div>

      <form className="grid gap-[18px]" onSubmit={handleSubmit}>
        <section className={cardClassName}>
          <div className="grid gap-4 md:grid-cols-2">
            {!isEditMode ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Customer</span>
                <select
                  className="rounded-[8px] border border-slate-300 px-3 py-3"
                  value={formState.customer_id}
                  onChange={(event) => handleRootChange("customer_id", event.target.value)}
                  disabled={loadingDependencies}
                  required
                >
                  <option value="">Select customer</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Order Number</span>
                <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-3">
                  {initialValues?.order_number || "-"}
                </div>
              </div>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Order Status</span>
              <select
                className="rounded-[8px] border border-slate-300 px-3 py-3"
                value={formState.order_status}
                onChange={(event) => handleRootChange("order_status", event.target.value)}
                required
              >
                {[
                  "placed",
                  "accepted",
                  "preparing",
                  "ready",
                  "out_for_delivery",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Payment Status</span>
              <select
                className="rounded-[8px] border border-slate-300 px-3 py-3"
                value={formState.payment_status}
                onChange={(event) => handleRootChange("payment_status", event.target.value)}
                required
              >
                {["pending", "paid", "failed", "refunded"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            {!isEditMode ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Payment Method</span>
                <input
                  className="rounded-[8px] border border-slate-300 px-3 py-3"
                  value={formState.payment_method}
                  onChange={(event) => handleRootChange("payment_method", event.target.value)}
                  placeholder="cash_on_delivery"
                  required
                />
              </label>
            ) : null}

            {!isEditMode ? (
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Currency Code</span>
                <input
                  className="rounded-[8px] border border-slate-300 px-3 py-3"
                  value={formState.currency_code}
                  onChange={(event) => handleRootChange("currency_code", event.target.value)}
                  placeholder="INR"
                  required
                />
              </label>
            ) : null}
          </div>
        </section>

        {!isEditMode ? (
          <>
            <section className={cardClassName}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-semibold text-slate-900">Order Items</h3>
                  <p className="m-0 mt-1 text-sm text-slate-500">
                    Select the items the customer ordered.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white"
                  onClick={addLineItem}
                >
                  Add Item
                </button>
              </div>

              <div className="grid gap-4">
                {formState.items.map((lineItem, index) => {
                  const selectedItem = itemMap[Number(lineItem.item_id)];
                  const displayPrice =
                    selectedItem?.discount_price !== null &&
                    selectedItem?.discount_price !== undefined &&
                    selectedItem?.discount_price !== ""
                      ? Number(selectedItem.discount_price)
                      : Number(selectedItem?.price || 0);

                  return (
                    <div
                      key={`line-item-${index}`}
                      className="grid gap-4 rounded-[8px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Item</span>
                          <select
                            className="rounded-[8px] border border-slate-300 px-3 py-3"
                            value={lineItem.item_id}
                            onChange={(event) =>
                              handleLineItemChange(index, "item_id", event.target.value)
                            }
                            disabled={loadingDependencies}
                            required
                          >
                            <option value="">Select item</option>
                            {itemOptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.item_name} ({item.category_name})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-slate-700">Quantity</span>
                          <input
                            type="number"
                            min="1"
                            className="rounded-[8px] border border-slate-300 px-3 py-3"
                            value={lineItem.quantity}
                            onChange={(event) =>
                              handleLineItemChange(index, "quantity", event.target.value)
                            }
                            required
                          />
                        </label>

                        <button
                          type="button"
                          className="self-end rounded-[8px] border-0 bg-red-600 px-4 py-[11px] font-semibold text-white"
                          onClick={() => removeLineItem(index)}
                        >
                          Remove
                        </button>
                      </div>

                      {selectedItem ? (
                        <div className="grid gap-2 rounded-[8px] border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
                          <span>
                            Category: <strong>{selectedItem.category_name}</strong>
                          </span>
                          <span>
                            Unit Price: <strong>{displayPrice.toFixed(2)}</strong>
                          </span>
                        </div>
                      ) : null}

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-slate-700">Item Notes</span>
                        <textarea
                          className="min-h-[92px] rounded-[8px] border border-slate-300 px-3 py-3"
                          value={lineItem.item_notes}
                          onChange={(event) =>
                            handleLineItemChange(index, "item_notes", event.target.value)
                          }
                          placeholder="Optional note for this item"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={cardClassName}>
              <h3 className="m-0 text-lg font-semibold text-slate-900">Delivery Address</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["full_name", "Full Name"],
                  ["phone", "Phone"],
                  ["address_line_1", "Address Line 1"],
                  ["address_line_2", "Address Line 2"],
                  ["city", "City"],
                  ["state", "State"],
                  ["pincode", "Pincode"],
                  ["landmark", "Landmark"],
                ].map(([key, label]) => (
                  <label key={key} className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input
                      className="rounded-[8px] border border-slate-300 px-3 py-3"
                      value={formState.delivery_address?.[key] || ""}
                      onChange={(event) => handleAddressChange(key, event.target.value)}
                      placeholder={label}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className={cardClassName}>
              <h3 className="m-0 text-lg font-semibold text-slate-900">Charges</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Tax Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-[8px] border border-slate-300 px-3 py-3"
                    value={formState.tax_amount}
                    onChange={(event) => handleRootChange("tax_amount", event.target.value)}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Delivery Fee</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-[8px] border border-slate-300 px-3 py-3"
                    value={formState.delivery_fee}
                    onChange={(event) => handleRootChange("delivery_fee", event.target.value)}
                  />
                </label>

                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Order Notes</span>
                  <textarea
                    className="min-h-[100px] rounded-[8px] border border-slate-300 px-3 py-3"
                    value={formState.order_notes}
                    onChange={(event) => handleRootChange("order_notes", event.target.value)}
                    placeholder="Special instructions for the order"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-3 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
                <span>
                  Subtotal: <strong>{totals.subtotal_amount.toFixed(2)}</strong>
                </span>
                <span>
                  Discount: <strong>{totals.discount_amount.toFixed(2)}</strong>
                </span>
                <span>
                  Items Total: <strong>{totals.total_amount.toFixed(2)}</strong>
                </span>
                <span>
                  Final Total: <strong>{finalTotal.toFixed(2)}</strong>
                </span>
              </div>
            </section>
          </>
        ) : (
          <section className={cardClassName}>
            <h3 className="m-0 text-lg font-semibold text-slate-900">Order Summary</h3>
            <div className="mt-4 grid gap-3 rounded-[8px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <span>
                Customer: <strong>{initialValues?.customer_name || "-"}</strong>
              </span>
              <span>
                Payment Method: <strong>{initialValues?.payment_method || "-"}</strong>
              </span>
              <span>
                Total Amount: <strong>{Number(initialValues?.total_amount || 0).toFixed(2)}</strong>
              </span>
              <span>
                Item Count: <strong>{initialValues?.item_count || 0}</strong>
              </span>
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2.5">
          <button
            type="submit"
            className="rounded-[8px] border-0 bg-[#57b98f] px-4 py-[11px] font-semibold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            disabled={isSubmitting || loadingDependencies}
          >
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Order"
                : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
