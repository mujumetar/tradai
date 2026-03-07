const Blog = require('../models/Blog');
const TradeIdea = require('../models/TradeIdea');
const User = require('../models/User');
const webpush = require('web-push');

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
    const ideas = await TradeIdea.find().sort({ createdAt: -1 });
    const user = req.user;

    const gatedIdeas = ideas.map(idea => {
        const obj = idea.toObject();
        if (obj.isPremium && (!user || user.subscription !== 'premium')) {
            return { ...obj, target: 'LOCKED', stopLoss: 'LOCKED', isLocked: true };
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

        // Push notification logic
        const users = await User.find({ 'pushSubscriptions.0': { $exists: true } });

        const payload = JSON.stringify({
            title: `New Trade Idea: ${idea.ticker}`,
            body: `${idea.type} ${idea.ticker} at ${idea.entry}. Target: ${idea.target}`,
            url: '/research'
        });

        const pushPromises = [];
        users.forEach(user => {
            user.pushSubscriptions.forEach(sub => {
                pushPromises.push(
                    webpush.sendNotification(sub, payload).catch(err => {
                        console.error('Push error:', err.endpoint);
                    })
                );
            });
        });

        // We don't wait for all pushes to finish before responding to admin
        Promise.all(pushPromises);

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
