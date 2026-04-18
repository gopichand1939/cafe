import customerBeepUrl from "../assets/customer-beep.mp3";

let customerAudioRef = null;
let customerAlertTimeoutRef = null;

const CUSTOMER_ALERT_DURATION_MS = 30000;

const getCustomerAudio = () => {
  if (typeof Audio === "undefined") {
    return null;
  }

  if (!customerAudioRef) {
    const audio = new Audio(customerBeepUrl);
    audio.preload = "auto";
    audio.loop = true; 
    audio.volume = 1;
    customerAudioRef = audio;
  }

  return customerAudioRef;
};

export const stopCustomerNotificationAlert = () => {
  if (customerAlertTimeoutRef) {
    clearTimeout(customerAlertTimeoutRef);
    customerAlertTimeoutRef = null;
  }

  const audio = getCustomerAudio();

  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
};

export const startCustomerNotificationAlert = () => {
  stopCustomerNotificationAlert();

  const audio = getCustomerAudio();

  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  void audio.play().catch(() => {});

  customerAlertTimeoutRef = setTimeout(() => {
    stopCustomerNotificationAlert();
  }, CUSTOMER_ALERT_DURATION_MS);
};
