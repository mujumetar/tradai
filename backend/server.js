/**
 * server.js  —  Traditional Node.js entry-point (local dev / VPS / Railway etc.)
 *
 * For Vercel serverless, use api/index.js instead.
 */

const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const webpush = require('web-push');

dotenv.config();

const connectDB = require('./lib/db');
const createApp = require('./createApp');
const { startAutoUpdater } = require('./services/portfolioAutoUpdater');

// ── WebPush ─────────────────────────────────────────────────────────────────
webpush.setVapidDetails(
    'mailto:support@tradai.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ── Build Express app ───────────────────────────────────────────────────────
const app = createApp();
const server = http.createServer(app);

// ── Socket.io server ─────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: (_origin, cb) => cb(null, true),
        methods: ['GET', 'POST'],
    },
});

app.set('io', io); // Inject real io into the app for the middleware to pick up

let activeViewers = 0;
io.on('connection', (socket) => {
    activeViewers++;
    io.emit('viewer_count', activeViewers);
    console.log('Client connected:', socket.id, '| Total:', activeViewers);

    socket.on('disconnect', () => {
        activeViewers = Math.max(0, activeViewers - 1);
        io.emit('viewer_count', activeViewers);
        console.log('Client disconnected:', socket.id, '| Total:', activeViewers);
    });
});


// ── Boot ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        console.log('MongoDB Connected');
        startAutoUpdater(io);
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    });
