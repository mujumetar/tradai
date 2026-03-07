const express = require('express');
const router = express.Router();
const {
    getAllUsers, updateUser, getPayments, updateUserStatus,
    banIp, getBannedIps, unbanIp, getUserInvoices, getLogs,
    createUser, deleteUser, getAnalytics, createApiKey, getApiKeys, updateApiKey, deleteApiKey,
    getDeviceBans, banDevice, updateDeviceBan, unbanDevice, getUserDevices
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

// Analytics
router.get('/analytics', getAnalytics);

// User CRUD
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/status', updateUserStatus);

// Payments & Invoices
router.get('/payments', getPayments);
router.get('/invoices/:userId', getUserInvoices);

// IP Banning
router.post('/ban-ip', banIp);
router.get('/banned-ips', getBannedIps);
router.delete('/banned-ips/:ip', unbanIp);

// Request Logs
router.get('/logs', getLogs);

// API Keys
router.post('/api-keys', createApiKey);
router.get('/api-keys', getApiKeys);
router.put('/api-keys/:id', updateApiKey);
router.delete('/api-keys/:id', deleteApiKey);

// Device Management
router.get('/devices', getDeviceBans);
router.post('/devices/ban', banDevice);
router.put('/devices/:id', updateDeviceBan);
router.delete('/devices/:id', unbanDevice);
router.get('/user-devices', getUserDevices);

module.exports = router;
