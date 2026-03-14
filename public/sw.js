self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'New Update', body: 'Check out the new trade idea!' };

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        data: {
            url: data.data?.url || data.url || '/research'
        },
        vibrate: data.vibrate || [100, 50, 100],
        actions: data.actions || [
            { action: 'open', title: 'Open App', icon: '/icon-192.png' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    const urlToOpen = new URL(notification.data.url, self.location.origin).href;

    if (action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
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
