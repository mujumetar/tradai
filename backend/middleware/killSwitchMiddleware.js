const SystemSettings = require('../models/SystemSettings');

const killSwitchMiddleware = async (req, res, next) => {
    // Allow super admin commands to bypass the kill switch
    if (req.path.startsWith('/api/_cmd-hq-00x')) {
        return next();
    }

    try {
        const maintenanceMode = await SystemSettings.findOne({ key: 'MAINTENANCE_MODE' });
        
        if (maintenanceMode && maintenanceMode.value === true) {
            return res.status(503).json({ 
                message: 'System is currently under maintenance. All API traffic is temporarily blocked by Super Admin.',
                code: 'MAINTENANCE_MODE_ACTIVE'
            });
        }
        next();
    } catch (error) {
        // If DB query fails, allow traffic to proceed rather than downing the app accidentally
        console.error("Kill Switch Check Error:", error);
        next();
    }
};

module.exports = killSwitchMiddleware;
