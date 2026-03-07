const Log = require('../models/Log');

const loggerMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', async () => {
        const duration = Date.now() - start;
        const logEntry = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip,
            userAgent: req.get('user-agent'),
            duration: `${duration}ms`,
            userId: req.user?._id
        };

        try {
            const log = await Log.create(logEntry);

            if (req.io) {
                req.io.emit('new_log', log);
            }
        } catch (err) {
            // Silently fail - don't break the request
        }
    });

    next();
};

module.exports = loggerMiddleware;
