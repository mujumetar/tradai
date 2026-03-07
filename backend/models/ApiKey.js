const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
    name: { type: String, required: true },
    key: { type: String, unique: true, default: () => 'lq_' + crypto.randomBytes(24).toString('hex') },
    isActive: { type: Boolean, default: true },
    hits: { type: Number, default: 0 },
    credits: { type: Number, default: 100 },
    tier: { type: String, enum: ['free', 'premium'], default: 'free' },
    lastUsed: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
module.exports = ApiKey;
