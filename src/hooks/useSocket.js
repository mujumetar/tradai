import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = (url) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketIo = io(url);

        setSocket(socketIo);

        socketIo.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        socketIo.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        return () => {
            socketIo.disconnect();
        };
    }, [url]);

    return socket;
};

export default useSocket;
