import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="grid gap-6">
      <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="m-0 text-[0.78rem] font-bold uppercase tracking-normal text-orange-500">Customer</p>
            <h2 className="mt-2 mb-0 text-[clamp(1.7rem,2vw,2.4rem)] leading-[1.1]">
              {selectedCustomer ? "Edit Customer" : "Create Customer"}
            </h2>
          </div>
          <button
            className="min-w-[92px] self-start rounded-[8px] border-0 bg-slate-200 px-4 py-[11px] font-semibold text-slate-900"
            type="button"
            onClick={() => navigate("/customer")}
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid max-w-[760px] gap-[18px]">
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Customer Name</span>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFieldValue("name", event.target.value)}
              placeholder="Enter customer name"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.name ? <small className="text-red-600">{errors.name}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => setFieldValue("email", event.target.value)}
              placeholder="Enter customer email"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.email ? <small className="text-red-600">{errors.email}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Mobile Number</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(event) => setFieldValue("phone", event.target.value)}
              placeholder="Enter customer mobile number"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.phone ? <small className="text-red-600">{errors.phone}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">
              {selectedCustomer ? "Password (leave empty to keep current)" : "Password"}
            </span>
            <input
              type="password"
              value={formData.password}
              onChange={(event) => setFieldValue("password", event.target.value)}
              placeholder={selectedCustomer ? "Enter new password only if you want to change it" : "Enter customer password"}
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
            {errors.password ? <small className="text-red-600">{errors.password}</small> : null}
          </label>

          {selectedCustomer ? (
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
            <button
              className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerForm;
