const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Lazy Razorpay instance - only created when a payment route is hit
// so the server can start without real credentials in .env
const getRazorpay = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res) => {
    const { plan } = req.body;
    const amount = plan === 'premium' ? 99900 : 49900; // paise (₹999 or ₹499)

    const options = {
        amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { userId: req.user._id.toString(), plan }
    };

    const order = await getRazorpay().orders.create(options);

    // Save pending payment record
    await Payment.create({
        userId: req.user._id,
        razorpayOrderId: order.id,
        amount: amount / 100,
        plan,
        status: 'created'
    });

    res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        user: { name: req.user.name, email: req.user.email }
    });
};

// @desc    Verify Razorpay payment & upgrade subscription
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Update payment record
    await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'paid' }
    );

    // Upgrade user subscription
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { subscription: plan || 'premium', validUntil },
        { new: true }
    ).select('-password');

    req.io.emit('subscription_updated', { id: user._id, name: user.name, subscription: user.subscription });
    req.io.emit('new_payment', { user: user.name, amount: user.subscription === 'premium' ? 999 : 499 });

    res.json({
        message: 'Payment verified. Subscription activated!',
        user: {
            _id: user._id, name: user.name, email: user.email,
            role: user.role, subscription: user.subscription, validUntil: user.validUntil,
            token: req.headers.authorization?.split(' ')[1] // pass existing token back
        }
    });
};

// @desc    Get user payment history
// @route   GET /api/payments/history
exports.getPaymentHistory = async (req, res) => {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
};
