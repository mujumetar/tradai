// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

/**
 * REPLACE these values with your Firebase Project settings
 */
firebase.initializeApp({
    apiKey: "AIzaSyCvWGmzMpLCJO73-diWhqEZxKo_xrG1mjw",
    authDomain: "tradai-68b07.firebaseapp.com",
    projectId: "tradai-68b07",
    storageBucket: "tradai-68b07.firebasestorage.app",
    messagingSenderId: "166225729814",
    appId: "1:166225729814:web:1964a2aaf3f8e077731837",
    measurementId: "G-LFDH7QY04Z"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message Received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'TRADAI Alert';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'New content available',
        icon: '/logo.png',
        badge: '/logo.png',
        data: {
            url: payload.notification?.data?.url || payload.data?.url || '/research'
        },
        actions: [
            { action: 'view', title: 'View Research' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
