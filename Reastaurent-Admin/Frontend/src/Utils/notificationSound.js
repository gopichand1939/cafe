import adminBeepUrl from "../assets/admin-beep.wav";

let adminAudioRef = null;
let adminAlertTimeoutRef = null;

const ADMIN_ALERT_DURATION_MS = 30000;

const getAdminAudio = () => {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!adminAudioRef) {
    const audio = new Audio(adminBeepUrl);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 1;
    adminAudioRef = audio;
  }

  return adminAudioRef;
};

export const stopAdminNotificationAlert = () => {
  if (adminAlertTimeoutRef) {
    clearTimeout(adminAlertTimeoutRef);
    adminAlertTimeoutRef = null;
  }

  const audio = getAdminAudio();

  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
};

export const startAdminNotificationAlert = () => {
  stopAdminNotificationAlert();

  const audio = getAdminAudio();

  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  void audio.play().catch(() => {});

  adminAlertTimeoutRef = setTimeout(() => {
    stopAdminNotificationAlert();
  }, ADMIN_ALERT_DURATION_MS);
};
