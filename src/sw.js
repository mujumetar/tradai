import { precacheAndRoute } from 'workbox-precaching';

// Inject manifest for PWA precaching
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
    console.log('[SW] Push Received. Data:', event.data ? event.data.text() : 'No data');
    
    let payload = {
        title: 'TRADAI Alert', 
        body: 'New trade idea available!', 
        url: '/research' 
    };
    
    if (event.data) {
        try {
            const parsed = event.data.json();
            console.log('[SW] Parsed Payload:', parsed);
            payload.title = parsed.notification?.title || parsed.title || payload.title;
            payload.body = parsed.notification?.body || parsed.body || payload.body;
            payload.url = parsed.data?.url || (parsed.notification?.data?.url) || parsed.url || payload.url;
        } catch (e) {
            console.warn('[SW] Payload not JSON, using text fallback');
            payload.body = event.data.text() || payload.body;
        }
    }

    const options = {
        body: payload.body,
        icon: '/logo.png', 
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        tag: 'tradai-alert', // Static tag so new alerts replace old ones of same type
        renotify: true,
        data: {
            url: payload.url
        },
        actions: [
            { action: 'view', title: 'View Research' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    console.log('[SW] Showing Notification:', payload.title, options);
    event.waitUntil(
        self.registration.showNotification(payload.title, options)
            .catch(err => console.error('[SW] showNotification error:', err))
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Stop propagation to prevent browser from handling the click with default URL copy/share dialog
    event.stopImmediatePropagation();

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
