import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  RESTAURANT_SETTINGS,
  RESTAURANT_TOGGLE_STATUS,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import PageHeader from "../common/PageHeader";

function RestaurantTimings() {
  const [form, setForm] = useState({
    institution_name: "",
    restaurant_name: "",
    timezone_name: "Asia/Kolkata",
    manual_is_active: true,
    schedule_enabled: false,
    schedule_start_time: "",
    schedule_end_time: "",
  });
  const [statusInfo, setStatusInfo] = useState({
    current_status: 0,
    current_status_source: "manual",
    current_time: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const applySettings = (settings) => {
    setForm({
      institution_name: settings?.institution_name || "",
      restaurant_name: settings?.restaurant_name || "",
      timezone_name: settings?.timezone_name || "Asia/Kolkata",
      manual_is_active: Number(settings?.manual_is_active) === 1,
      schedule_enabled: Number(settings?.schedule_enabled) === 1,
      schedule_start_time: settings?.schedule_start_time || "",
      schedule_end_time: settings?.schedule_end_time || "",
    });

    setStatusInfo({
      current_status: Number(settings?.current_status) === 1 ? 1 : 0,
      current_status_source: settings?.current_status_source || "manual",
      current_time: settings?.current_time || "",
    });
  };

  const loadSettings = async () => {
    setIsLoading(true);

    try {
      const response = await fetchWithRefreshToken(RESTAURANT_SETTINGS);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load restaurant timings");
      }

      applySettings(data.data || {});
    } catch (error) {
      toast.error(error.message || "Failed to load restaurant timings");
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

  const handleToggle = async () => {
    setIsToggling(true);

    try {
      const response = await fetchWithRefreshToken(RESTAURANT_TOGGLE_STATUS, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manual_is_active: form.manual_is_active ? 0 : 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update restaurant status");
      }

      applySettings(data.data || {});
      toast.success("Restaurant status updated");
    } catch (error) {
      toast.error(error.message || "Failed to update restaurant status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetchWithRefreshToken(RESTAURANT_SETTINGS, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_name: form.institution_name.trim(),
          restaurant_name: form.restaurant_name.trim(),
          timezone_name: form.timezone_name.trim() || "Asia/Kolkata",
          manual_is_active: form.manual_is_active ? 1 : 0,
          schedule_enabled: form.schedule_enabled ? 1 : 0,
          schedule_start_time: form.schedule_start_time,
          schedule_end_time: form.schedule_end_time,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save restaurant timings");
      }

      applySettings(data.data || {});
      toast.success("Restaurant timings saved");
    } catch (error) {
      toast.error(error.message || "Failed to save restaurant timings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title="Restaurant Timings"
          subtitle="Manage manual open or close state and automatic active schedule."
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
        title="Restaurant Timings"
        subtitle="The logged-in admin can manually toggle restaurant status or define the active time range."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#d8ece3] bg-white px-[22px] py-[18px] shadow-[0_10px_30px_rgba(30,76,60,0.08)] max-sm:p-4">
        <div
          className={
            statusInfo.current_status === 1
              ? "min-w-[164px] rounded-full bg-green-100 px-4 py-2.5 text-center font-extrabold text-green-800"
              : "min-w-[164px] rounded-full bg-red-100 px-4 py-2.5 text-center font-extrabold text-red-800"
          }
        >
          {statusInfo.current_status === 1 ? "Currently Active" : "Currently Inactive"}
        </div>
        <div className="grid min-w-[220px] flex-1 gap-[6px]">
          <strong className="text-[#1f2937]">
            Controlled by {statusInfo.current_status_source === "schedule" ? "schedule" : "manual"}
          </strong>
          <span className="text-[0.92rem] text-slate-500">
            Local time: {statusInfo.current_time || "--:--"} | Timezone: {form.timezone_name}
          </span>
        </div>
        <button
          type="button"
          className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${
            form.manual_is_active ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"
          }`}
          onClick={handleToggle}
          disabled={isToggling}
        >
          <span className={`h-6 w-6 rounded-full ${form.manual_is_active ? "bg-green-500" : "bg-slate-400"}`} />
          {isToggling ? "Updating..." : form.manual_is_active ? "Manual Active" : "Manual Inactive"}
        </button>
      </div>

      <form className="grid gap-5 rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]" onSubmit={handleSubmit}>
        <div className="mt-5 grid items-start gap-[22px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="grid min-w-0 max-w-[760px] content-start gap-[18px]">
            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Institution Name</span>
              <input
                type="text"
                value={form.institution_name}
                onChange={(event) => setFieldValue("institution_name", event.target.value)}
                placeholder="Institution owner or group"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Restaurant Name</span>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(event) => setFieldValue("restaurant_name", event.target.value)}
                placeholder="Restaurant name"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-2">
              <span className="text-[0.92rem] font-semibold text-slate-600">Timezone</span>
              <input
                type="text"
                value={form.timezone_name}
                onChange={(event) => setFieldValue("timezone_name", event.target.value)}
                placeholder="Asia/Kolkata"
                className="w-full max-w-[720px] rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="grid min-w-0 max-w-[460px] content-start gap-[18px]">
            <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong>Automatic Schedule</strong>
                <button
                  type="button"
                  className={`inline-flex w-fit items-center gap-2.5 rounded-full border border-slate-300 px-[14px] py-2 pl-2 ${
                    form.schedule_enabled ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"
                  }`}
                  onClick={() => setFieldValue("schedule_enabled", !form.schedule_enabled)}
                >
                  <span className={`h-6 w-6 rounded-full ${form.schedule_enabled ? "bg-green-500" : "bg-slate-400"}`} />
                  {form.schedule_enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="grid gap-[14px] md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="grid gap-2">
                  <span className="text-[0.92rem] font-semibold text-slate-600">Start Time</span>
                  <input
                    type="time"
                    value={form.schedule_start_time}
                    onChange={(event) => setFieldValue("schedule_start_time", event.target.value)}
                    disabled={!form.schedule_enabled}
                    className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                  />
                </div>

                <div className="grid gap-2">
                  <span className="text-[0.92rem] font-semibold text-slate-600">End Time</span>
                  <input
                    type="time"
                    value={form.schedule_end_time}
                    onChange={(event) => setFieldValue("schedule_end_time", event.target.value)}
                    disabled={!form.schedule_enabled}
                    className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <p className="m-0 text-[0.92rem] text-slate-500">
                If schedule is enabled, the restaurant stays active only inside the selected start and
                end time. Outside that period it becomes inactive.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap gap-2.5">
          <button type="submit" className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Timings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RestaurantTimings;
