self.addEventListener('push', (event) => {
    let payload = {
        title: 'New Update', 
        body: 'Check out the new trade idea!', 
        url: '/research' 
    };
    
    try {
        if (event.data) {
            const parsed = event.data.json();
            payload.title = parsed.notification?.title || parsed.title || payload.title;
            payload.body = parsed.notification?.body || parsed.body || payload.body;
            payload.url = parsed.data?.url || parsed.url || payload.url;
        }
    } catch (e) {
        console.error('Push data parse error:', e);
    }

    const options = {
        body: payload.body,
        // Use relative paths; the browser handles resolution relative to SW location
        icon: '/logo.png', 
        badge: '/logo.png',
        vibrate: [100, 50, 100],
        tag: 'liquide-alert-' + Date.now(),
        renotify: true,
        data: {
            url: payload.url
        },
        actions: [
            { action: 'view', title: 'View Now' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
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
