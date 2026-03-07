const mongoose = require('mongoose');

const bannedIpSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    reason: { type: String, default: 'Malicious activity' },
    bannedAt: { type: Date, default: Date.now }
});

const BannedIp = mongoose.model('BannedIp', bannedIpSchema);
module.exports = BannedIp;
