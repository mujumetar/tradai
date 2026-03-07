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
