const User = require('../models/User');

// @desc    Save push subscription for user
// @route   POST /api/users/push-subscribe
exports.saveSubscription = async (req, res) => {
    const { subscription } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if subscription already exists
    const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        user.pushSubscriptions.push(subscription);
        await user.save();
    }

    res.status(201).json({ message: 'Subscription saved' });
};

// @desc    Remove push subscription for user
// @route   DELETE /api/users/push-subscribe
exports.removeSubscription = async (req, res) => {
    const { endpoint } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
    await user.save();

    res.json({ message: 'Subscription removed' });
};

// @desc    Save FCM token for user
// @route   POST /api/users/fcm-token
exports.saveFcmToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
        await user.save();
    }

    res.status(201).json({ message: 'FCM Token saved' });
};

// @desc    Remove FCM token for user
// @route   POST /api/users/fcm-token/remove
exports.removeFcmToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    await user.save();

    res.json({ message: 'FCM Token removed' });
};
// @desc    Toggle watching a trade idea for live notifications
// @route   POST /api/users/watch-trade
exports.toggleWatchTrade = async (req, res) => {
    const { tradeId } = req.body;
    if (!tradeId) return res.status(400).json({ message: 'Trade ID required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.watchedTradeIdeas.indexOf(tradeId);
    let isWatching = false;
    if (index === -1) {
        user.watchedTradeIdeas.push(tradeId);
        isWatching = true;
    } else {
        user.watchedTradeIdeas.splice(index, 1);
        isWatching = false;
    }

    await user.save();
    res.json({ message: `Trade ${isWatching ? 'watched' : 'unwatched'}`, isWatching });
};
