import api from './api';

const VAPID_PUBLIC_KEY = 'BCK4aX5sj401ksB2gylg3jVDSfF5g09MS10-VkmqdiuwY5Sfe5bXjbc_oQdZQ8MlDncwkIIDzxF30bWx8Pi2A6g';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const subscribeToPush = async () => {
    console.log("[Push] Starting subscription flow...");
    if (!('serviceWorker' in navigator)) {
        console.error("[Push] Service workers not supported");
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log("[Push] Service worker ready:", registration.scope);

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    console.log("[Push] Current subscription:", subscription ? "Found" : "None");

    if (!subscription) {
        console.log("[Push] Requesting new subscription...");
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log("[Push] Subscription granted!");
    }

    // Save to backend
    console.log("[Push] Saving to backend...");
    try {
        const res = await api.post('/users/push-subscribe', { subscription });
        console.log("[Push] Backend response:", res.data);
    } catch (err) {
        console.error("[Push] Failed to save to backend:", err.response?.data || err.message);
        throw err;
    }
    return subscription;
};

export const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
        await api.post('/users/push-unsubscribe', { endpoint: subscription.endpoint });
    }
};

export const getPushSubscription = async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
};
