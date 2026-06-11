import { useEffect, useState } from "react";
import { Button, InputField } from "../ui";

const getInitialFormState = (selectedGroup) => ({
  group_name: selectedGroup?.group_name || "",
  description: selectedGroup?.description || "",
  is_active:
    selectedGroup && typeof selectedGroup.is_active !== "undefined"
      ? Number(selectedGroup.is_active) === 1
      : true,
});

function AddonForm({ selectedGroup, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState(getInitialFormState(selectedGroup));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialFormState(selectedGroup));
    setErrors({});
  }, [selectedGroup]);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.group_name.trim()) {
      setErrors({ group_name: "Group name is required" });
      return;
    }

    onSubmit?.({
      id: selectedGroup?.id,
      group_name: formData.group_name.trim(),
      description: formData.description.trim(),
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid max-w-[760px] gap-[18px]">
      <InputField
        label="Group Name"
        type="text"
        value={formData.group_name}
        onChange={(event) => setFieldValue("group_name", event.target.value)}
        placeholder="e.g. Add Sides"
        error={errors.group_name}
      />

      <InputField
        label="Description"
        as="textarea"
        rows="4"
        value={formData.description}
        onChange={(event) => setFieldValue("description", event.target.value)}
        placeholder="Optional group notes"
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
          {isSubmitting ? "Submitting..." : selectedGroup ? "Update Group" : "Create Group"}
        </Button>
        {selectedGroup ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default AddonForm;
