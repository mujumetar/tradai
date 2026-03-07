const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, getMyApiKeys, createMyApiKey, deleteMyApiKey } = require('../controllers/userController');
const { saveSubscription, removeSubscription } = require('../controllers/pushController');
const { proxyLimo } = require('../controllers/limoController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/limo-proxy', protect, proxyLimo);

// Push Notifications
router.post('/push-subscribe', protect, saveSubscription);
router.post('/push-unsubscribe', protect, removeSubscription);

// API Key management
router.get('/keys', protect, getMyApiKeys);
router.post('/keys', protect, createMyApiKey);
router.delete('/keys/:id', protect, deleteMyApiKey);

module.exports = router;
