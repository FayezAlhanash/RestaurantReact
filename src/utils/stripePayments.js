const STRIPE_JS_URL = "https://js.stripe.com/v3/";

let stripePromise;

function getStripeKey() {
    return (
        import.meta.env.VITE_STRIPE_KEY ||
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );
}

function loadStripeScript() {
    const existingScript = document.querySelector(`script[src="${STRIPE_JS_URL}"]`);

    if (existingScript) {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            existingScript.addEventListener("load", resolve, { once: true });
            existingScript.addEventListener("error", reject, { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = STRIPE_JS_URL;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function getStripe() {
    const key = getStripeKey();

    if (!key) {
        throw new Error("Stripe publishable key is missing.");
    }

    if (!stripePromise) {
        stripePromise = loadStripeScript().then(() => window.Stripe(key));
    }

    return stripePromise;
}

export async function createStripeCardElement(container) {
    if (!container) return null;

    const stripe = await getStripe();
    const elements = stripe.elements();
    const card = elements.create("card", {
        style: {
            base: {
                color: "#261F1D",
                fontFamily: "Merriweather, Georgia, serif",
                fontSize: "15px",
                "::placeholder": {
                    color: "#A28F87",
                },
            },
            invalid: {
                color: "#B91C1C",
            },
        },
    });

    card.mount(container);

    return { stripe, elements, card };
}

export function findStripeClientSecret(value, seen = new Set()) {
    if (!value || typeof value !== "object" || seen.has(value)) return null;

    seen.add(value);

    const directValue =
        value.client_secret ??
        value.clientSecret ??
        value.payment_intent_client_secret ??
        value.paymentIntentClientSecret;

    if (directValue) return directValue;

    for (const child of Object.values(value)) {
        const clientSecret = findStripeClientSecret(child, seen);

        if (clientSecret) return clientSecret;
    }

    return null;
}

export async function confirmStripePayment(clientSecret, card) {
    if (!clientSecret) {
        throw new Error("Stripe client secret was not returned by the API.");
    }

    if (!card) {
        throw new Error("Enter card details before paying with Stripe.");
    }

    const stripe = await getStripe();
    const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card,
        },
    });

    if (result.error) {
        throw new Error(result.error.message || "Stripe payment failed.");
    }

    return result.paymentIntent;
}
