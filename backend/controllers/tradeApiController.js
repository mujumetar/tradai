const TradeIdea = require('../models/TradeIdea');
const ApiKey = require('../models/ApiKey');

// @desc    Public trade ideas API (API key protected)
// @route   GET /api/v1/trade-ideas
exports.getPublicTradeIdeas = async (req, res) => {
    const { type, status, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (type) filter.type = type.toUpperCase();
    if (status) filter.status = status.toUpperCase();

    const ideas = await TradeIdea.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .select('-__v');

    const total = await TradeIdea.countDocuments(filter);

    res.json({
        success: true,
        page: parseInt(page),
        total,
        results: ideas
    });
};

// @desc    Get single trade idea
// @route   GET /api/v1/trade-ideas/:id
exports.getPublicTradeIdea = async (req, res) => {
    const idea = await TradeIdea.findById(req.params.id).select('-__v');
    if (!idea) return res.status(404).json({ success: false, message: 'Trade idea not found' });
    res.json({ success: true, idea });
};

// @desc    Admin: Create API key
// @route   POST /api/admin/api-keys
exports.createApiKey = async (req, res) => {
    const { name } = req.body;
    const key = await ApiKey.create({ name, createdBy: req.user._id });
    res.status(201).json({ message: 'API key created', key });
};

// @desc    Admin: Get all API keys
// @route   GET /api/admin/api-keys
exports.getApiKeys = async (req, res) => {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.json(keys);
};

// @desc    Admin: Toggle/Revoke API key
// @route   DELETE /api/admin/api-keys/:id
exports.deleteApiKey = async (req, res) => {
    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: 'API key revoked' });
};
