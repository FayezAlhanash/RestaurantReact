const STRIPE_JS_URL = "https://js.stripe.com/v3/";
const STRIPE_LOAD_TIMEOUT_MS = 10000;

let stripePromise;

function getStripeKey() {
    return (
        import.meta.env.VITE_STRIPE_KEY ||
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );
}

function loadStripeScript() {
    const existingScript = document.querySelector(
        `script[src="${STRIPE_JS_URL}"]`,
    );

    if (existingScript) {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            if (existingScript.dataset.loadError === "true") {
                reject(
                    new Error(
                        "Stripe could not be loaded. Check your connection.",
                    ),
                );
                return;
            }

            const timeoutId = window.setTimeout(() => {
                reject(
                    new Error(
                        "Stripe is taking too long to load. Check your connection and try again.",
                    ),
                );
            }, STRIPE_LOAD_TIMEOUT_MS);
            const cleanup = () => window.clearTimeout(timeoutId);

            existingScript.addEventListener(
                "load",
                () => {
                    cleanup();

                    if (window.Stripe) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            "Stripe could not be loaded. Check your connection.",
                        ),
                    );
                },
                { once: true },
            );
            existingScript.addEventListener(
                "error",
                () => {
                    cleanup();
                    existingScript.dataset.loadError = "true";
                    reject(
                        new Error(
                            "Stripe could not be loaded. Check your connection.",
                        ),
                    );
                },
                { once: true },
            );
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timeoutId = window.setTimeout(() => {
            reject(
                new Error(
                    "Stripe is taking too long to load. Check your connection and try again.",
                ),
            );
        }, STRIPE_LOAD_TIMEOUT_MS);
        const cleanup = () => window.clearTimeout(timeoutId);

        script.src = STRIPE_JS_URL;
        script.async = true;
        script.onload = () => {
            cleanup();

            if (window.Stripe) {
                resolve();
                return;
            }

            reject(
                new Error("Stripe could not be loaded. Check your connection."),
            );
        };
        script.onerror = () => {
            cleanup();
            script.dataset.loadError = "true";
            reject(
                new Error("Stripe could not be loaded. Check your connection."),
            );
        };
        document.head.appendChild(script);
    });
}

export async function getStripe() {
    const key = getStripeKey();

    if (!key) {
        throw new Error("Stripe publishable key is missing.");
    }

    if (!stripePromise) {
        stripePromise = loadStripeScript()
            .then(() => {
                const stripe = window.Stripe(key);

                if (!stripe) {
                    throw new Error(
                        "Stripe could not start. Check the publishable key.",
                    );
                }

                return stripe;
            })
            .catch((error) => {
                stripePromise = null;
                throw error;
            });
    }

    return stripePromise;
}

export function preloadStripe() {
    getStripe().catch(() => {});
}

export async function createStripeCardElement(container) {
    if (!container) return null;

    container.replaceChildren();

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
