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
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
    }

    // Save to backend
    await api.post('/users/push-subscribe', { subscription });
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
