/**
 * createApp.js
 *
 * Builds and returns the Express app WITHOUT calling server.listen().
 * This decouples the app configuration from how it is served:
 *   - Traditional server: server.js calls listen()
 *   - Vercel serverless:  api/index.js exports the app directly
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const tradeApiRoutes = require('./routes/tradeApiRoutes');

const ipBanMiddleware = require('./middleware/ipBanMiddleware');
const deviceBanMiddleware = require('./middleware/deviceBanMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');

/**
 * @param {import('socket.io').Server | null} io  Pass the real io in traditional mode,
 *                                                  null/undefined in serverless mode.
 */
function createApp(io = null) {
    const app = express();

    // ── Middleware ──────────────────────────────────────────────────────────
    app.use(ipBanMiddleware);
    app.use(deviceBanMiddleware);
    app.use(cors());
    app.use(express.json());

    // Attach io to every request. In serverless mode io is a no-op emitter.
    const safeIo = io || {
        emit: () => {},
        to: () => ({ emit: () => {} }),
    };
    app.use((req, _res, next) => {
        // Allow updating io dynamically (e.g. in server.js)
        req.io = req.app.get('io') || safeIo;
        next();
    });

    app.use(loggerMiddleware);

    // Skip morgan in serverless (Vercel captures logs automatically)
    if (process.env.VERCEL !== '1') {
        app.use(morgan('dev'));
    }

    // ── Routes ──────────────────────────────────────────────────────────────
    app.use('/api/users', userRoutes);
    app.use('/api', contentRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/emails', emailRoutes);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/v1', tradeApiRoutes);

    // Static uploads (only in traditional server; on Vercel uploads go to cloud storage)
    if (process.env.VERCEL !== '1') {
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    }

    // Lead capture
    app.post('/api/leads', (req, res) => {
        req.io.emit('new_lead', { ...req.body, timestamp: new Date().toISOString() });
        res.status(200).json({ message: 'Lead captured successfully' });
    });

    // Cron / health endpoint — used by Vercel Cron or any external pinger
    // to trigger the portfolio auto-updater without a persistent setInterval.
    app.post('/api/cron/update-prices', async (req, res) => {
        // Protect with a shared secret so only your cron runner can call it
        const secret = req.headers['x-cron-secret'];
        if (secret !== process.env.CRON_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        try {
            const { runAutoUpdate } = require('./services/portfolioAutoUpdater');
            await runAutoUpdate(req.io);
            res.json({ message: 'Price update complete' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    app.get('/', (_req, res) => {
        res.json({ message: 'TRADAI Backend API is running.' });
    });

    // ── Global error handler ────────────────────────────────────────────────
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
        if (res.headersSent) {
            return _next(err);
        }
        console.error(err.stack);
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
    });

    return app;
}

module.exports = createApp;
