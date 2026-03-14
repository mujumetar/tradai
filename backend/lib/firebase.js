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
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            // Try Base64 first then JSON
            try {
                // Remove potential quotes adding during env editing
                const cleanRaw = raw.replace(/^['"]|['"]$/g, '');
                const decoded = Buffer.from(cleanRaw, 'base64').toString('utf8');
                serviceAccount = JSON.parse(decoded);
                console.log('Firebase: Decoded Base64 service account');
            } catch (e) {
                try {
                    serviceAccount = JSON.parse(raw);
                    console.log('Firebase: Parsed raw JSON service account');
                } catch (e2) {
                    console.error('Firebase: Failed to parse FIREBASE_SERVICE_ACCOUNT. Check .env formatting.');
                }
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
            // Fix for PEM formatting issue in env variables
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            
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
