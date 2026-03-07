/**
 * Seed Script - Run once to create admin user in MongoDB
 * Usage: node backend/seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const TradeIdea = require('./models/TradeIdea');
const Blog = require('./models/Blog');

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Wipe existing data
    await User.deleteMany();
    await Blog.deleteMany();
    await TradeIdea.deleteMany();
    console.log('Collections cleared.');

    // Delete existing admin/manager/support
    await User.deleteMany({ role: { $in: ['admin', 'manager', 'support'] } });

    // Create Admin
    await User.create({
        name: 'muju (Admin)',
        email: 'admin@liquide.com',
        password: 'admin123',
        role: 'admin',
        subscription: 'premium'
    });

    // Create Manager
    await User.create({
        name: 'Alice (Manager)',
        email: 'manager@liquide.com',
        password: 'manager123',
        role: 'manager',
        subscription: 'premium'
    });

    // Create Support
    await User.create({
        name: 'Bob (Support)',
        email: 'support@liquide.com',
        password: 'support123',
        role: 'support',
        subscription: 'free'
    });

    console.log('✅ Admin, Manager, and Support users created!');

    // Seed sample blogs
    await Blog.insertMany([
        {
            title: 'Why Nifty 50 is still bullish in 2025',
            content: 'Detailed analysis of Nifty 50 market trends...',
            author: 'liquide Research',
            date: 'Jan 15, 2025',
            category: 'Finance',
            isPremium: false
        },
        {
            title: 'Exclusive: Top 5 Mid-Cap Stocks for 2025',
            content: 'Premium content on top stock picks...',
            author: 'liquide Research',
            date: 'Feb 01, 2025',
            category: 'Finance',
            isPremium: true
        }
    ]);
    console.log('Sample blogs seeded.');

    // Seed sample trade ideas
    await TradeIdea.insertMany([
        {
            title: 'RELIANCE - Bullish Breakout',
            ticker: 'RELIANCE',
            type: 'BUY',
            entry: 2450,
            target: 2700,
            stopLoss: 2350,
            isPremium: true,
            status: 'ACTIVE'
        },
        {
            title: 'TCS - Strong Q4 Expected',
            ticker: 'TCS',
            type: 'BUY',
            entry: 3800,
            target: 4200,
            stopLoss: 3600,
            isPremium: false,
            status: 'ACTIVE'
        }
    ]);
    console.log('Sample trade ideas seeded.');

    console.log('\n✅ Seeding complete!');
    console.log('Admin credentials: admin@liquide.com / admin123');
    process.exit(0);
};

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
