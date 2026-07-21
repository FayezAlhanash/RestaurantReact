importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCF_Ezj2iyTG_91CcxY1HBAURkp1HBGn-4",
  authDomain: "restaurant-notifications-8d51b.firebaseapp.com",
  projectId: "restaurant-notifications-8d51b",
  storageBucket: "restaurant-notifications-8d51b.firebasestorage.app",
  messagingSenderId: "772161478823",
  appId: "1:772161478823:web:c513aa8e1f64117e0abb82",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
    }
  );
});

