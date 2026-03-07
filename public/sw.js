self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'New Update', body: 'Check out the new trade idea!' };

    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
            url: data.url || '/research'
        },
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Open App' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

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
