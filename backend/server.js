const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
// path and fs no longer needed - using MongoDB

const userRoutes = require('./routes/userRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const tradeApiRoutes = require('./routes/tradeApiRoutes');

const mongoose = require('mongoose');

dotenv.config();

const webpush = require('web-push');
webpush.setVapidDetails(
    'mailto:support@liquide.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5174', 'https://localhost:5174'];

const io = new Server(server, {
    cors: {
        origin: (origin, cb) => cb(null, true), // Allow all origins in dev
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const ipBanMiddleware = require('./middleware/ipBanMiddleware');
const deviceBanMiddleware = require('./middleware/deviceBanMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');

// Middleware
app.use(ipBanMiddleware);
app.use(deviceBanMiddleware);
app.use(cors());
app.use(express.json());

// Attach io to req for use in middleware/routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Logging middleware
app.use(loggerMiddleware);
app.use(morgan('dev'));

// Socket.io initialization
let activeViewers = 0;
io.on('connection', (socket) => {
    activeViewers++;
    io.emit('viewer_count', activeViewers);
    console.log('A client connected:', socket.id, 'Total:', activeViewers);

    socket.on('disconnect', () => {
        activeViewers = Math.max(0, activeViewers - 1);
        io.emit('viewer_count', activeViewers);
        console.log('A client disconnected:', socket.id, 'Total:', activeViewers);
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api', contentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/tickets', ticketRoutes);

// Expose static uploads folder for blog images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/v1', tradeApiRoutes); // Public Trade API (API key protected)

// Lead Capture
app.post('/api/leads', async (req, res) => {
    const leadData = req.body;
    req.io.emit('new_lead', { ...leadData, timestamp: new Date().toISOString() });
    res.status(200).json({ message: 'Lead captured successfully' });
});

app.get('/', (req, res) => {
    res.json({ message: 'liquide Backend API is running with WebSockets...' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
