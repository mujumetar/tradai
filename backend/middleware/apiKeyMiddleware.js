const ApiKey = require('../models/ApiKey');

const apiKeyMiddleware = async (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key) {
        return res.status(401).json({ message: 'API key required. Pass it in x-api-key header.' });
    }

    const apiKey = await ApiKey.findOne({ key, isActive: true });
    if (!apiKey) {
        return res.status(403).json({ message: 'Invalid or inactive API key.' });
    }

    // Check credits
    if (apiKey.credits <= 0) {
        return res.status(402).json({
            success: false,
            message: 'API credits exhausted. Please top up your key from the dashboard.',
            error: 'PAYMENT_REQUIRED'
        });
    }

    // Track usage and deduct credits
    apiKey.hits += 1;
    apiKey.credits -= 1;
    apiKey.lastUsed = new Date();
    await apiKey.save();

    req.apiKey = apiKey;
    next();
};

module.exports = apiKeyMiddleware;
