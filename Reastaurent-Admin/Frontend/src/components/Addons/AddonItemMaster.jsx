import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ADDON_GROUP_BY_ID,
  ADDON_ITEM_CREATE,
  ADDON_ITEM_DELETE,
  ADDON_ITEM_LIST,
  ADDON_ITEM_UPDATE,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import StatusPill from "../common/StatusPill";
import Table from "../Table";
import { Button, Card, InputField, PageSection } from "../ui";

const initialForm = {
  group_id: "",
  addon_item_name: "",
  price: "",
  description: "",
  is_active: true,
};

function AddonItemMaster() {
  const [data, setData] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [selectedItem, setSelectedItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGroups = async () => {
    try {
      const response = await fetchWithRefreshToken(ADDON_GROUP_BY_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch addon groups");
      }

      setGroups(responseData.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch addon groups");
    }
  };

  const fetchData = async (page = currentPage, limit = pageSize) => {
    setLoading(true);

    try {
      const response = await fetchWithRefreshToken(ADDON_ITEM_LIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, limit }),
      });
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to fetch addon items");
      }

      setData(responseData.data || []);
      setTotalCount(responseData.pagination?.totalRecords || 0);
    } catch (error) {
      toast.error(error.message || "Failed to fetch addon items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData(initialForm);
    setErrors({});
  };

  const handleEdit = (row) => {
    setSelectedItem(row);
    setFormData({
      group_id: row.group_id ? String(row.group_id) : "",
      addon_item_name: row.addon_item_name || "",
      price: row.price != null ? String(row.price) : "",
      description: row.description || "",
      is_active: Number(row.is_active) === 1,
    });
  };

  const validate = () => {
    const nextErrors = {};
    const price = Number(formData.price || 0);

    if (!formData.group_id) {
      nextErrors.group_id = "Group is required";
    }
    if (!formData.addon_item_name.trim()) {
      nextErrors.addon_item_name = "Addon item name is required";
    }
    if (Number.isNaN(price) || price < 0) {
      nextErrors.price = "Price must be 0 or more";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const payload = {
      id: selectedItem?.id,
      group_id: Number(formData.group_id),
      addon_item_name: formData.addon_item_name.trim(),
      price: formData.price !== "" ? Number(formData.price) : 0,
      description: formData.description.trim(),
      is_active: formData.is_active ? 1 : 0,
    };

    setIsSubmitting(true);
    try {
      const response = await fetchWithRefreshToken(
        selectedItem ? ADDON_ITEM_UPDATE : ADDON_ITEM_CREATE,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to save addon item");
      }

      toast.success(selectedItem ? "Addon item updated successfully" : "Addon item created successfully");
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to save addon item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete addon item "${row.addon_item_name}"?`)) {
      return;
    }

    try {
      const response = await fetchWithRefreshToken(ADDON_ITEM_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const responseData = await response.json();

      if (!response.ok || responseData.success === false) {
        throw new Error(responseData.message || "Failed to delete addon item");
      }

      toast.success("Addon item deleted successfully");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to delete addon item");
    }
  };

  const headers = [
    { key: "id", label: "Id", width: "60px" },
    { key: "group_name", label: "Group", width: "160px" },
    { key: "addon_item_name", label: "Addon Item", width: "180px" },
    {
      key: "price",
      label: "Price",
      width: "90px",
      content: (item) => <span className="font-bold text-text-strong">GBP {Number(item.price || 0).toFixed(2)}</span>,
    },
    {
      key: "description",
      label: "Description",
      width: "220px",
      content: (item) => item.description || "-",
    },
    {
      key: "is_active",
      label: "Status",
      width: "90px",
      content: (item) => <StatusPill active={Number(item.is_active) === 1} />,
    },
    {
      key: "actions",
      label: "Actions",
      width: "170px",
      content: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="px-6 pt-3 pb-1">
        <PageSection eyebrow="Addons" title="Addon Item Master" />
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid max-w-[760px] gap-[18px]">
          <InputField
            label="Group"
            as="select"
            value={formData.group_id}
            onChange={(event) => setFieldValue("group_id", event.target.value)}
            error={errors.group_id}
          >
            <option value="">Select addon group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.group_name}
              </option>
            ))}
          </InputField>

          <InputField
            label="Addon Item Name"
            type="text"
            value={formData.addon_item_name}
            onChange={(event) => setFieldValue("addon_item_name", event.target.value)}
            placeholder="e.g. French Fries"
            error={errors.addon_item_name}
          />

          <InputField
            label="Price (GBP)"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(event) => setFieldValue("price", event.target.value)}
            placeholder="e.g. 80"
            error={errors.price}
          />

          <InputField
            label="Description"
            as="textarea"
            rows="4"
            value={formData.description}
            onChange={(event) => setFieldValue("description", event.target.value)}
            placeholder="Optional item notes"
          />

          <div className="ui-field-shell">
            <span className="ui-label">Active Status</span>
            <button
              type="button"
              className={`ui-status-toggle ${formData.is_active ? "bg-success-bg text-success-text" : ""}`}
              onClick={() => setFieldValue("is_active", !formData.is_active)}
            >
              <span className={`ui-status-toggle-dot ${formData.is_active ? "bg-success-text" : "bg-text-muted/40"}`} />
              <span className="text-[0.92rem] font-bold">
                {formData.is_active ? "Active" : "Inactive"}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : selectedItem ? "Update Item" : "Create Item"}
            </Button>
            {selectedItem ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Table
        data={data}
        headers={headers}
        loading={loading}
        searchPlaceholder="Search addon items..."
        totalRowsLabel="Total Items"
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={(page, nextPageSize) => {
          setCurrentPage(page);
          setPageSize(nextPageSize);
        }}
        totalItems={totalCount}
      />
    </div>
  );
}

export default AddonItemMaster;
