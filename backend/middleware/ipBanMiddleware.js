const BannedIp = require('../models/BannedIp');

const ipBanMiddleware = async (req, res, next) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress;
        const isBanned = await BannedIp.findOne({ ip: clientIp });

        if (isBanned) {
            return res.status(403).send(`
                <div style="background: black; color: white; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
                    <h1 style="color: #E78932; font-size: 3rem;">ACCESS DENIED</h1>
                    <p style="color: #9CA3AF;">Your IP address (${clientIp}) has been permanently banned from this domain.</p>
                    <div style="margin-top: 2rem; padding: 1rem; border: 1px solid #333; border-radius: 8px;">
                        Contact support@liquide.com if you believe this is an error.
                    </div>
                </div>
            `);
        }
        next();
    } catch (err) {
        console.error("IP Ban Middleware Error:", err);
        next();
    }
};

module.exports = ipBanMiddleware;
