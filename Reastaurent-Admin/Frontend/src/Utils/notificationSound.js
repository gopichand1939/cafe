let audioContextRef = null;
let adminAlertIntervalRef = null;
let adminAlertTimeoutRef = null;

const ADMIN_ALERT_REPEAT_MS = 1800;
const ADMIN_ALERT_DURATION_MS = 30000;

const getAudioContext = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext || null;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContextRef) {
    audioContextRef = new AudioContextConstructor();
  }

  return audioContextRef;
};

const playToneSequence = async (sequence) => {
  try {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const startAt = audioContext.currentTime + 0.02;

    sequence.forEach((step, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const noteStart = startAt + index * step.delay;
      const noteEnd = noteStart + step.duration;

      oscillator.type = step.type || "square";
      oscillator.frequency.setValueAtTime(step.frequency, noteStart);

      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(step.volume, noteStart + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.02);
    });
  } catch (_error) {
    // Sound should never block notification flow.
  }
};

const playAdminPulse = () =>
  playToneSequence([
    { frequency: 1046, duration: 0.12, delay: 0.18, volume: 0.12, type: "square" },
    { frequency: 1318, duration: 0.12, delay: 0.18, volume: 0.13, type: "square" },
    { frequency: 1046, duration: 0.14, delay: 0.18, volume: 0.12, type: "square" },
  ]);

export const stopAdminNotificationAlert = () => {
  if (adminAlertIntervalRef) {
    clearInterval(adminAlertIntervalRef);
    adminAlertIntervalRef = null;
  }

  if (adminAlertTimeoutRef) {
    clearTimeout(adminAlertTimeoutRef);
    adminAlertTimeoutRef = null;
  }
};

export const startAdminNotificationAlert = () => {
  stopAdminNotificationAlert();
  void playAdminPulse();

  adminAlertIntervalRef = setInterval(() => {
    void playAdminPulse();
  }, ADMIN_ALERT_REPEAT_MS);

  adminAlertTimeoutRef = setTimeout(() => {
    stopAdminNotificationAlert();
  }, ADMIN_ALERT_DURATION_MS);
};
