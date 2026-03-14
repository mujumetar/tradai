const mongoose = require('mongoose');

const tradeIdeaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ticker: { type: String, required: true },
    market: { type: String, enum: ['NSE', 'BSE', 'CRYPTO', 'FOREX', 'MCX'], default: 'NSE' },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    
    // Core Trade Levels
    entry: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    target: { type: Number, required: true }, // Keeping 'target' for backward compatibility
    target2: { type: Number }, // Additional targets for portfolio tracking
    target3: { type: Number },
    
    // Portfolio tracking fields
    quantity: { type: Number, default: 1 }, 
    portfolioAmount: { type: Number }, // Deprecated legacy field
    currentPrice: { type: Number },
    lastPriceUpdate: { type: Date },
    closingPrice: { type: Number },
    closedAt: { type: Date },
    
    // Metadata
    reasoning: { type: String },
    timeHorizon: { type: String, enum: ['Intraday', 'Swing', 'Positional'], default: 'Swing' },
    isPremium: { type: Boolean, default: true },
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['ACTIVE', 'TARGET1_HIT', 'TARGET2_HIT', 'TARGET3_HIT', 'SL_HIT', 'CLOSED'], 
        default: 'ACTIVE' 
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate dynamically instead of storing flat PnL
tradeIdeaSchema.virtual('pnl').get(function() {
    let cmp = this.closingPrice || this.currentPrice;
    if (!cmp) return null;

    // Enhance accuracy: If a target was hit, ensure the PnL reflects at least the booked target profit 
    // even if the live price retraces slightly afterwards.
    if (!this.closedAt) {
        if (this.type === 'BUY') {
            if (this.status === 'TARGET3_HIT' && this.target3) cmp = Math.max(cmp, this.target3);
            else if (this.status === 'TARGET2_HIT' && this.target2) cmp = Math.max(cmp, this.target2);
            else if (this.status === 'TARGET1_HIT' && this.target) cmp = Math.max(cmp, this.target);
        } else {
            if (this.status === 'TARGET3_HIT' && this.target3) cmp = Math.min(cmp, this.target3);
            else if (this.status === 'TARGET2_HIT' && this.target2) cmp = Math.min(cmp, this.target2);
            else if (this.status === 'TARGET1_HIT' && this.target) cmp = Math.min(cmp, this.target);
        }
    }

    const qty = this.quantity || (this.portfolioAmount ? this.portfolioAmount / this.entry : 1);
    const investedAmount = qty * this.entry;
    
    // Profit per unit
    const diff = this.type === 'BUY' ? (cmp - this.entry) : (this.entry - cmp);
    
    const rupees = diff * qty;
    const percent = (diff / this.entry) * 100;
    
    return {
        qty: parseFloat(qty.toFixed(2)),
        investedAmount: parseFloat(investedAmount.toFixed(2)),
        rupees: parseFloat(rupees.toFixed(2)),
        percent: parseFloat(percent.toFixed(2)),
        isProfit: rupees >= 0,
        exitPrice: cmp,
        // Approximate currency conversions based on INR
        currencies: {
            USD: parseFloat((rupees * 0.012).toFixed(2)),
            EUR: parseFloat((rupees * 0.011).toFixed(2)),
            GBP: parseFloat((rupees * 0.0095).toFixed(2)),
            AED: parseFloat((rupees * 0.044).toFixed(2)),
            SGD: parseFloat((rupees * 0.016).toFixed(2))
        }
    };
});

const TradeIdea = mongoose.model('TradeIdea', tradeIdeaSchema);
module.exports = TradeIdea;
