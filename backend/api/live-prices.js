/**
 * api/live-prices.js — Vercel Serverless Function
 *
 * Lightweight endpoint polled every 3 seconds by the Portfolio frontend.
 * Returns only price-critical fields for all trades.
 * Triggers a background price refresh (via runAutoUpdate) if data is >30s stale.
 *
 * Route: GET /api/live-prices
 */

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../lib/db');
const TradeIdea = require('../models/TradeIdea');

const RATE_LIMIT_MS = 1000;

// PnL computation (mirrors the Mongoose virtual)
function computePnl(idea) {
    let cmp = idea.closingPrice || idea.currentPrice;
    if (!cmp) return null;

    if (!idea.closedAt) {
        if (idea.type === 'BUY') {
            if (idea.status === 'TARGET3_HIT' && idea.target3) cmp = Math.max(cmp, idea.target3);
            else if (idea.status === 'TARGET2_HIT' && idea.target2) cmp = Math.max(cmp, idea.target2);
            else if (idea.status === 'TARGET1_HIT' && idea.target)  cmp = Math.max(cmp, idea.target);
        } else {
            if (idea.status === 'TARGET3_HIT' && idea.target3) cmp = Math.min(cmp, idea.target3);
            else if (idea.status === 'TARGET2_HIT' && idea.target2) cmp = Math.min(cmp, idea.target2);
            else if (idea.status === 'TARGET1_HIT' && idea.target)  cmp = Math.min(cmp, idea.target);
        }
    }

    const qty           = idea.quantity || (idea.portfolioAmount ? idea.portfolioAmount / idea.entry : 1);
    const investedAmount = parseFloat((qty * idea.entry).toFixed(2));
    const diff           = idea.type === 'BUY' ? (cmp - idea.entry) : (idea.entry - cmp);
    const rupees         = parseFloat((diff * qty).toFixed(2));
    const percent        = parseFloat(((diff / idea.entry) * 100).toFixed(2));

    return {
        qty:           parseFloat(qty.toFixed(2)),
        investedAmount,
        rupees,
        percent,
        isProfit:      rupees >= 0,
        currentValue:  parseFloat((investedAmount + rupees).toFixed(2)),
        frozen:        ['SL_HIT', 'TARGET3_HIT', 'CLOSED'].includes(idea.status),
        currencies: {
            USD: parseFloat((rupees * 0.012).toFixed(2)),
            EUR: parseFloat((rupees * 0.011).toFixed(2)),
            GBP: parseFloat((rupees * 0.0095).toFixed(2)),
            AED: parseFloat((rupees * 0.044).toFixed(2)),
            SGD: parseFloat((rupees * 0.016).toFixed(2)),
        },
    };
}

const TERMINAL = new Set(['SL_HIT', 'TARGET3_HIT', 'CLOSED']);

module.exports = async (req, res) => {
    // CORS — allow the frontend origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    try {
        await connectDB();

        // Lightweight projection — only price-critical fields
        const ideas = await TradeIdea.find(
            {},
            '_id ticker market type entry stopLoss target target2 target3 quantity portfolioAmount currentPrice lastPriceUpdate status closingPrice closedAt'
        ).lean();

        // ── Smart stale-data trigger ───────────────────────────────────────────
        // If any active call is >30s old, fire a background price refresh.
        // The NEXT poll (3s later) will see the fresh prices.
        const staleCutoff = new Date(Date.now() - 30_000);
        const hasStale    = ideas.some(i =>
            !TERMINAL.has(i.status) &&
            (!i.lastPriceUpdate || new Date(i.lastPriceUpdate) < staleCutoff)
        );
        if (hasStale) {
            const { runAutoUpdate } = require('../services/portfolioAutoUpdater');
            runAutoUpdate().catch(err =>
                console.error('[live-prices] bg refresh error:', err.message)
            );
        }

        // Build response payload
        const payload = ideas.map(idea => ({
            _id:             idea._id,
            currentPrice:    idea.currentPrice,
            status:          idea.status,
            lastPriceUpdate: idea.lastPriceUpdate,
            frozen:          TERMINAL.has(idea.status),
            pnl:             computePnl(idea),
        }));

        res.setHeader('Cache-Control', 'public, max-age=2, stale-while-revalidate=1');
        return res.status(200).json(payload);

    } catch (err) {
        console.error('[live-prices] error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch live prices', error: err.message });
    }
};
