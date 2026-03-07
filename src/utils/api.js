import axios from 'axios';
import { DEVICE_FINGERPRINT } from './deviceFingerprint';

const api = axios.create({
    baseURL: '/api',
});

// Request interceptor - attach token + device fingerprint
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        config.headers['x-device-fingerprint'] = DEVICE_FINGERPRINT;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401/403 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        // If token expired or invalid, force re-login
        if (status === 401) {
            const msg = error.response?.data?.message || '';
            if (msg.includes('token failed') || msg.includes('token failed') || msg.includes('no token')) {
                localStorage.removeItem('user');
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
