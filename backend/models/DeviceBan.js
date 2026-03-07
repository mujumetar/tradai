const mongoose = require('mongoose');

const deviceBanSchema = new mongoose.Schema({
    fingerprint: { type: String, required: true, unique: true },
    label: { type: String, default: '' },       // human-readable label set by admin
    browser: { type: String },
    os: { type: String },
    screen: { type: String },
    ip: { type: String },                       // IP at time of ban
    reason: { type: String, default: 'Banned by admin' },
    isActive: { type: Boolean, default: true },
    bannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DeviceBan = mongoose.model('DeviceBan', deviceBanSchema);
module.exports = DeviceBan;
