/**
 * api/index.js  —  Vercel Serverless entry-point
 *
 * Vercel detects this file and routes all /api/* requests here.
 * Socket.io is not used; req.io is a no-op emitter (see createApp.js).
 */

const dotenv = require('dotenv');
dotenv.config();

const webpush = require('web-push');
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:support@liquide.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const connectDB = require('../lib/db');
const createApp = require('../createApp');

const app = createApp(); // no io → safe no-op emitter

// Export a handler that ensures DB is connected before processing
module.exports = async (req, res) => {
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
