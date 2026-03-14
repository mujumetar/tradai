/**
 * api/index.js  —  Vercel Serverless entry-point
 *
 * Vercel detects this file and routes all /api/* requests here.
 * Socket.io is not used; req.io is a no-op emitter (see createApp.js).
 */

const dotenv = require('dotenv');
dotenv.config();

const webpush = require('web-push');
webpush.setVapidDetails(
    'mailto:support@liquide.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const connectDB = require('../lib/db');
const createApp = require('../createApp');

// Build app once (serverless: module cached between warm invocations)
const app = createApp(); // no io → safe no-op emitter

// Export a handler that ensures DB is connected before processing
module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
};
