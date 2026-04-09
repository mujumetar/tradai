const Blog = require('../models/Blog');
const TradeIdea = require('../models/TradeIdea');
const User = require('../models/User');
const webpush = require('web-push');
const axios = require('axios');
const { fetchLivePrice } = require('../services/portfolioAutoUpdater');

// ── Simple in-memory rate limiter for live-prices polling ─────────────────────
// Prevents a single user from hammering the endpoint faster than 1 req/s
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 1000; // min 1s between calls per IP

// @desc    Get all blogs
// @route   GET /api/blogs
exports.getBlogs = async (req, res) => {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
};

// @desc    Get all academy sessions (using TradeIdeas as a proxy for now)
// @route   GET /api/academy
exports.getAcademy = async (req, res) => {
    const sessions = await Blog.find({ category: 'Academy' }).sort({ createdAt: -1 });
    const user = req.user;

    const gatedSessions = sessions.map(session => {
        const obj = session.toObject();
        if (obj.isPremium && (!user || user.subscription !== 'premium')) {
            return { ...obj, content: 'LOCKED', isLocked: true };
        }
        return { ...obj, isLocked: false };
    });

    res.json(gatedSessions);
};

// @desc    Get all trade ideas
// @route   GET /api/trade-ideas
exports.getTradeIdeas = async (req, res) => {
    // ── Lazy Auto-Updater (Manual Cron Fix) ──────────────────────────────────
    // On Vercel Hobby, we can't run background intervals. 
    // Instead, whenever a user visits, we check if the data is stale.
    try {
        const lastIdea = await TradeIdea.findOne({ status: { $in: ['ACTIVE', 'TARGET1_HIT', 'TARGET2_HIT'] } })
            .sort({ lastPriceUpdate: -1 });

        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (!lastIdea || !lastIdea.lastPriceUpdate || lastIdea.lastPriceUpdate < fiveMinsAgo) {
            const { runAutoUpdate } = require('../services/portfolioAutoUpdater');
            // Run in background, don't await (so user doesn't wait)
            runAutoUpdate().catch(err => console.error('[LazyUpdate] Error:', err.message));
        }
    } catch (err) {
        console.error('[LazyUpdate] Check failed:', err.message);
    }
    // ────────────────────────────────────────────────────────────────────────

    const ideas = await TradeIdea.find().sort({ createdAt: -1 });
    const user = req.user;

    const gatedIdeas = ideas.map(idea => {
        // use { virtuals: true } to ensure pnl is included
        const obj = idea.toObject({ virtuals: true });
        if (obj.isPremium && (!user || user.subscription !== 'premium')) {
            return {
                ...obj,
                entry: 'LOCKED',
                target: 'LOCKED',
                target2: 'LOCKED',
                target3: 'LOCKED',
                stopLoss: 'LOCKED',
                reasoning: 'LOCKED',
                pnl: null,
                isLocked: true
            };
        }
        return { ...obj, isLocked: false };
    });

    res.json(gatedIdeas);
};

