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
        console.log('Connecting to MongoDB...');
        cached.promise = mongoose
            .connect(process.env.MONGO_URI, {
                bufferCommands: false,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
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
