import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Pusher from 'pusher-js';

/**
 * useSocket — dual-mode real-time hook
 *
 * • LOCAL (dev):        Socket.io  (ws to local server)
 * • PRODUCTION w/ keys: Pusher     (set VITE_PUSHER_KEY + VITE_PUSHER_CLUSTER)
 * • PRODUCTION no keys: no-op      (Portfolio.jsx falls back to 3-second polling)
 */
const useSocket = (url, options = {}) => {
    const [socket, setSocket]       = useState(null);
    const [pusher, setPusher]       = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const isProduction =
            import.meta.env.PROD ||
            (typeof window !== 'undefined' &&
                window.location.hostname !== 'localhost' &&
                window.location.hostname !== '127.0.0.1');

        const pusherKey     = import.meta.env.VITE_PUSHER_KEY;
        const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

        if (!isProduction) {
            // ── DEV: Socket.io ───────────────────────────────────────────────
            const socketIo = io(url, {
                transports: ['websocket', 'polling'],
                ...options,
            });
            setSocket(socketIo);
            socketIo.on('connect',    () => { console.log('[Socket.io] Connected');    setIsConnected(true);  });
            socketIo.on('disconnect', () => { console.log('[Socket.io] Disconnected'); setIsConnected(false); });
            return () => socketIo.disconnect();

        } else if (pusherKey && pusherCluster) {
            // ── PRODUCTION: Pusher (if env vars are configured) ──────────────
            const pusherInstance = new Pusher(pusherKey, {
                cluster: pusherCluster,
                ...options.pusher,
            });
            setPusher(pusherInstance);
            const onConnected    = () => setIsConnected(true);
            const onDisconnected = () => setIsConnected(false);
            pusherInstance.connection.bind('connected',    onConnected);
            pusherInstance.connection.bind('disconnected', onDisconnected);
            pusherInstance.connection.bind('unavailable',  onDisconnected);
            pusherInstance.connection.bind('failed',       onDisconnected);
            return () => {
                pusherInstance.connection.unbind('connected',    onConnected);
                pusherInstance.connection.unbind('disconnected', onDisconnected);
                pusherInstance.connection.unbind('unavailable',  onDisconnected);
                pusherInstance.connection.unbind('failed',       onDisconnected);
                pusherInstance.disconnect();
            };
        } else {
            // ── PRODUCTION: No Pusher — polling fallback handles live data ───
            console.log('[useSocket] Pusher not configured. Polling mode active.');
            setIsConnected(false);
        }
    }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

    const on = useCallback((event, callback, channelName = null) => {
        if (socket) {
            socket.on(event, callback);
        }
        if (pusher) {
            const ch = channelName || (event === 'price_update' ? 'price-updates' : 'admin-alerts');
            const channel = pusher.subscribe(ch);
            channel.bind(event, callback);
        }
    }, [socket, pusher]);

    const off = useCallback((event, callback, channelName = null) => {
        if (socket) {
            socket.off(event, callback);
        }
        if (pusher) {
            const ch = channelName || (event === 'price_update' ? 'price-updates' : 'admin-alerts');
            const channel = pusher.subscribe(ch);
            channel.unbind(event, callback);
        }
    }, [socket, pusher]);

    return { socket, pusher, isConnected, on, off };
};

export default useSocket;