// @desc    Create a blog
// @route   POST /api/blogs
exports.createBlog = async (req, res) => {
    try {
        const { title, content, author, category, isPremium } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
        const blog = await Blog.create({ title, content, author, category, isPremium: isPremium === 'true', imageUrl });
        
        // Automation: Notify users about new research
        const { notifyUsers } = require('../services/notificationService');
        notifyUsers({
            title: `📖 New Research: ${blog.title}`,
            body: `Insights from ${blog.author} in ${blog.category}. Read more now.`,
            url: '/academy',
            type: blog.isPremium ? 'premium' : 'all',
            sendEmail: true
        });

        res.status(201).json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
    try {
        const { title, content, author, category, isPremium } = req.body;
        const updateData = { title, content, author, category, isPremium: isPremium === 'true' || isPremium === true };
        if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

        const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
};

// @desc    Create a trade idea
// @route   POST /api/trade-ideas
exports.createTradeIdea = async (req, res) => {
    try {
        const idea = await TradeIdea.create(req.body);

        // Automation: Send automated notifications (Push + Email)
        const { notifyUsers } = require('../services/notificationService');
        
        let body = `Conviction: ${idea.timeHorizon || 'High'}\nQty: ${idea.quantity}\nType: ${idea.type}\nEntry: ${idea.entry}\nTarget: ${idea.target}\nStop Loss: ${idea.stopLoss}`;
        if (idea.notes) body += `\n\nNote: ${idea.notes}`;

        notifyUsers({
            title: `🚀 New Trade Idea: ${idea.ticker}`,
            body,
            url: '/research',
            type: idea.isPremium ? 'premium' : 'all',
            sendEmail: true
        });

        res.status(201).json(idea);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a trade idea
// @route   PUT /api/trade-ideas/:id
exports.updateTradeIdea = async (req, res) => {
    const idea = await TradeIdea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!idea) return res.status(404).json({ message: 'Trade idea not found' });
    res.json(idea);
};

// @desc    Delete a trade idea
// @route   DELETE /api/trade-ideas/:id
exports.deleteTradeIdea = async (req, res) => {
    const idea = await TradeIdea.findByIdAndDelete(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Trade idea not found' });
    res.json({ message: 'Trade idea deleted' });
};

// @desc    Search for any global ticker
// @route   GET /api/trade-ideas/search-tickers?q=...
exports.searchTickers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const performSearch = async (query) => {
            const { data } = await axios.get(
                `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`,
                { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 }
            );
            return data.quotes || [];
        };

        let quotes = await performSearch(q);

        // If no results and query had spaces, try without spaces (common for NSE options)
        if (quotes.length === 0 && q.includes(' ')) {
            const noSpaceQ = q.replace(/\s+/g, '');
            quotes = await performSearch(noSpaceQ);
        }

        // If query looks like an NSE Option (e.g. "NIFTY 22900 PE")
        const optionMatch = q.toUpperCase().replace(/\s+/g, '').match(/^(NIFTY|BANKNIFTY|FINNIFTY)(\d+)(CE|PE)$/);
        if (optionMatch) {
            const [_, base, strike, type] = optionMatch;
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const now = new Date();
            let current = new Date(now);
            
            // Add a few expiries as suggestions
            for (let i = 0; i < 2; i++) {
                const nextThurs = new Date(current);
                nextThurs.setDate(current.getDate() + (4 + 7 - current.getDay()) % 7);
                const yy = String(nextThurs.getFullYear()).slice(-2);
                const m = nextThurs.getMonth() + 1;
                const mmm = months[nextThurs.getMonth()];
                const dd = String(nextThurs.getDate()).padStart(2, '0');
                
                const sym1 = `${base}${yy}${m}${dd}${strike}${type}.NS`;
                const sym2 = `${base}${yy}${mmm}${strike}${type}.NS`;
                
                results.unshift({
                    symbol: sym2,
                    name: `Auto-Resolve: ${q} (${mmm} Expiry)`,
                    exchange: 'NSE',
                    type: 'OPTION'
                }, {
                    symbol: sym1,
                    name: `Auto-Resolve: ${q} (${m}/${dd} Expiry)`,
                    exchange: 'NSE',
                    type: 'OPTION'
                });
                
                current = new Date(nextThurs);
                current.setDate(current.getDate() + 1);
            }
        }

        res.json(results);
    } catch(err) {
        console.error('[Search] Failed:', err.message);
        res.status(500).json({ message: 'Search failed' });
    }
};

// @desc    Fetch live price for a given ticker & market
// @route   GET /api/trade-ideas/live-price?ticker=...&market=...
exports.getLivePrice = async (req, res) => {
    try {
        const { ticker, market } = req.query;
        if (!ticker) return res.status(400).json({ message: 'Ticker required' });
        const price = await fetchLivePrice(ticker, market || 'NSE');
        if (!price) return res.status(404).json({ message: 'Price not found' });
        res.json({ price });
    } catch(err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get live prices only (lightweight — for 3-second frontend polling)
// @route   GET /api/live-prices
exports.getLivePrices = async (req, res) => {
    try {
        // Very light rate-limit: same IP can't call faster than 1 req/s
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const lastCall = rateLimitMap.get(ip) || 0;
        if (now - lastCall < RATE_LIMIT_MS) {
            return res.status(429).json({ message: 'Too fast — slow down a bit.' });
        }
        rateLimitMap.set(ip, now);

        // Only select the fields the frontend needs — very cheap
        const ideas = await TradeIdea.find(
            {},
            '_id ticker market type entry stopLoss target target2 target3 quantity portfolioAmount currentPrice lastPriceUpdate status frozen closingPrice closedAt'
        ).lean(); // .lean() = plain JS objects, ~3x faster than Mongoose docs

        // ── Smart Stale-Data Trigger ────────────────────────────────────────────
        // If any ACTIVE call hasn't been updated in the last 30 seconds,
        // fire runAutoUpdate() in the background (non-awaited, non-blocking).
        // This keeps prices genuinely fresh without waiting for the 60s cron.
        const STALE_THRESHOLD_MS = 30 * 1000; // 30 seconds
        const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
        const hasStaleActive = ideas.some(idea =>
            ['ACTIVE', 'TARGET1_HIT', 'TARGET2_HIT'].includes(idea.status) &&
            (!idea.lastPriceUpdate || new Date(idea.lastPriceUpdate) < staleCutoff)
        );
        if (hasStaleActive) {
            const { runAutoUpdate } = require('../services/portfolioAutoUpdater');
            runAutoUpdate().catch(err => console.error('[LivePrices] Background refresh error:', err.message));
        }

        // Compute PnL on the fly for each trade (same logic as the virtual)
        const payload = ideas.map(idea => {
            let cmp = idea.closingPrice || idea.currentPrice;
            let pnl = null;

            if (cmp) {
                // Apply status-based floor/cap (mirrors the virtual)
                if (!idea.closedAt) {
                    if (idea.type === 'BUY') {
                        if (idea.status === 'TARGET3_HIT' && idea.target3) cmp = Math.max(cmp, idea.target3);
                        else if (idea.status === 'TARGET2_HIT' && idea.target2) cmp = Math.max(cmp, idea.target2);
                        else if (idea.status === 'TARGET1_HIT' && idea.target) cmp = Math.max(cmp, idea.target);
                    } else {
                        if (idea.status === 'TARGET3_HIT' && idea.target3) cmp = Math.min(cmp, idea.target3);
                        else if (idea.status === 'TARGET2_HIT' && idea.target2) cmp = Math.min(cmp, idea.target2);
                        else if (idea.status === 'TARGET1_HIT' && idea.target) cmp = Math.min(cmp, idea.target);
                    }
                }

                const qty = idea.quantity || (idea.portfolioAmount ? idea.portfolioAmount / idea.entry : 1);
                const investedAmount = parseFloat((qty * idea.entry).toFixed(2));
                const diff = idea.type === 'BUY' ? (cmp - idea.entry) : (idea.entry - cmp);
                const rupees = parseFloat((diff * qty).toFixed(2));
                const percent = parseFloat(((diff / idea.entry) * 100).toFixed(2));

                pnl = {
                    qty: parseFloat(qty.toFixed(2)),
                    investedAmount,
                    rupees,
                    percent,
                    isProfit: rupees >= 0,
                    currentValue: parseFloat((investedAmount + rupees).toFixed(2)),
                    frozen: ['SL_HIT', 'TARGET3_HIT', 'CLOSED'].includes(idea.status),
                    currencies: {
                        USD: parseFloat((rupees * 0.012).toFixed(2)),
                        EUR: parseFloat((rupees * 0.011).toFixed(2)),
                        GBP: parseFloat((rupees * 0.0095).toFixed(2)),
                        AED: parseFloat((rupees * 0.044).toFixed(2)),
                        SGD: parseFloat((rupees * 0.016).toFixed(2))
                    }
                };
            }

            return {
                _id: idea._id,
                currentPrice: idea.currentPrice,
                status: idea.status,
                lastPriceUpdate: idea.lastPriceUpdate,
                frozen: ['SL_HIT', 'TARGET3_HIT', 'CLOSED'].includes(idea.status),
                pnl
            };
        });

        // Set cache headers: browser/CDN can cache for up to 2s
        res.setHeader('Cache-Control', 'public, max-age=2, stale-while-revalidate=1');
        res.json(payload);
    } catch (err) {
        console.error('[LivePrices] Error:', err.message);
        res.status(500).json({ message: 'Failed to fetch live prices' });
    }
};

// @desc    Close a trade idea (manual exit)
// @route   POST /api/trade-ideas/:id/close
exports.closeTradeIdea = async (req, res) => {
    const { closingPrice, notes } = req.body;
    try {
        const idea = await TradeIdea.findByIdAndUpdate(
            req.params.id,
            {
                status: 'CLOSED',
                closingPrice: parseFloat(closingPrice),
                closedAt: new Date(),
                currentPrice: parseFloat(closingPrice),
                lastPriceUpdate: new Date(),
                notes: notes || undefined // Update notes if provided on close
            },
            { new: true }
        );
        if (!idea) return res.status(404).json({ message: 'Trade idea not found' });
        res.json(idea);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
