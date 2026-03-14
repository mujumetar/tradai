const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * 
 * If FIREBASE_SERVICE_ACCOUNT is provided in .env (as a base64 string or JSON), 
 * it will use that. Otherwise, it will look for a firebase-service-account.json file.
 */

let initialized = false;

function initFirebase() {
    if (initialized) return admin;

    try {
        let serviceAccount;

        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Can be a JSON string or a Base64 encoded JSON string
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
            try {
                serviceAccount = JSON.parse(raw);
            } catch (e) {
                // If not JSON, try base64
                serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString());
            }
        } else {
            // Fallback to local file
            const path = require('path');
            const fs = require('fs');
            const localPath = path.join(__dirname, '../firebase-service-account.json');
            
            if (fs.existsSync(localPath)) {
                serviceAccount = require(localPath);
            }
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            initialized = true;
            console.log('Firebase Admin SDK initialized successfully');
        } else {
            console.warn('Firebase Admin SDK NOT initialized: Missing FIREBASE_SERVICE_ACCOUNT');
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error.message);
    }

    return admin;
}

module.exports = { initFirebase, admin };
