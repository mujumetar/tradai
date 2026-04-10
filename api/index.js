/**
 * api/index.js  —  Vercel Serverless entry-point (Bridge)
 *
 * Vercel detects this file and routes all /api/* requests here.
 */

const dotenv = require('dotenv');
dotenv.config();

const webpush = require('web-push');
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@tradai.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const connectDB = require('../backend/lib/db');
const createApp = require('../backend/createApp');

const app = createApp(); // no io → safe no-op emitter

// Export a handler that ensures DB is connected before processing
module.exports = async (req, res) => {
    // Enable CORS manually for the serverless bridge
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-device-fingerprint');

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        return app(req, res);
    } catch (err) {
        console.error('SERVERLESS_INVOCATION_CRASH:', err.message);
        res.status(500).json({
            error: 'Server Initialization Failed',
            message: err.message,
            tip: 'Check your MONGO_URI and environment variables in Vercel settings.'
        });
    }
};
