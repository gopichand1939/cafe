import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITEM_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";

const getInitialFormState = (selectedAddon) => ({
  item_id: selectedAddon?.item_id ? String(selectedAddon.item_id) : "",
  addon_group: selectedAddon?.addon_group || "",
  addon_name: selectedAddon?.addon_name || "",
  addon_price: selectedAddon?.addon_price != null ? String(selectedAddon.addon_price) : "",
  sort_order: selectedAddon?.sort_order != null ? String(selectedAddon.sort_order) : "0",
  is_active:
    selectedAddon && typeof selectedAddon.is_active !== "undefined"
      ? Number(selectedAddon.is_active) === 1
      : true,
});

function AddonForm({ selectedAddon, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormState(selectedAddon));
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);

  useEffect(() => {
    setFormData(getInitialFormState(selectedAddon));
    setErrors({});
  }, [selectedAddon]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetchWithRefreshToken(ITEM_LIST, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page: 1, limit: 500 }),
        });
        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Failed to fetch items");
        }

        setItems(data.data || []);
      } catch (_error) {
        setItems([]);
      }
    };

    fetchItems();
  }, []);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.item_id) {
      nextErrors.item_id = "Item is required";
    }

    if (!formData.addon_group.trim()) {
      nextErrors.addon_group = "Add-on group is required";
    }

    if (!formData.addon_name.trim()) {
      nextErrors.addon_name = "Add-on name is required";
    }

    if (formData.addon_price !== "" && (isNaN(Number(formData.addon_price)) || Number(formData.addon_price) < 0)) {
      nextErrors.addon_price = "Add-on price must be a valid positive number";
    }

    if (formData.sort_order !== "" && (isNaN(Number(formData.sort_order)) || Number(formData.sort_order) < 0)) {
      nextErrors.sort_order = "Sort order must be a valid positive number";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event?.preventDefault?.();

    if (!validateForm()) {
      return;
    }

    onSubmit?.({
      id: selectedAddon?.id,
      item_id: Number(formData.item_id),
      addon_group: formData.addon_group.trim(),
      addon_name: formData.addon_name.trim(),
      addon_price: formData.addon_price !== "" ? parseFloat(formData.addon_price) : 0,
      sort_order: formData.sort_order !== "" ? parseInt(formData.sort_order, 10) : 0,
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Addon</p>
            <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">{selectedAddon ? "Edit Addon" : "Create Addon"}</h2>
          </div>
          <button
            className="min-w-[92px] self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900"
            type="button"
            onClick={() => navigate("/addon")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid max-w-[760px] gap-[18px]">
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Item</span>
            <select
              value={formData.item_id}
              onChange={(event) => setFieldValue("item_id", event.target.value)}
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name}
                </option>
              ))}
            </select>
            {errors.item_id ? <small className="text-red-600">{errors.item_id}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Add-on Group</span>
            <input
              type="text"
              value={formData.addon_group}
              onChange={(event) => setFieldValue("addon_group", event.target.value)}
              placeholder="e.g. Add Sides?"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.addon_group ? <small className="text-red-600">{errors.addon_group}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Add-on Name</span>
            <input
              type="text"
              value={formData.addon_name}
              onChange={(event) => setFieldValue("addon_name", event.target.value)}
              placeholder="e.g. Chips"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.addon_name ? <small className="text-red-600">{errors.addon_name}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Add-on Price (£)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.addon_price}
              onChange={(event) => setFieldValue("addon_price", event.target.value)}
              placeholder="e.g. 3.50"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.addon_price ? <small className="text-red-600">{errors.addon_price}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Sort Order</span>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.sort_order}
              onChange={(event) => setFieldValue("sort_order", event.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.sort_order ? <small className="text-red-600">{errors.sort_order}</small> : null}
          </label>

          {selectedAddon ? (
            <label className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Active Status</span>
              <button
                type="button"
                className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${formData.is_active ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"}`}
                onClick={() => setFieldValue("is_active", !formData.is_active)}
              >
                <span className={`h-6 w-6 rounded-full ${formData.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                {formData.is_active ? "Active" : "Inactive"}
              </button>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2.5">
            <button className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddonForm;
