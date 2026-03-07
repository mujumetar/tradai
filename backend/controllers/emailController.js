const nodemailer = require('nodemailer');
const User = require('../models/User');
const EmailTemplate = require('../models/EmailTemplate');
const webpush = require('web-push');

// Lazy transporter — created per request so .env changes take effect
const getTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Merge template variables like {{name}}, {{email}} etc.
const mergeTemplate = (html, subject, vars) => {
    let merged = html;
    let mergedSubject = subject;
    Object.entries(vars).forEach(([k, v]) => {
        merged = merged.replaceAll(`{{${k}}}`, v || '');
        mergedSubject = mergedSubject.replaceAll(`{{${k}}}`, v || '');
    });
    return { html: merged, subject: mergedSubject };
};

// ─── Template CRUD ─────────────────────────────────────────────────────────

exports.getTemplates = async (req, res) => {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
};

exports.createTemplate = async (req, res) => {
    const { name, subject, html, description, type } = req.body;
    const template = await EmailTemplate.create({ name, subject, html, description, type });
    res.status(201).json(template);
};

exports.seedTemplates = async (req, res) => {
    const samples = [
        {
            name: 'Welcome to liquide',
            subject: 'Welcome to the Future of Trading, {{name}}!',
            html: '<h1>Welcome aboard!</h1><p>Hi {{name}}, we are excited to have you with us. Explore our AI-powered research and start trading smarter.</p>',
            description: 'Send to new signups',
            type: 'email'
        },
        {
            name: 'New Premium Research',
            subject: 'New Premium Trade Idea Available',
            html: '<p>A new high-conviction trade idea has just been published for Premium members. Check it out now!</p>',
            description: 'Notify premium users about new content',
            type: 'email'
        },
        {
            name: 'Market Alert (Push)',
            subject: 'Market Alert',
            html: 'Volatility is high in the crypto market! Check the latest insights now.',
            description: 'General push alert',
            type: 'push'
        }
    ];
    await EmailTemplate.deleteMany({ name: { $in: samples.map(s => s.name) } });
    const templates = await EmailTemplate.insertMany(samples);
    res.status(201).json(templates);
};

exports.updateTemplate = async (req, res) => {
    const t = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ message: 'Template not found' });
    res.json(t);
};

exports.deleteTemplate = async (req, res) => {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted' });
};

// ─── User Filters ──────────────────────────────────────────────────────────

const getUsersByFilter = async (filter) => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const filters = {
        all: {},
        premium: { subscription: 'premium', status: 'active' },
        free: { subscription: 'free', status: 'active' },
        expiring: { subscription: 'premium', validUntil: { $lte: sevenDays, $gte: now } },
        inactive: { status: 'active', updatedAt: { $lte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }
    };

    return User.find(filters[filter] || {}).select('name email subscription validUntil');
};

// ─── Send Emails ──────────────────────────────────────────────────────────

exports.sendBulkEmail = async (req, res) => {
    const { templateId, filter, customSubject, customHtml } = req.body;

    let html, subject, type = 'email';
    if (templateId) {
        const template = await EmailTemplate.findById(templateId);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        html = template.html;
        subject = template.subject;
        type = template.type;
    } else if (customHtml && customSubject) {
        html = customHtml;
        subject = customSubject;
    } else {
        return res.status(400).json({ message: 'Provide templateId or customHtml+customSubject' });
    }

    const users = await getUsersByFilter(filter || 'all');
    if (users.length === 0) return res.json({ message: 'No users found for this filter', sent: 0 });

    const results = { sent: 0, failed: 0, errors: [] };

    // Handle Push Notifications
    if (type === 'push') {
        const payload = JSON.stringify({
            title: subject,
            body: html,
            url: '/research'
        });

        const pushUsers = await User.find({
            _id: { $in: users.map(u => u._id) },
            'pushSubscriptions.0': { $exists: true }
        });

        for (const user of pushUsers) {
            for (const sub of user.pushSubscriptions) {
                try {
                    await webpush.sendNotification(sub, payload);
                    results.sent++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({ email: user.email, error: err.message });
                }
            }
        }
        return res.json({ message: `Bulk push campaign complete`, ...results, total: users.length });
    }

    // Handle Emails (proceed with existing logic)
    const transporter = getTransporter();

    for (const user of users) {
        const vars = {
            name: user.name,
            email: user.email,
            subscription: user.subscription,
            validUntil: user.validUntil ? new Date(user.validUntil).toLocaleDateString() : 'N/A',
            supportEmail: 'support@liquide.com',
            year: new Date().getFullYear()
        };

        const { html: mergedHtml, subject: mergedSubject } = mergeTemplate(html, subject, vars);

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || `"liquide" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: mergedSubject,
                html: mergedHtml
            });
            results.sent++;
        } catch (err) {
            results.failed++;
            results.errors.push({ email: user.email, error: err.message });
        }
    }

    res.json({ message: `Bulk email complete`, ...results, total: users.length });
};

exports.sendSingleEmail = async (req, res) => {
    const { userId, templateId, subject: customSubject, html: customHtml } = req.body;

    const user = await User.findById(userId).select('name email subscription validUntil');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let html, subject;
    if (templateId) {
        const template = await EmailTemplate.findById(templateId);
        if (!template) return res.status(404).json({ message: 'Template not found' });
        html = template.html; subject = template.subject;
    } else {
        html = customHtml; subject = customSubject;
    }

    const vars = {
        name: user.name, email: user.email,
        subscription: user.subscription,
        validUntil: user.validUntil ? new Date(user.validUntil).toLocaleDateString() : 'N/A',
        year: new Date().getFullYear()
    };

    const { html: mergedHtml, subject: mergedSubject } = mergeTemplate(html, subject, vars);
    const transporter = getTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"liquide" <${process.env.SMTP_USER}>`,
        to: user.email, subject: mergedSubject, html: mergedHtml
    });

    res.json({ message: `Email sent to ${user.email}` });
};

// ─── Preview ────────────────────────────────────────────────────────────────

exports.previewTemplate = async (req, res) => {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Not found' });

    const demoVars = { name: 'Test User', email: 'test@example.com', subscription: 'premium', validUntil: '01/01/2026', year: new Date().getFullYear() };
    const { html, subject } = mergeTemplate(template.html, template.subject, demoVars);
    res.json({ subject, html });
};
