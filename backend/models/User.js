const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, default: "" },
    role: { type: String, enum: ['user', 'admin', 'manager', 'support'], default: 'user' },
    subscription: { type: String, enum: ['free', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    validUntil: { type: Date, default: () => new Date(+new Date() + 365 * 24 * 60 * 60 * 1000) },
    pushSubscriptions: [
        {
            endpoint: String,
            keys: {
                p256dh: String,
                auth: String
            }
        }
    ],
    fcmTokens: [{ type: String }]
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
