import { STRIPE_PUBLISHABLE_KEY } from "./Constant";

let stripePromise = null;

const loadStripeScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Stripe is available only in the browser"));
      return;
    }

    if (window.Stripe) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://js.stripe.com/v3/"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load Stripe"));
    document.head.appendChild(script);
  });

export const getStripeClient = async () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error("Stripe publishable key is not configured");
  }

  if (!stripePromise) {
    stripePromise = loadStripeScript().then(() => window.Stripe(STRIPE_PUBLISHABLE_KEY));
  }

  return stripePromise;
};
