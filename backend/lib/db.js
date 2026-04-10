/**
 * Serverless-safe MongoDB connector.
 * Reuses an existing connection if already established (warm invocation).
 * Safe to call multiple times.
 */

const mongoose = require('mongoose');

let cached = global._mongooseConn;
if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
        if (!uri) {
            const availableKeys = Object.keys(process.env).join(', ');
            throw new Error(`MongoDB URI is missing! Available variables: [${availableKeys}]. Please check your Vercel Dashboard.`);
        }

        console.log('Connecting to MongoDB...');
        cached.promise = mongoose
            .connect(uri, {
                bufferCommands: false,
            })
            .then((m) => {
                console.log('MongoDB connection successful');
                return m;
            })
            .catch((err) => {
                console.error('MongoDB connection error:', err.message);
                cached.promise = null; // Reset promise so next request can retry
                throw err;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;
