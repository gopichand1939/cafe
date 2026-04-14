const restaurantSettingsModel = require("./restaurantSettingsModel");

const TIME_FORMATTER_CACHE = new Map();

const getTimeFormatter = (timezoneName) => {
  if (!TIME_FORMATTER_CACHE.has(timezoneName)) {
    TIME_FORMATTER_CACHE.set(
      timezoneName,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezoneName,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    );
  }

  return TIME_FORMATTER_CACHE.get(timezoneName);
};

const getCurrentTimeInTimezone = (timezoneName) => {
  try {
    return getTimeFormatter(timezoneName).format(new Date());
  } catch (_error) {
    return getTimeFormatter("Asia/Kolkata").format(new Date());
  }
};

const normalizeTime = (value) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

const isValidTimeString = (value) => /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(String(value));

const isWithinScheduledWindow = (currentTime, startTime, endTime) => {
  if (!startTime || !endTime) {
    return false;
  }

  if (startTime === endTime) {
    return true;
  }

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }

  return currentTime >= startTime || currentTime <= endTime;
};

const buildSettingsResponse = (settings) => {
  const timezoneName = settings.timezone_name || "Asia/Kolkata";
  const currentTime = getCurrentTimeInTimezone(timezoneName);
  const startTime = normalizeTime(settings.schedule_start_time);
  const endTime = normalizeTime(settings.schedule_end_time);
  const scheduleEnabled = Number(settings.schedule_enabled) === 1;
  const manualIsActive = Number(settings.manual_is_active) === 1;

  const scheduleIsActive =
    scheduleEnabled && startTime && endTime
      ? isWithinScheduledWindow(currentTime, startTime, endTime)
      : false;

  const currentStatus = scheduleEnabled ? scheduleIsActive : manualIsActive;

  return {
    ...settings,
    schedule_start_time: startTime ? startTime.slice(0, 5) : "",
    schedule_end_time: endTime ? endTime.slice(0, 5) : "",
    current_status: currentStatus ? 1 : 0,
    current_status_source: scheduleEnabled ? "schedule" : "manual",
    current_time: currentTime.slice(0, 5),
    schedule_is_active_now: scheduleIsActive ? 1 : 0,
  };
};

const getRestaurantSettings = async (req, res) => {
  try {
    const settings = await restaurantSettingsModel.getByAdminId(req.admin.id);

    return res.status(200).json({
      success: true,
      data: buildSettingsResponse(settings),
    });
  } catch (error) {
    console.error("Error fetching restaurant settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateRestaurantSettings = async (req, res) => {
  try {
    const {
      institution_name,
      restaurant_name,
      manual_is_active,
      schedule_enabled,
      schedule_start_time,
      schedule_end_time,
      timezone_name,
    } = req.body;

    if (!institution_name || !restaurant_name) {
      return res.status(400).json({
        success: false,
        message: "institution_name and restaurant_name are required",
      });
    }

    const normalizedStartTime = normalizeTime(schedule_start_time);
    const normalizedEndTime = normalizeTime(schedule_end_time);
    const normalizedScheduleEnabled = Number(schedule_enabled) === 1 ? 1 : 0;
    const normalizedManualIsActive = Number(manual_is_active) === 0 ? 0 : 1;

    if (normalizedScheduleEnabled) {
      if (!normalizedStartTime || !normalizedEndTime) {
        return res.status(400).json({
          success: false,
          message: "schedule_start_time and schedule_end_time are required when schedule is enabled",
        });
      }

      if (!isValidTimeString(normalizedStartTime) || !isValidTimeString(normalizedEndTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid schedule time format. Use HH:MM",
        });
      }
    }

    const settings = await restaurantSettingsModel.upsertByAdminId({
      adminId: req.admin.id,
      institutionName: String(institution_name).trim(),
      restaurantName: String(restaurant_name).trim(),
      manualIsActive: normalizedManualIsActive,
      scheduleEnabled: normalizedScheduleEnabled,
      scheduleStartTime: normalizedScheduleEnabled ? normalizedStartTime : null,
      scheduleEndTime: normalizedScheduleEnabled ? normalizedEndTime : null,
      timezoneName: timezone_name ? String(timezone_name).trim() : "Asia/Kolkata",
    });

    return res.status(200).json({
      success: true,
      message: "Restaurant settings updated successfully",
      data: buildSettingsResponse(settings),
    });
  } catch (error) {
    console.error("Error updating restaurant settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const toggleRestaurantStatus = async (req, res) => {
  try {
    const { manual_is_active } = req.body;

    if (typeof manual_is_active === "undefined") {
      return res.status(400).json({
        success: false,
        message: "manual_is_active is required",
      });
    }

    const settings = await restaurantSettingsModel.updateManualStatus(
      req.admin.id,
      Number(manual_is_active) === 0 ? 0 : 1
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant status updated successfully",
      data: buildSettingsResponse(settings),
    });
  } catch (error) {
    console.error("Error toggling restaurant status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getRestaurantSettings,
  updateRestaurantSettings,
  toggleRestaurantStatus,
};
