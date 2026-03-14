self.addEventListener('push', (event) => {
    let data = { title: 'New Update', body: 'Check out the new trade idea!', url: '/research' };
    
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('Push data parse error:', e);
    }

    const options = {
        body: data.body || 'New content available',
        // Use relative paths; the browser handles resolution relative to SW location
        icon: '/icon-192.png', 
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        tag: 'liquide-alert-' + (data.id || Date.now()),
        renotify: true,
        data: {
            url: data.data?.url || data.url || '/research'
        },
        actions: [
            { action: 'view', title: 'View Now' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'liquide Update', options)
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
