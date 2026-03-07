// src/utils/deviceFingerprint.js
// Generates a stable device fingerprint from browser characteristics.
// The fingerprint is sent in the X-Device-Fingerprint header on every request.

const getFingerprint = () => {
    const nav = window.navigator;
    const screen = window.screen;

    const components = [
        nav.userAgent,
        nav.language,
        nav.platform,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        !!nav.cookieEnabled,
        typeof nav.hardwareConcurrency !== 'undefined' ? nav.hardwareConcurrency : '',
    ];

    // Simple hash
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
};

export const DEVICE_FINGERPRINT = getFingerprint();

export const getDeviceMeta = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return {
        fingerprint: DEVICE_FINGERPRINT,
        browser,
        os,
        screen: `${screen.width}x${screen.height}`,
        userAgent: navigator.userAgent
    };
};
