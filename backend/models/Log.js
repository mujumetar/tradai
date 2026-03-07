const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    method: { type: String },
    url: { type: String },
    status: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    duration: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Log = mongoose.model('Log', logSchema);
module.exports = Log;
