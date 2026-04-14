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
      <div className="form-page">
        <PageHeader
          title="Restaurant Timings"
          subtitle="Manage manual open or close state and automatic active schedule."
        />
        <div className="panel form-panel">
          <div className="empty-state">
            <div className="loader" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <PageHeader
        title="Restaurant Timings"
        subtitle="The logged-in admin can manually toggle restaurant status or define the active time range."
      />

      <div className="restaurant-status-strip">
        <div
          className={
            statusInfo.current_status === 1
              ? "restaurant-status-badge active"
              : "restaurant-status-badge inactive"
          }
        >
          {statusInfo.current_status === 1 ? "Currently Active" : "Currently Inactive"}
        </div>
        <div className="restaurant-status-copy">
          <strong>
            Controlled by {statusInfo.current_status_source === "schedule" ? "schedule" : "manual"}
          </strong>
          <span>
            Local time: {statusInfo.current_time || "--:--"} | Timezone: {form.timezone_name}
          </span>
        </div>
        <button
          type="button"
          className={form.manual_is_active ? "toggle on" : "toggle"}
          onClick={handleToggle}
          disabled={isToggling}
        >
          <span />
          {isToggling ? "Updating..." : form.manual_is_active ? "Manual Active" : "Manual Inactive"}
        </button>
      </div>

      <form className="panel form-panel restaurant-settings-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-main-column">
            <div className="field">
              <span>Institution Name</span>
              <input
                type="text"
                value={form.institution_name}
                onChange={(event) => setFieldValue("institution_name", event.target.value)}
                placeholder="Institution owner or group"
              />
            </div>

            <div className="field">
              <span>Restaurant Name</span>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(event) => setFieldValue("restaurant_name", event.target.value)}
                placeholder="Restaurant name"
              />
            </div>

            <div className="field">
              <span>Timezone</span>
              <input
                type="text"
                value={form.timezone_name}
                onChange={(event) => setFieldValue("timezone_name", event.target.value)}
                placeholder="Asia/Kolkata"
              />
            </div>
          </div>

          <div className="form-side-column">
            <div className="restaurant-schedule-panel">
              <div className="restaurant-schedule-head">
                <strong>Automatic Schedule</strong>
                <button
                  type="button"
                  className={form.schedule_enabled ? "toggle on" : "toggle"}
                  onClick={() => setFieldValue("schedule_enabled", !form.schedule_enabled)}
                >
                  <span />
                  {form.schedule_enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="restaurant-time-grid">
                <div className="field">
                  <span>Start Time</span>
                  <input
                    type="time"
                    value={form.schedule_start_time}
                    onChange={(event) => setFieldValue("schedule_start_time", event.target.value)}
                    disabled={!form.schedule_enabled}
                  />
                </div>

                <div className="field">
                  <span>End Time</span>
                  <input
                    type="time"
                    value={form.schedule_end_time}
                    onChange={(event) => setFieldValue("schedule_end_time", event.target.value)}
                    disabled={!form.schedule_enabled}
                  />
                </div>
              </div>

              <p className="restaurant-schedule-note">
                If schedule is enabled, the restaurant stays active only inside the selected start and
                end time. Outside that period it becomes inactive.
              </p>
            </div>
          </div>
        </div>

        <div className="button-row form-actions-row">
          <button type="submit" className="primary-btn" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Timings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RestaurantTimings;
