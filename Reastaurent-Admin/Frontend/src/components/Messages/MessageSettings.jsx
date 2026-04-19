import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MESSAGE_SETTINGS,
  MESSAGE_TEST_MAIL,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import PageHeader from "../common/PageHeader";

function MessageSettings() {
  const [form, setForm] = useState({
    admin_email: "",
    sender_name: "Bagel Master Cafe",
    sender_email: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: "",
    smtp_pass: "",
    mail_enabled: false,
    notify_customer_created: true,
    notify_customer_updated: true,
    notify_customer_deleted: true,
    notify_order_created: true,
    notify_order_updated: true,
    notify_order_deleted: true,
    notify_customer_mail_customer_created: true,
    notify_customer_mail_customer_updated: true,
    notify_customer_mail_customer_deleted: true,
    notify_customer_mail_order_created: true,
    notify_customer_mail_order_updated: true,
    notify_customer_mail_order_deleted: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const applySettings = (settings = {}) => {
    setForm({
      admin_email: settings.admin_email || "",
      sender_name: settings.sender_name || "Bagel Master Cafe",
      sender_email: settings.sender_email || "",
      smtp_host: settings.smtp_host || "",
      smtp_port: Number(settings.smtp_port) || 587,
      smtp_secure: Number(settings.smtp_secure) === 1,
      smtp_user: settings.smtp_user || "",
      smtp_pass: settings.smtp_pass || "",
      mail_enabled: Number(settings.mail_enabled) === 1,
      notify_customer_created: Number(settings.notify_customer_created) === 1,
      notify_customer_updated: Number(settings.notify_customer_updated) === 1,
      notify_customer_deleted: Number(settings.notify_customer_deleted) === 1,
      notify_order_created: Number(settings.notify_order_created) === 1,
      notify_order_updated: Number(settings.notify_order_updated) === 1,
      notify_order_deleted: Number(settings.notify_order_deleted) === 1,
      notify_customer_mail_customer_created:
        Number(settings.notify_customer_mail_customer_created) === 1,
      notify_customer_mail_customer_updated:
        Number(settings.notify_customer_mail_customer_updated) === 1,
      notify_customer_mail_customer_deleted:
        Number(settings.notify_customer_mail_customer_deleted) === 1,
      notify_customer_mail_order_created:
        Number(settings.notify_customer_mail_order_created) === 1,
      notify_customer_mail_order_updated:
        Number(settings.notify_customer_mail_order_updated) === 1,
      notify_customer_mail_order_deleted:
        Number(settings.notify_customer_mail_order_deleted) === 1,
    });
  };

  const loadSettings = async () => {
    setIsLoading(true);

    try {
      const response = await fetchWithRefreshToken(MESSAGE_SETTINGS);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load message settings");
      }

      applySettings(data.data || {});
    } catch (error) {
      toast.error(error.message || "Failed to load message settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const setFieldValue = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const buildBooleanToggle = (field, label, description) => (
    <label
      key={field}
      className="grid gap-2 rounded-[8px] border border-slate-200 bg-white p-[14px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <strong className="text-[#1f2937]">{label}</strong>
          <span className="text-[0.88rem] text-slate-500">{description}</span>
        </div>
        <button
          type="button"
          className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${
            form[field] ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"
          }`}
          onClick={() => setFieldValue(field, !form[field])}
        >
          <span
            className={`h-6 w-6 rounded-full ${
              form[field] ? "bg-green-500" : "bg-slate-400"
            }`}
          />
          {form[field] ? "Enabled" : "Disabled"}
        </button>
      </div>
    </label>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetchWithRefreshToken(MESSAGE_SETTINGS, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_email: form.admin_email.trim(),
          sender_name: form.sender_name.trim(),
          sender_email: form.sender_email.trim(),
          smtp_host: form.smtp_host.trim(),
          smtp_port: Number(form.smtp_port) || 587,
          smtp_secure: form.smtp_secure ? 1 : 0,
          smtp_user: form.smtp_user.trim(),
          smtp_pass: form.smtp_pass,
          mail_enabled: form.mail_enabled ? 1 : 0,
          notify_customer_created: form.notify_customer_created ? 1 : 0,
          notify_customer_updated: form.notify_customer_updated ? 1 : 0,
          notify_customer_deleted: form.notify_customer_deleted ? 1 : 0,
          notify_order_created: form.notify_order_created ? 1 : 0,
          notify_order_updated: form.notify_order_updated ? 1 : 0,
          notify_order_deleted: form.notify_order_deleted ? 1 : 0,
          notify_customer_mail_customer_created:
            form.notify_customer_mail_customer_created ? 1 : 0,
          notify_customer_mail_customer_updated:
            form.notify_customer_mail_customer_updated ? 1 : 0,
          notify_customer_mail_customer_deleted:
            form.notify_customer_mail_customer_deleted ? 1 : 0,
          notify_customer_mail_order_created:
            form.notify_customer_mail_order_created ? 1 : 0,
          notify_customer_mail_order_updated:
            form.notify_customer_mail_order_updated ? 1 : 0,
          notify_customer_mail_order_deleted:
            form.notify_customer_mail_order_deleted ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save message settings");
      }

      applySettings(data.data || {});
      toast.success("Message settings saved");
    } catch (error) {
      toast.error(error.message || "Failed to save message settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestMail = async () => {
    setIsSendingTest(true);

    try {
      const response = await fetchWithRefreshToken(MESSAGE_TEST_MAIL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to send test mail");
      }

      toast.success("Test mail sent");
    } catch (error) {
      toast.error(error.message || "Failed to send test mail");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Messages"
          subtitle="Configure admin email delivery for order and customer activity notifications."
        />
        <div className="rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]">
          <div className="grid min-h-[220px] place-items-center p-7 text-center">
            <div className="h-[42px] w-[42px] animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Messages"
        subtitle="Choose which customer and order actions should send email to the admin mailbox, and configure SMTP delivery in one place."
        actions={
          <button
            type="button"
            onClick={handleSendTestMail}
            disabled={isSendingTest}
            className="rounded-[8px] border-0 bg-slate-900 px-4 py-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSendingTest ? "Sending..." : "Send Test Mail"}
          </button>
        }
      />

      <form
        className="grid gap-5 rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Admin Mailbox</span>
              <input
                type="email"
                value={form.admin_email}
                onChange={(event) => setFieldValue("admin_email", event.target.value)}
                placeholder="admin@example.com"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Sender Name</span>
              <input
                type="text"
                value={form.sender_name}
                onChange={(event) => setFieldValue("sender_name", event.target.value)}
                placeholder="Bagel Master Cafe"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Sender Email</span>
              <input
                type="email"
                value={form.sender_email}
                onChange={(event) => setFieldValue("sender_email", event.target.value)}
                placeholder="noreply@example.com"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-[14px] md:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">SMTP Host</span>
                <input
                  type="text"
                  value={form.smtp_host}
                  onChange={(event) => setFieldValue("smtp_host", event.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                />
              </div>

              <div className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">SMTP Port</span>
                <input
                  type="number"
                  value={form.smtp_port}
                  onChange={(event) => setFieldValue("smtp_port", event.target.value)}
                  placeholder="587"
                  className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-[14px] md:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">SMTP User</span>
                <input
                  type="text"
                  value={form.smtp_user}
                  onChange={(event) => setFieldValue("smtp_user", event.target.value)}
                  placeholder="smtp username"
                  className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                />
              </div>

              <div className="grid gap-2">
                <span className="text-[0.92rem] font-semibold text-slate-600">SMTP Password / App Password</span>
                <input
                  type="password"
                  value={form.smtp_pass}
                  onChange={(event) => setFieldValue("smtp_pass", event.target.value)}
                  placeholder="smtp password"
                  className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
              {buildBooleanToggle(
                "mail_enabled",
                "Mail Delivery",
                "Master switch for all admin email notification delivery."
              )}
              {buildBooleanToggle(
                "smtp_secure",
                "Secure SMTP",
                "Enable secure SMTP mode when your provider requires SSL/TLS."
              )}
            </div>

            <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
              <strong className="text-[#1f2937]">Admin Mail Rules From Customer Activity</strong>
              {buildBooleanToggle(
                "notify_customer_created",
                "Customer Registered",
                "Send admin mail when a new customer is created or registered."
              )}
              {buildBooleanToggle(
                "notify_customer_updated",
                "Customer Updated",
                "Send admin mail when a customer profile changes."
              )}
              {buildBooleanToggle(
                "notify_customer_deleted",
                "Customer Deleted",
                "Send admin mail when a customer is removed."
              )}
            </div>

            <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
              <strong className="text-[#1f2937]">Order Activity Mail Rules</strong>
              {buildBooleanToggle(
                "notify_order_created",
                "Order Placed",
                "Send admin mail when a customer places a new order."
              )}
              {buildBooleanToggle(
                "notify_order_updated",
                "Order Updated",
                "Send admin mail when an order status changes."
              )}
              {buildBooleanToggle(
                "notify_order_deleted",
                "Order Deleted",
                "Send admin mail when an order is deleted."
              )}
            </div>

            <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
              <strong className="text-[#1f2937]">Customer Mail Rules From Admin Activity</strong>
              {buildBooleanToggle(
                "notify_customer_mail_customer_created",
                "Customer Account Created",
                "Send customer mail when admin creates a customer account."
              )}
              {buildBooleanToggle(
                "notify_customer_mail_customer_updated",
                "Customer Account Updated",
                "Send customer mail when admin updates customer details."
              )}
              {buildBooleanToggle(
                "notify_customer_mail_customer_deleted",
                "Customer Account Deleted",
                "Send customer mail when admin deletes a customer account."
              )}
              {buildBooleanToggle(
                "notify_customer_mail_order_created",
                "Order Created By Admin",
                "Send customer mail when admin creates an order for that customer."
              )}
              {buildBooleanToggle(
                "notify_customer_mail_order_updated",
                "Order Status Updated",
                "Send customer mail when admin updates the order status."
              )}
              {buildBooleanToggle(
                "notify_customer_mail_order_deleted",
                "Order Deleted By Admin",
                "Send customer mail when admin deletes a customer order."
              )}
            </div>
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap gap-2.5">
          <button
            type="submit"
            className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Message Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessageSettings;
