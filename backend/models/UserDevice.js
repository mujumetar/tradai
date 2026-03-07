const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String, required: true },
    fingerprint: { type: String, required: true },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a unique index for user + fingerprint to avoid duplicates
userDeviceSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });

const UserDevice = mongoose.model('UserDevice', userDeviceSchema);
module.exports = UserDevice;
