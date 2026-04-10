/**
 * api/index.js — Vercel Gateway
 * 
 * Proxies requests to the main Express app in the backend.
 */
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../backend/lib/db');
const createApp = require('../backend/createApp');

const app = createApp();

module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (err) {
        console.error('SERVERLESS_INVOCATION_CRASH:', err.message);
        res.status(500).json({
            error: 'Server Initialization Failed',
            message: err.message,
            tip: 'Check your MONGO_URI in Vercel settings.'
        });
    }
};
