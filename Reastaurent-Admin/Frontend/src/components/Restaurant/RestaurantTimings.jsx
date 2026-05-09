import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  RESTAURANT_SETTINGS,
  RESTAURANT_TOGGLE_STATUS,
} from "../../Utils/Constant";
import fetchWithRefreshToken from "../../Utils/fetchWithRefreshToken";
import PageHeader from "../common/PageHeader";

const WEEK_DAYS = [
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

const DEFAULT_WEEKLY_SCHEDULE = {
  sunday: { enabled: true, start_time: "07:00", end_time: "23:00" },
  monday: { enabled: true, start_time: "07:00", end_time: "23:00" },
  tuesday: { enabled: true, start_time: "07:00", end_time: "23:00" },
  wednesday: { enabled: true, start_time: "07:00", end_time: "23:00" },
  thursday: { enabled: true, start_time: "07:00", end_time: "23:00" },
  friday: { enabled: true, start_time: "07:00", end_time: "02:00" },
  saturday: { enabled: true, start_time: "08:00", end_time: "02:00" },
};

const normalizeSchedule = (schedule = {}) =>
  WEEK_DAYS.reduce((result, day) => {
    const source = schedule?.[day.key] || DEFAULT_WEEKLY_SCHEDULE[day.key];
    const enabled =
      typeof source.enabled === "undefined" ? !source.closed : Boolean(source.enabled);

    result[day.key] = {
      enabled,
      closed: !enabled,
      start_time: enabled ? source.start_time || DEFAULT_WEEKLY_SCHEDULE[day.key].start_time : "",
      end_time: enabled ? source.end_time || DEFAULT_WEEKLY_SCHEDULE[day.key].end_time : "",
    };

    return result;
  }, {});

function RestaurantTimings() {
  const [form, setForm] = useState({
    institution_name: "",
    restaurant_name: "",
    timezone_name: "Asia/Kolkata",
    manual_override_enabled: false,
    manual_is_active: true,
    schedule_enabled: true,
    weekly_schedule: normalizeSchedule(DEFAULT_WEEKLY_SCHEDULE),
  });
  const [statusInfo, setStatusInfo] = useState({
    current_status: 0,
    current_status_source: "manual",
    current_time: "",
    current_day: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const applySettings = (settings) => {
    setForm({
      institution_name: settings?.institution_name || "",
      restaurant_name: settings?.restaurant_name || "",
      timezone_name: settings?.timezone_name || "Asia/Kolkata",
      manual_override_enabled: Number(settings?.manual_override_enabled) === 1,
      manual_is_active: Number(settings?.manual_is_active) === 1,
      schedule_enabled: Number(settings?.schedule_enabled) === 1,
      weekly_schedule: normalizeSchedule(settings?.weekly_schedule || DEFAULT_WEEKLY_SCHEDULE),
    });

    setStatusInfo({
      current_status: Number(settings?.current_status) === 1 ? 1 : 0,
      current_status_source: settings?.current_status_source || "manual",
      current_time: settings?.current_time || "",
      current_day: settings?.current_day || "",
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

  const setScheduleValue = (dayKey, field, value) => {
    setForm((current) => {
      const currentDay = current.weekly_schedule[dayKey];
      const nextDay = { ...currentDay, [field]: value };

      if (field === "enabled") {
        nextDay.closed = !value;
        if (value) {
          nextDay.start_time = nextDay.start_time || DEFAULT_WEEKLY_SCHEDULE[dayKey].start_time;
          nextDay.end_time = nextDay.end_time || DEFAULT_WEEKLY_SCHEDULE[dayKey].end_time;
        }
      }

      if (field === "closed") {
        nextDay.enabled = !value;
        if (!value) {
          nextDay.start_time = nextDay.start_time || DEFAULT_WEEKLY_SCHEDULE[dayKey].start_time;
          nextDay.end_time = nextDay.end_time || DEFAULT_WEEKLY_SCHEDULE[dayKey].end_time;
        }
      }

      return {
        ...current,
        weekly_schedule: {
          ...current.weekly_schedule,
          [dayKey]: nextDay,
        },
      };
    });
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
          manual_override_enabled: 1,
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
          manual_override_enabled: form.manual_override_enabled ? 1 : 0,
          manual_is_active: form.manual_is_active ? 1 : 0,
          schedule_enabled: form.schedule_enabled ? 1 : 0,
          weekly_schedule: form.weekly_schedule,
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
          subtitle="Manage manual override and automatic weekly availability."
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
        subtitle="Control live availability with a manual override or automatic weekly schedule."
      />

      <div className="grid gap-4 rounded-[8px] border border-[#d8ece3] bg-white px-[22px] py-[18px] shadow-[0_10px_30px_rgba(30,76,60,0.08)] max-sm:p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div
          className={
            statusInfo.current_status === 1
              ? "min-w-[154px] rounded-[8px] bg-green-100 px-4 py-2.5 text-center font-extrabold text-green-800"
              : "min-w-[154px] rounded-[8px] bg-red-100 px-4 py-2.5 text-center font-extrabold text-red-800"
          }
        >
          {statusInfo.current_status === 1 ? "Open Now" : "Closed Now"}
        </div>
        <div className="grid min-w-0 gap-[6px]">
          <strong className="text-[#1f2937]">
            Source: {statusInfo.current_status_source}
          </strong>
          <span className="text-[0.92rem] text-slate-500">
            Local time: {statusInfo.current_time || "--:--"} | Timezone: {form.timezone_name}
          </span>
        </div>
        <button
          type="button"
          className={`inline-flex w-fit items-center gap-2.5 rounded-[8px] border border-slate-300 px-[14px] py-2 ${
            form.manual_is_active ? "bg-emerald-50 text-green-800" : "bg-white text-slate-700"
          }`}
          onClick={handleToggle}
          disabled={isToggling}
        >
          <span className={`h-3 w-3 rounded-full ${form.manual_is_active ? "bg-green-500" : "bg-slate-400"}`} />
          {isToggling ? "Updating..." : form.manual_is_active ? "Set Manual Closed" : "Set Manual Open"}
        </button>
      </div>

      <form className="grid gap-5 rounded-[8px] border border-[rgba(148,163,184,0.22)] bg-white/82 p-[22px] shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-[12px]" onSubmit={handleSubmit}>
        <div className="grid gap-[18px] lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Institution Name</span>
            <input
              type="text"
              value={form.institution_name}
              onChange={(event) => setFieldValue("institution_name", event.target.value)}
              placeholder="Institution owner or group"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Restaurant Name</span>
            <input
              type="text"
              value={form.restaurant_name}
              onChange={(event) => setFieldValue("restaurant_name", event.target.value)}
              placeholder="Restaurant name"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[0.92rem] font-semibold text-slate-600">Timezone</span>
            <input
              type="text"
              value={form.timezone_name}
              onChange={(event) => setFieldValue("timezone_name", event.target.value)}
              placeholder="Asia/Kolkata"
              className="w-full rounded-[8px] border border-slate-300 bg-white px-[14px] py-3 text-slate-900 outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <strong className="text-slate-900">Manual Override</strong>
              <span className="text-[0.9rem] text-slate-500">
                When enabled, manual open or closed state ignores the schedule.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-[8px] border px-4 py-2 font-semibold ${
                  form.manual_override_enabled
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => setFieldValue("manual_override_enabled", !form.manual_override_enabled)}
              >
                Override {form.manual_override_enabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                className={`rounded-[8px] border px-4 py-2 font-semibold ${
                  form.manual_is_active
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                onClick={() => setFieldValue("manual_is_active", !form.manual_is_active)}
              >
                Manual {form.manual_is_active ? "Open" : "Closed"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <strong className="text-slate-900">Automatic Weekly Schedule</strong>
              <span className="text-[0.9rem] text-slate-500">
                Overnight closing times are supported, such as Friday 07:00 to 02:00.
              </span>
            </div>
            <button
              type="button"
              className={`rounded-[8px] border px-4 py-2 font-semibold ${
                form.schedule_enabled
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
              onClick={() => setFieldValue("schedule_enabled", !form.schedule_enabled)}
            >
              Schedule {form.schedule_enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[0.82rem] uppercase text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Day</th>
                  <th className="py-3 pr-4 font-semibold">Active</th>
                  <th className="py-3 pr-4 font-semibold">Opening Time</th>
                  <th className="py-3 pr-4 font-semibold">Closing Time</th>
                  <th className="py-3 pr-4 font-semibold">Closed</th>
                </tr>
              </thead>
              <tbody>
                {WEEK_DAYS.map((day) => {
                  const schedule = form.weekly_schedule[day.key];
                  const disabled = !form.schedule_enabled || schedule.closed;

                  return (
                    <tr key={day.key} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{day.label}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          disabled={!form.schedule_enabled}
                          onChange={(event) => setScheduleValue(day.key, "enabled", event.target.checked)}
                          className="h-5 w-5 accent-orange-500"
                          aria-label={`${day.label} active`}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="time"
                          value={schedule.start_time || ""}
                          disabled={disabled}
                          onChange={(event) => setScheduleValue(day.key, "start_time", event.target.value)}
                          className="w-full min-w-[130px] rounded-[8px] border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="time"
                          value={schedule.end_time || ""}
                          disabled={disabled}
                          onChange={(event) => setScheduleValue(day.key, "end_time", event.target.value)}
                          className="w-full min-w-[130px] rounded-[8px] border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="checkbox"
                          checked={schedule.closed}
                          disabled={!form.schedule_enabled}
                          onChange={(event) => setScheduleValue(day.key, "closed", event.target.checked)}
                          className="h-5 w-5 accent-red-500"
                          aria-label={`${day.label} closed`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-0.5 flex flex-wrap gap-2.5">
          <button type="submit" className="rounded-[8px] border-0 bg-orange-500 px-4 py-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RestaurantTimings;
