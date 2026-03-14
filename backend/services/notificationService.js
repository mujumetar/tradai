const nodemailer = require('nodemailer');
const webpush = require('web-push');
const User = require('../models/User');

/**
 * Centrally managed notification service for Email and Push.
 */

// Email Transporter setup
const getTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Notify all relevant users about new content.
 * @param {Object} options 
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body/content
 * @param {string} options.url - Link for the notification
 * @param {string} options.type - 'all', 'premium', or 'free'
 * @param {boolean} options.sendEmail - Whether to send email notifications
 */
exports.notifyUsers = async ({ title, body, url = '/research', type = 'all', sendEmail = true }) => {
    try {
        const filter = {};
        if (type === 'premium') filter.subscription = 'premium';
        if (type === 'free') filter.subscription = 'free';

        const users = await User.find(filter).select('name email pushSubscriptions subscription');
        
        // ─── 1. Push Notifications ───────────────────────────────────────────
        const pushPayload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                url: url,
            },
            actions: [
                { action: 'view', title: 'View Research', icon: '/icon-192.png' },
                { action: 'close', title: 'Dismiss' }
            ]
        });

        users.forEach(user => {
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                user.pushSubscriptions.forEach(sub => {
                    pushPromises.push(
                        webpush.sendNotification(sub, pushPayload).catch(err => {
                            console.error(`[Push Notification Error] ${user.email}:`, err.message);
                        })
                    );
                });
            }
        });

        // ─── 2. Email Notifications ──────────────────────────────────────────
        if (sendEmail && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
            const transporter = getTransporter();
            for (const user of users) {
                transporter.sendMail({
                    from: process.env.EMAIL_FROM || `"liquide" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: title,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #E78932;">${title}</h2>
                            <p>${body.replace(/\n/g, '<br>')}</p>
                            <a href="${process.env.FRONTEND_URL || 'https://tradais.vercel.app'}${url}" 
                               style="display: inline-block; background: #E78932; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                               View Details
                            </a>
                            <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                            <p style="font-size: 12px; color: #777;">You are receiving this because you are a ${user.subscription} member of liquide.</p>
                        </div>
                    `
                }).catch(err => console.error(`[Email Notification Error] ${user.email}:`, err.message));
            }
        }

        // Wait for all push notifications to be dispatched
        await Promise.all(pushPromises);
        console.log(`[NotificationService] Sent to ${users.length} users successfully (Type: ${type})`);
        
        return {
            sent: results.sent,
            failed: results.failed,
            total: users.length
        };
    } catch (err) {
        console.error('[NotificationService] Global failure:', err.message);
        return { sent: 0, failed: 0, total: 0, error: err.message };
    }
};
