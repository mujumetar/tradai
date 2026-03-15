const User = require('../models/User');
const BannedIp = require('../models/BannedIp');
const DeviceBan = require('../models/DeviceBan');
const Log = require('../models/Log');
const Payment = require('../models/Payment');
const ApiKey = require('../models/ApiKey');
const UserDevice = require('../models/UserDevice');
const bcrypt = require('bcryptjs');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
};

// @desc    Update user subscription/role (Admin only)
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
    const { role, subscription, validUntil } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // SUPER_ADMIN PROTECTION: No one can demote or alter a Super Admin account
    if (user.role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden. Super Admin identities are protected by System Identity Matrix and cannot be modified.'});
    }

    if (role) user.role = role;
    if (subscription) user.subscription = subscription;
    if (validUntil) user.validUntil = validUntil;

    await user.save();

    req.io.emit('subscription_updated', {
        id: user._id,
        name: user.name,
        role: user.role,
        subscription: user.subscription
    });

    res.json({ message: 'User updated successfully', user });
};

// @desc    Update user status (ban/unban)
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
    const { status } = req.body;
    
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // SUPER_ADMIN PROTECTION: No one can ban or alter status of a Super Admin account
    if (targetUser.role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden. Super Admin accounts are permanently active.'});
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');

    req.io.emit('user_status_updated', { id: user._id, status, name: user.name });
    res.json({ message: `User status updated to ${status}`, user });
};

// @desc    Create a user (Admin only)
// @route   POST /api/admin/users
exports.createUser = async (req, res) => {
    const { name, email, password, mobile, role, subscription } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
        name, email, password, mobile,
        role: role || 'user',
        subscription: subscription || 'free'
    });

    req.io.emit('new_user', { id: user._id, name: user.name, email: user.email, subscription: user.subscription });
    res.status(201).json({ message: 'User created successfully', user });
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // SUPER_ADMIN PROTECTION: No one can delete a Super Admin account
    if (targetUser.role === 'SUPER_ADMIN') {
         return res.status(403).json({ message: 'CRITICAL FAILURE: Attempted deletion of SUPER ADMIN identity. Action blocked.'});
    }

    const user = await User.findByIdAndDelete(req.params.id);

    req.io.emit('user_deleted', { id: req.params.id });
    res.json({ message: 'User deleted successfully' });
};

// @desc    Ban an IP address
// @route   POST /api/admin/ban-ip
exports.banIp = async (req, res) => {
    const { ip } = req.body;
    try {
        await BannedIp.create({ ip });
        res.json({ message: `IP ${ip} has been banned` });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'IP already banned' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all banned IPs
// @route   GET /api/admin/banned-ips
exports.getBannedIps = async (req, res) => {
    const ips = await BannedIp.find().sort({ bannedAt: -1 });
    res.json(ips);
};

// @desc    Unban an IP
// @route   DELETE /api/admin/banned-ips/:ip
exports.unbanIp = async (req, res) => {
    await BannedIp.findOneAndDelete({ ip: req.params.ip });
    res.json({ message: `IP ${req.params.ip} has been unbanned` });
};

// @desc    Get request logs
// @route   GET /api/admin/logs
exports.getLogs = async (req, res) => {
    const logs = await Log.find()
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(100);
    res.json(logs);
};

// @desc    Get user invoices (Mocked)
// @route   GET /api/admin/invoices/:userId
exports.getUserInvoices = async (req, res) => {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // In production, this would come from a payments/invoices collection
    const invoices = [{
        invoiceNo: `INV-${user._id.toString().slice(-6).toUpperCase()}-001`,
        date: user.createdAt,
        amount: user.subscription === 'premium' ? 999 : 0,
        plan: user.subscription,
        status: user.subscription === 'premium' ? 'Paid' : 'N/A'
    }];

    res.json(invoices);
};

// @desc    Get all payments from DB
// @route   GET /api/admin/payments
exports.getPayments = async (req, res) => {
    const payments = await Payment.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(50);
    res.json(payments);
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
        totalUsers, premiumUsers, bannedUsers,
        newToday, newThisWeek, newThisMonth,
        totalBlogs, totalTradeIdeas,
        totalRequests, totalRevenue, activeApiKeys,
        // New users per day for last 7 days
        dailySignups
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ subscription: 'premium' }),
        User.countDocuments({ status: 'banned' }),
        User.countDocuments({ createdAt: { $gte: startOfToday } }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        require('../models/Blog').countDocuments(),
        require('../models/TradeIdea').countDocuments(),
        Log.countDocuments(),
        Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        ApiKey.countDocuments({ isActive: true }),
        User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ])
    ]);

    res.json({
        users: {
            total: totalUsers,
            premium: premiumUsers,
            free: totalUsers - premiumUsers,
            banned: bannedUsers,
            newToday, newThisWeek, newThisMonth
        },
        revenue: {
            total: totalRevenue[0]?.total || 0
        },
        content: { totalBlogs, totalTradeIdeas },
        requests: { total: totalRequests },
        apiKeys: { active: activeApiKeys },
        charts: { dailySignups }
    });
};

