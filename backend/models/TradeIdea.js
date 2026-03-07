const mongoose = require('mongoose');

const tradeIdeaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ticker: { type: String, required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    entry: { type: Number, required: true },
    target: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    isPremium: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' }
}, { timestamps: true });

const TradeIdea = mongoose.model('TradeIdea', tradeIdeaSchema);
module.exports = TradeIdea;
