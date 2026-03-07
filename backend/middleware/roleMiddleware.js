// Role-based access control middleware
// Usage: router.get('/route', protect, roles('admin', 'manager'), handler)
const roles = (...allowed) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (allowed.includes(req.user.role)) return next();
    return res.status(403).json({
        message: `Access denied. Required roles: ${allowed.join(', ')}. Your role: ${req.user.role}`
    });
};

module.exports = roles;
