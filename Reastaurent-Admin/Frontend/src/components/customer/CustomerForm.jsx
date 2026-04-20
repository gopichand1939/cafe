import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, InputField, PageSection } from "../ui";

const getInitialFormState = (selectedCustomer) => ({
  name: selectedCustomer?.name || "",
  email: selectedCustomer?.email || "",
  phone: selectedCustomer?.phone || "",
  password: "",
  is_active:
    selectedCustomer && typeof selectedCustomer.is_active !== "undefined"
      ? Number(selectedCustomer.is_active) === 1
      : true,
});

function CustomerForm({ selectedCustomer, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(getInitialFormState(selectedCustomer));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData(getInitialFormState(selectedCustomer));
    setErrors({});
  }, [selectedCustomer]);

  const setFieldValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Customer name is required";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Customer email is required";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Customer mobile number is required";
    }

    if (!selectedCustomer && !formData.password.trim()) {
      nextErrors.password = "Customer password is required";
    }

    if (formData.password.trim() && formData.password.trim().length < 6) {
      nextErrors.password = "Password must be at least 6 characters long";
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
      id: selectedCustomer?.id,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim(),
      is_active: formData.is_active ? 1 : 0,
    });
  };

  return (
    <div className="ui-page">
      <Card>
        <PageSection
          eyebrow="Customer"
          title={selectedCustomer ? "Edit Customer" : "Create Customer"}
          actions={
            <Button variant="secondary" onClick={() => navigate("/customer")}>
              Back
            </Button>
          }
        />

        <form onSubmit={handleSubmit} className="mt-5 grid max-w-[760px] gap-[18px]">
          <InputField
            label="Customer Name"
            type="text"
            value={formData.name}
            onChange={(event) => setFieldValue("name", event.target.value)}
            placeholder="Enter customer name"
            error={errors.name}
          />

          <InputField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) => setFieldValue("email", event.target.value)}
            placeholder="Enter customer email"
            error={errors.email}
          />

          <InputField
            label="Mobile Number"
            type="tel"
            value={formData.phone}
            onChange={(event) => setFieldValue("phone", event.target.value)}
            placeholder="Enter customer mobile number"
            error={errors.phone}
          />

          <InputField
            label={selectedCustomer ? "Password (leave empty to keep current)" : "Password"}
            type="password"
            value={formData.password}
            onChange={(event) => setFieldValue("password", event.target.value)}
            placeholder={
              selectedCustomer
                ? "Enter new password only if you want to change it"
                : "Enter customer password"
            }
            error={errors.password}
          />

          {selectedCustomer ? (
            <label className="ui-field-shell">
              <span className="ui-label">Active Status</span>
              <button
                type="button"
                className={`ui-status-toggle ${formData.is_active ? "bg-brand-50 text-brand-700" : ""}`}
                onClick={() => setFieldValue("is_active", !formData.is_active)}
              >
                <span
                  className={`ui-status-toggle-dot ${
                    formData.is_active ? "bg-brand-500" : "bg-slate-400"
                  }`}
                />
                {formData.is_active ? "Active" : "Inactive"}
              </button>
            </label>
          ) : null}

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

export default CustomerForm;
