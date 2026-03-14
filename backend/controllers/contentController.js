const Blog = require('../models/Blog');
const TradeIdea = require('../models/TradeIdea');
const User = require('../models/User');
const webpush = require('web-push');
const axios = require('axios');
const { fetchLivePrice } = require('../services/portfolioAutoUpdater');

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
        
        notifyUsers({
            title: `🚀 New Trade Idea: ${idea.ticker}`,
            body: `Conviction: ${idea.timeHorizon || 'High'}\nQty: ${idea.quantity}\nType: ${idea.type}\nEntry: ${idea.entry}\nTarget: ${idea.target}\nStop Loss: ${idea.stopLoss}`,
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
        const { data } = await axios.get(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        const results = (data.quotes || []).map(qt => ({
            symbol: qt.symbol,
            name: qt.shortname || qt.longname || qt.symbol,
            exchange: qt.exchange,
            type: qt.quoteType
        }));
        res.json(results);
    } catch(err) {
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

// @desc    Close a trade idea (manual exit)
// @route   POST /api/trade-ideas/:id/close
exports.closeTradeIdea = async (req, res) => {
    const { closingPrice } = req.body;
    try {
        const idea = await TradeIdea.findByIdAndUpdate(
            req.params.id,
            {
                status: 'CLOSED',
                closingPrice: parseFloat(closingPrice),
                closedAt: new Date(),
                currentPrice: parseFloat(closingPrice),
                lastPriceUpdate: new Date(),
            },
            { new: true }
        );
        if (!idea) return res.status(404).json({ message: 'Trade idea not found' });
        res.json(idea);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
