import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api";

/**
 * Firebase Configuration
 * 
 * REPLACE these values with your Firebase Project settings from the Console:
 * Project Settings -> General -> Your apps -> Web apps
 */
const firebaseConfig = {
    apiKey: "AIzaSyCvWGmzMpLCJO73-diWhqEZxKo_xrG1mjw",
    authDomain: "tradai-68b07.firebaseapp.com",
    projectId: "tradai-68b07",
    storageBucket: "tradai-68b07.firebasestorage.app",
    messagingSenderId: "1:166225729814:web:1964a2aaf3f8e077731837",
    appId: "G-LFDH7QY04Z"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Request permission and get FCM token
 */
export const requestFcmToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messaging, {
                // Get this from: Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
                vapidKey: "YOUR_VAPID_BROWSER_KEY"
            });

            if (token) {
                // Save token to backend
                await api.post('/users/fcm-token', { token });
                console.log("FCM Token saved successfully");
                return token;
            } else {
                console.warn("No registration token available. Request permission to generate one.");
            }
        } else {
            console.warn("Notification permission denied");
        }
    } catch (error) {
        console.error("An error occurred while retrieving token:", error);
    }
    return null;
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = () => {
    onMessage(messaging, (payload) => {
        console.log("Foreground Message received:", payload);
        // You can show a custom toast notification here if you want
        const { title, body } = payload.notification;
        new Notification(title, { body, icon: '/icon-192.png' });
    });
};

export { messaging };
