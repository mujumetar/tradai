// Role-based access control middleware
// Usage: router.get('/route', protect, roles('admin', 'manager'), handler)
const roles = (...allowed) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    
    console.log(`RBAC CHECK: User [${req.user.email}] Role [${req.user.role}] Required [${allowed.join(', ')}]`);
    
    // SUPER_ADMIN bypass - ultimate clearance
    if (String(req.user.role).toUpperCase().trim() === 'SUPER_ADMIN') {
        console.log(`RBAC BYPASS: SUPER_ADMIN detected for ${req.user.email}`);
        return next();
    }
    
    if (allowed.includes(req.user.role)) return next();
    
    console.warn(`RBAC DENIED: User [${req.user.email}] Role [${req.user.role}] lacks [${allowed.join(', ')}]`);
    return res.status(403).json({
        message: `Access denied. Required roles: ${allowed.join(', ')}. Your role: ${req.user.role}`
    });
};

module.exports = roles;
