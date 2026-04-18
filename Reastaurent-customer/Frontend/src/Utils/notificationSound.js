let audioContextRef = null;
let customerAlertIntervalRef = null;
let customerAlertTimeoutRef = null;

const CUSTOMER_ALERT_REPEAT_MS = 2000;
const CUSTOMER_ALERT_DURATION_MS = 30000;

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

      oscillator.type = step.type || "triangle";
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

const playCustomerPulse = () =>
  playToneSequence([
    { frequency: 784, duration: 0.12, delay: 0.2, volume: 0.1, type: "triangle" },
    { frequency: 988, duration: 0.16, delay: 0.2, volume: 0.11, type: "triangle" },
  ]);

export const stopCustomerNotificationAlert = () => {
  if (customerAlertIntervalRef) {
    clearInterval(customerAlertIntervalRef);
    customerAlertIntervalRef = null;
  }

  if (customerAlertTimeoutRef) {
    clearTimeout(customerAlertTimeoutRef);
    customerAlertTimeoutRef = null;
  }
};

export const startCustomerNotificationAlert = () => {
  stopCustomerNotificationAlert();
  void playCustomerPulse();

  customerAlertIntervalRef = setInterval(() => {
    void playCustomerPulse();
  }, CUSTOMER_ALERT_REPEAT_MS);

  customerAlertTimeoutRef = setTimeout(() => {
    stopCustomerNotificationAlert();
  }, CUSTOMER_ALERT_DURATION_MS);
};
