const DeviceBan = require('../models/DeviceBan');

const deviceBanMiddleware = async (req, res, next) => {
    const fingerprint = req.headers['x-device-fingerprint'];
    if (!fingerprint) return next(); // No fingerprint = skip (e.g. server-to-server)

    try {
        const banned = await DeviceBan.findOne({ fingerprint, isActive: true });
        if (banned) {
            return res.status(403).send(`
                <html>
                <head><title>Access Denied</title></head>
                <body style="background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;margin:0">
                    <h1 style="color:#E78932;font-size:3rem;margin:0">ACCESS DENIED</h1>
                    <p style="color:#9CA3AF;margin-top:1rem">This device has been permanently banned from this platform.</p>
                    <p style="color:#6B7280;font-size:0.75rem;margin-top:0.5rem">Device ID: ${fingerprint}</p>
                    <div style="margin-top:2rem;padding:1rem;border:1px solid #333;border-radius:8px;font-size:0.85rem;color:#9CA3AF">
                        Contact support@liquide.com if you believe this is an error.
                    </div>
                </body>
                </html>
            `);
        }
    } catch (err) {
        console.error('Device ban middleware error:', err);
    }
    next();
};

module.exports = deviceBanMiddleware;
