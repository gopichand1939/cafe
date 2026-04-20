import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITEM_LIST } from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import { Button, Card, InputField, PageSection } from "../ui";

const getInitialFormState = (selectedAddon) => ({
  item_id: selectedAddon?.item_id ? String(selectedAddon.item_id) : "",
  addon_group: selectedAddon?.addon_group || "",
  addon_name: selectedAddon?.addon_name || "",
  addon_price:
    selectedAddon?.addon_price != null ? String(selectedAddon.addon_price) : "",
  sort_order:
    selectedAddon?.sort_order != null ? String(selectedAddon.sort_order) : "0",
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

    if (
      formData.addon_price !== "" &&
      (isNaN(Number(formData.addon_price)) || Number(formData.addon_price) < 0)
    ) {
      nextErrors.addon_price = "Add-on price must be a valid positive number";
    }

    if (
      formData.sort_order !== "" &&
      (isNaN(Number(formData.sort_order)) || Number(formData.sort_order) < 0)
    ) {
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
      addon_price:
        formData.addon_price !== "" ? parseFloat(formData.addon_price) : 0,
      sort_order:
        formData.sort_order !== "" ? parseInt(formData.sort_order, 10) : 0,
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="ui-page">
      <Card>
        <PageSection
          eyebrow="Addon"
          title={selectedAddon ? "Edit Addon" : "Create Addon"}
          actions={
            <Button variant="secondary" onClick={() => navigate("/addon")}>
              Back
            </Button>
          }
        />

        <form onSubmit={handleSubmit} className="mt-5 grid max-w-[760px] gap-[18px]">
          <InputField
            label="Item"
            as="select"
            value={formData.item_id}
            onChange={(event) => setFieldValue("item_id", event.target.value)}
            error={errors.item_id}
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name}
              </option>
            ))}
          </InputField>

          <InputField
            label="Add-on Group"
            type="text"
            value={formData.addon_group}
            onChange={(event) => setFieldValue("addon_group", event.target.value)}
            placeholder="e.g. Add Sides?"
            error={errors.addon_group}
          />

          <InputField
            label="Add-on Name"
            type="text"
            value={formData.addon_name}
            onChange={(event) => setFieldValue("addon_name", event.target.value)}
            placeholder="e.g. Chips"
            error={errors.addon_name}
          />

          <InputField
            label="Add-on Price (£)"
            type="number"
            step="0.01"
            min="0"
            value={formData.addon_price}
            onChange={(event) => setFieldValue("addon_price", event.target.value)}
            placeholder="e.g. 3.50"
            error={errors.addon_price}
          />

          <InputField
            label="Sort Order"
            type="number"
            step="1"
            min="0"
            value={formData.sort_order}
            onChange={(event) => setFieldValue("sort_order", event.target.value)}
            placeholder="e.g. 1"
            error={errors.sort_order}
          />

          <div className="ui-field-shell">
            <span className="ui-label">Active Status</span>
            <button
              type="button"
              className={`ui-status-toggle ${formData.is_active ? "bg-success-bg text-success-text" : ""}`}
              onClick={() => setFieldValue("is_active", !formData.is_active)}
            >
              <span
                className={`ui-status-toggle-dot ${
                  formData.is_active ? "bg-success-text" : "bg-text-muted/40"
                }`}
              />
              <span className="text-[0.92rem] font-bold">
                {formData.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddonForm;
