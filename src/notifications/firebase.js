import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

export const firebaseConfig = {
    apiKey: "AIzaSyCF_Ezj2iyTG_91CcxY1HBAURkp1HBGn-4",
    authDomain: "restaurant-notifications-8d51b.firebaseapp.com",
    projectId: "restaurant-notifications-8d51b",
    storageBucket: "restaurant-notifications-8d51b.firebasestorage.app",
    messagingSenderId: "772161478823",
    appId: "1:772161478823:web:c513aa8e1f64117e0abb82",
    measurementId: "G-78BFCRVF5V",
};

export const firebaseVapidKey =
    "BF_5VThP_92VkDd4OXqisvA2oAreP6PqPb04IkxaQcwGDC4is_pCfhAhANv4DW3gPDT8FceIsBzFMLAwFyfE-IA";
const firebaseApp = initializeApp(firebaseConfig);

export async function getFirebaseMessaging() {
    if (!(await isSupported())) return null;

    return getMessaging(firebaseApp);
}

export async function requestFcmToken(registration) {
    const messaging = await getFirebaseMessaging();

    if (!messaging) return "";

    return getToken(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: registration,
    });
}

export async function listenForForegroundMessages(callback) {
    const messaging = await getFirebaseMessaging();

    if (!messaging) return () => {};

    return onMessage(messaging, callback);
}
