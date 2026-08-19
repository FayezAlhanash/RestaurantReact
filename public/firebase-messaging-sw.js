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

function isKitchenOrderNotification(data = {}) {
    const text = [
        data.title,
        data.body,
        data.message,
        data.url,
        data.type,
        data.notification_type,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
        text.includes("pickup") ||
        text.includes("picked up") ||
        text.includes("ready takeaway")
    ) {
        return false;
    }

    return (
        text.includes("new kitchen order") ||
        text.includes("kitchen order") ||
        text.includes("ready to prepare") ||
        text.includes("/kitchen-orders") ||
        text.includes("/kitchen/dashboard")
    );
}

function getNotificationTargetUrl(data = {}) {
    if (isKitchenOrderNotification(data)) {
        return new URL("/kitchen/dashboard", self.location.origin).href;
    }

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
