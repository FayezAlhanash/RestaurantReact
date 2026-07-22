/* global firebase */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCF_Ezj2iyTG_91CcxY1HBAURkp1HBGn-4",
    authDomain: "restaurant-notifications-8d51b.firebaseapp.com",
    projectId: "restaurant-notifications-8d51b",
    storageBucket: "restaurant-notifications-8d51b.firebasestorage.app",
    messagingSenderId: "772161478823",
    appId: "1:772161478823:web:c513aa8e1f64117e0abb82",
    measurementId: "G-78BFCRVF5V",
});

const messaging = firebase.messaging();

function getNotificationTargetUrl(data = {}) {
    const target = new URL(data.url || "/", self.location.origin);
    const isTakeawayPath = [
        "/takeaway-orders",
        "/cashier",
        "/kitchen/takeaway-orders",
        "/warehouse/takeaway-orders",
        "/manager/takeaway-orders",
    ].includes(target.pathname);

    if (isTakeawayPath && !target.searchParams.get("view")) {
        target.searchParams.set("view", "orders");
    }

    const orderId =
        data.orderId ||
        data.order_id ||
        data.cashier_order_id ||
        data.restaurant_order_id;

    if (isTakeawayPath && orderId && !target.searchParams.get("orderId")) {
        target.searchParams.set("orderId", orderId);
    }

    return target.href;
}

messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = notification.title || data.title || "Big-4";
    const options = {
        body: notification.body || data.body || "You have a new notification.",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        data,
    };

    self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = getNotificationTargetUrl(event.notification.data);

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const matchingClient = clients.find((client) =>
                    client.url.includes(self.location.origin)
                );

                if (matchingClient) {
                    matchingClient.focus();
                    matchingClient.navigate(targetUrl);
                    return;
                }

                return self.clients.openWindow(targetUrl);
            })
    );
});
