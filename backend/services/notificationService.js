const nodemailer = require('nodemailer');
const webpush = require('web-push');
const User = require('../models/User');
const { initFirebase } = require('../lib/firebase');

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

// Init Firebase
const firebaseAdmin = initFirebase();

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

        const users = await User.find(filter).select('name email pushSubscriptions fcmTokens subscription');

        // Initialize results counter
        const results = { sent: 0, failed: 0 };

        // ─── 1. Push Notifications (Web Push) ────────────────────────────────
        const pushPayload = JSON.stringify({
            notification: {
                title: title,
                body: body,
                tag: options.tag, // Added tag support
                icon: '/apple-touch-icon.png'
            },
            data: {
                url: url
            }
        });
        const pushPromises = [];

        // ─── 2. FCM Notifications (Firebase) ───────────────────────────────
        const fcmPromises = [];
        const fcmMessages = [];
        let totalSubscriptions = 0;
        let totalFcmTokens = 0;

        users.forEach(user => {
            // Web Push
            if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                totalSubscriptions += user.pushSubscriptions.length;
                user.pushSubscriptions.forEach(sub => {
                    pushPromises.push(
                        webpush.sendNotification(sub, pushPayload)
                            .then(() => { results.sent++; })
                            .catch(err => {
                                results.failed++;
                                console.error(`[WebPush Error] ${user.email}:`, err.message);
                            })
                    );
                });
            }

            // FCM
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                totalFcmTokens += user.fcmTokens.length;
                if (firebaseAdmin) {
                    user.fcmTokens.forEach(token => {
                        fcmMessages.push({
                            token: token,
                            notification: { title, body },
                            data: { url },
                            webpush: {
                                fcmOptions: { link: url },
                                notification: {
                                    tag: options.tag, // Added tag support
                                    actions: [
                                        { action: 'view', title: 'View Research' },
                                        { action: 'close', title: 'Dismiss' }
                                    ]
                                }
                            }
                        });
                    });
                }
            }
        });

        console.log(`[NotificationService] Found ${totalSubscriptions} WebPush subs and ${totalFcmTokens} FCM tokens for ${users.length} users.`);


        // Batch send FCM
        if (fcmMessages.length > 0 && firebaseAdmin) {
            fcmMessages.forEach(msg => {
                fcmPromises.push(
                    firebaseAdmin.messaging().send(msg)
                        .then(() => { results.sent++; })
                        .catch(err => {
                            results.failed++;
                            console.error(`[FCM Error]`, err.message);
                        })
                );
            });
        }

        // ─── 3. Email Notifications ──────────────────────────────────────────
        const emailPromises = [];
        if (sendEmail && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com' && process.env.SMTP_USER !== '') {
            const transporter = getTransporter();
            for (const user of users) {
                emailPromises.push(
                    transporter.sendMail({
                        from: `"TRADAI" <no-reply@liquide.com>`,
                        to: user.email,
                        subject: title,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h2 style="color: #E78932;">${title}</h2>
                                <p>${body.replace(/\n/g, '<br>')}</p>
                                <a href="${`https://tradai.ai` || 'https://tradais.vercel.app'}${url}" 
                                   style="display: inline-block; background: #E78932; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                                    View Details
                                </a>
                                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                                <p style="font-size: 12px; color: #777;">You are receiving this because you are a ${user.subscription} member of TRADAI.</p>
                            </div>
                        `
                    })
                        .then(() => { results.sent++; })
                        .catch(err => {
                            results.failed++;
                            console.error(`[Email Notification Error] ${user.email}:`, err.message);
                        })
                );
            }
        }

        // Wait for all push and email notifications to be dispatched
        await Promise.all([...pushPromises, ...fcmPromises, ...emailPromises]);
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
/**
 * Notify specific users watching a particular trade about live price updates.
 * @param {Object} options 
 */
exports.notifyLivePrice = async ({ tradeIdea, price, pnlPercent }) => {
    try {
        const users = await User.find({
            watchedTradeIdeas: tradeIdea._id
        }).select('pushSubscriptions fcmTokens email subscription');

        if (!users.length) return;

        const title = `Live: ${tradeIdea.ticker} @ ₹${price}`;
        const body = `${tradeIdea.ticker} is ${pnlPercent >= 0 ? 'UP' : 'DOWN'} ${Math.abs(pnlPercent)}% today.\nStatus: ${tradeIdea.status}`;
        const tag = `live-${tradeIdea.ticker}`; // Tag ensures notifications are overwritten/updated, not stacked

        const pushPayload = JSON.stringify({
            notification: {
                title,
                body,
                tag,
                icon: '/apple-touch-icon.png',
                actions: [
                    { action: 'close', title: 'Close Tracking' }
                ]
            },
            data: { url: '/research' }
        });

        const promises = [];
        users.forEach(user => {
            // Web Push with tag replacement
            if (user.pushSubscriptions) {
                user.pushSubscriptions.forEach(sub => {
                    promises.push(webpush.sendNotification(sub, pushPayload).catch(() => { }));
                });
            }

            // FCM
            if (user.fcmTokens && firebaseAdmin) {
                user.fcmTokens.forEach(token => {
                    promises.push(firebaseAdmin.messaging().send({
                        token,
                        notification: { title, body },
                        android: {
                            notification: {
                                tag,
                                clickAction: 'OPEN_RESEARCH',
                                sticky: false,
                                visibility: 'public'
                            }
                        },
                        webpush: {
                            notification: {
                                tag,
                                actions: [{ action: 'close', title: 'Dismiss' }]
                            },
                            fcmOptions: { link: '/research' }
                        }
                    }).catch(() => { }));
                });
            }
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('[NotificationService] Live notify failed:', err.message);
    }
};
