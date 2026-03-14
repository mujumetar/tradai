import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCvWGmzMpLCJO73-diWhqEZxKo_xrG1mjw",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tradai-68b07.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tradai-68b07",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tradai-68b07.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "166225729814",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166225729814:web:1964a2aaf3f8e077731837",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LFDH7QY04Z"
};

let app;
let messaging;

try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
} catch (e) {
    console.warn("Firebase init failed:", e);
}

/**
 * Request permission and get FCM token.
 * Returns the token string on success, null on failure.
 * Never throws — all errors are caught internally.
 */
export const requestFcmToken = async () => {
    try {
        if (!messaging) return null;

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        // Only proceed with FCM if a real VAPID key is configured
        if (!vapidKey || vapidKey === "YOUR_VAPID_BROWSER_KEY" || vapidKey.trim() === "") {
            console.info("FCM VAPID key not configured — skipping FCM, using Web Push only.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const token = await getToken(messaging, { vapidKey });
        if (!token) {
            console.warn("No FCM registration token available.");
            return null;
        }

        // Save token to backend (non-fatal if this fails)
        try {
            await api.post('/users/fcm-token', { token });
            console.log("FCM Token saved successfully");
        } catch (saveErr) {
            console.warn("FCM token save failed (non-fatal):", saveErr);
        }

        return token;
    } catch (error) {
        console.warn("FCM token retrieval failed (non-fatal):", error);
        return null;
    }
};

/**
 * Listen for foreground FCM messages and show a notification.
 */
export const onForegroundMessage = () => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
        console.log("Foreground Message received:", payload);
        const { title, body } = payload.notification || {};
        if (title && Notification.permission === "granted") {
            new Notification(title, { body, icon: '/icon-192.png' });
        }
    });
};

export { messaging };
