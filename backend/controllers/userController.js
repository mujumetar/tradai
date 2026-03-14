const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const UserDevice = require('../models/UserDevice');
const DeviceBan = require('../models/DeviceBan');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret123', { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/users
exports.registerUser = async (req, res) => {
    const { name, email, password, mobile, fingerprint, browser, os } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, mobile });

    // Track device on registration
    if (fingerprint) {
        await UserDevice.create({
            userId: user._id,
            fingerprint,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip,
            userAgent: req.headers['user-agent'],
            browser: browser || 'Unknown',
            os: os || 'Unknown',
            lastLogin: Date.now()
        });
    }

    req.io.emit('new_user', {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        createdAt: user.createdAt
    });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        token: generateToken(user._id, user.role)
    });
};

// @desc    Auth user & get token
// @route   POST /api/users/login
exports.authUser = async (req, res) => {
    let { email, password, fingerprint, browser, os } = req.body;
    const headerFingerprint = req.headers['x-device-fingerprint'];
    if (!fingerprint && headerFingerprint) fingerprint = headerFingerprint;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (user.status === 'banned') {
            return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
        }

        // Check if device is banned
        if (fingerprint) {
            const isBanned = await DeviceBan.findOne({ fingerprint, isActive: true });
            if (isBanned) {
                return res.status(403).json({ message: 'This device has been banned from accessing TRADAI.' });
            }

            // Track login device
            await UserDevice.findOneAndUpdate(
                { userId: user._id, fingerprint },
                {
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip,
                    userAgent: req.headers['user-agent'],
                    browser: browser || 'Unknown',
                    os: os || 'Unknown',
                    lastLogin: Date.now()
                },
                { upsert: true }
            );
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
            status: user.status,
            validUntil: user.validUntil,
            token: generateToken(user._id, user.role)
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user's API keys
// @route   GET /api/users/keys
exports.getMyApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create API key for user
// @route   POST /api/users/keys
exports.createMyApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        if (req.user.subscription !== 'premium') {
            return res.status(403).json({ message: 'API Keys require a Premium subscription' });
        }
        // Limit keys per user (optional, say max 5)
        const count = await ApiKey.countDocuments({ createdBy: req.user._id });
        if (count >= 5) {
            return res.status(400).json({ message: 'Maximum of 5 API keys allowed' });
        }

        const key = await ApiKey.create({ name: name || 'Default Key', createdBy: req.user._id });
        res.status(201).json({ message: 'API key created', key });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user's API key
// @route   DELETE /api/users/keys/:id
exports.deleteMyApiKey = async (req, res) => {
    try {
        const key = await ApiKey.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!key) {
            return res.status(404).json({ message: 'Key not found or unauthorized' });
        }
        await ApiKey.findByIdAndDelete(req.params.id);
        res.json({ message: 'API key revoked' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