// @desc    Create API key (Admin)
// @route   POST /api/admin/api-keys
exports.createApiKey = async (req, res) => {
    const { name, credits, tier } = req.body;
    const key = await ApiKey.create({
        name,
        credits: credits || 100,
        tier: tier || 'free',
        createdBy: req.user._id
    });
    res.status(201).json({ message: 'API key created', key });
};

// @desc    Update API key (Admin)
// @route   PUT /api/admin/api-keys/:id
exports.updateApiKey = async (req, res) => {
    const { name, credits, tier, isActive } = req.body;
    const key = await ApiKey.findById(req.params.id);
    if (!key) return res.status(404).json({ message: 'API key not found' });

    if (name) key.name = name;
    if (credits !== undefined) key.credits = credits;
    if (tier) key.tier = tier;
    if (isActive !== undefined) key.isActive = isActive;

    await key.save();
    res.json({ message: 'API key updated', key });
};

// @desc    Get all API keys
// @route   GET /api/admin/api-keys
exports.getApiKeys = async (req, res) => {
    const keys = await ApiKey.find().sort({ createdAt: -1 });
    res.json(keys);
};

// @desc    Delete / revoke API key
// @route   DELETE /api/admin/api-keys/:id
exports.deleteApiKey = async (req, res) => {
    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: 'API key revoked' });
};

// ─── Device Ban Management ────────────────────────────────────────────────────

// @desc    Get all device bans
// @route   GET /api/admin/devices
exports.getDeviceBans = async (req, res) => {
    const devices = await DeviceBan.find().sort({ bannedAt: -1 });
    res.json(devices);
};

// @desc    Ban a device by fingerprint
// @route   POST /api/admin/devices/ban
exports.banDevice = async (req, res) => {
    const { fingerprint, browser, os, screen, ip, reason, label } = req.body;
    if (!fingerprint) return res.status(400).json({ message: 'Fingerprint required' });

    try {
        const device = await DeviceBan.findOneAndUpdate(
            { fingerprint },
            { fingerprint, browser, os, screen, ip, reason: reason || 'Banned by admin', label: label || '', isActive: true, bannedAt: new Date() },
            { upsert: true, new: true }
        );
        res.status(201).json({ message: 'Device banned', device });
    } catch (err) {
        res.status(500).json({ message: 'Error banning device' });
    }
};

// @desc    Update device ban label/reason
// @route   PUT /api/admin/devices/:id
exports.updateDeviceBan = async (req, res) => {
    const { label, reason, isActive } = req.body;
    const device = await DeviceBan.findByIdAndUpdate(
        req.params.id,
        { label, reason, isActive },
        { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device updated', device });
};

// @desc    Unban a device (set isActive false)
// @route   DELETE /api/admin/devices/:id
exports.unbanDevice = async (req, res) => {
    await DeviceBan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Device unbanned and removed' });
};
// @desc    Get all user login devices
// @route   GET /api/admin/user-devices
exports.getUserDevices = async (req, res) => {
    try {
        const devices = await UserDevice.find()
            .populate('userId', 'name email')
            .sort({ lastLogin: -1 });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user devices' });
    }
};
