const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ message: 'Not authorized, token missing or malformed' });
            }
            const secret = process.env.JWT_SECRET || 'supersecret123';
            const decoded = jwt.verify(token, secret);
            
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'Not authorized, user not found' });
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    // Allow if role is admin OR if role is SUPER_ADMIN
    const role = String(req.user?.role || '').toUpperCase();
    if (req.user && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // token invalid - proceed without user
        }
    }
    next();
};

module.exports = { protect, admin, optionalAuth };
