/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Roles:
 * - admin: Full system access
 * - manager: Content management and analytics
 * - support: User management and ticket handling
 * - user: Standard access (should not see admin panel)
 */

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPPORT: 'support',
    USER: 'user',
    SUPER_ADMIN: 'SUPER_ADMIN'
};

export const PERMISSIONS = {
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_USERS: 'manage_users',
    MANAGE_BLOGS: 'manage_blogs',
    MANAGE_TRADE_IDEAS: 'manage_trade_ideas',
    HANDLE_TICKETS: 'handle_tickets',
    MANAGE_EMAILS: 'manage_emails',
    VIEW_LOGS: 'view_logs',
    MANAGE_PAYMENTS: 'manage_payments',
    MANAGE_API_KEYS: 'manage_api_keys',
    SEND_PUSH: 'send_push',
    MANAGE_DEVICES: 'manage_devices',
    SYSTEM_SETTINGS: 'system_settings'
};

const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS),
    [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.MANAGE_BLOGS,
        PERMISSIONS.MANAGE_TRADE_IDEAS,
        PERMISSIONS.HANDLE_TICKETS,
        PERMISSIONS.MANAGE_EMAILS,
        PERMISSIONS.SEND_PUSH
    ],
    [ROLES.SUPPORT]: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.HANDLE_TICKETS
    ],
    [ROLES.USER]: []
};

/**
 * Check if a user has a specific permission
 * @param {Object} user User object containing role
 * @param {string} permission Permission string from PERMISSIONS
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
};

/**
 * Check if a user has any of the required roles
 * @param {Object} user User object
 * @param {string[]} allowedRoles Array of role strings
 * @returns {boolean}
 */
export const hasRole = (user, allowedRoles) => {
    if (!user || !user.role) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return allowedRoles.includes(user.role);
};

export default {
    ROLES,
    PERMISSIONS,
    hasPermission,
    hasRole
};
