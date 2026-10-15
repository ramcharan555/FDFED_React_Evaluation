"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeType = exports.ROLE_PERMISSIONS = exports.ROLE_ALIASES = exports.UserRole = void 0;
exports.normalizeRole = normalizeRole;
// Role enum for type safety - matches spec exactly
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["CLIENT"] = "client";
    UserRole["EVENT_ORGANIZER"] = "event_organizer";
    UserRole["EVENT_STAFF"] = "event_staff";
    UserRole["ATTENDEE"] = "attendee";
})(UserRole || (exports.UserRole = UserRole = {}));
// Normalized role names from frontend (support lowercase/underscore variants)
exports.ROLE_ALIASES = {
    // Super Admin variants
    'super_admin': UserRole.SUPER_ADMIN,
    'superadmin': UserRole.SUPER_ADMIN,
    'super-admin': UserRole.SUPER_ADMIN,
    // Client variants
    'client': UserRole.CLIENT,
    // Event Organizer variants
    'event_organizer': UserRole.EVENT_ORGANIZER,
    'organizer': UserRole.EVENT_ORGANIZER,
    'event-organizer': UserRole.EVENT_ORGANIZER,
    // Event Staff variants
    'event_staff': UserRole.EVENT_STAFF,
    'staff': UserRole.EVENT_STAFF,
    'event-staff': UserRole.EVENT_STAFF,
    // Attendee variants
    'attendee': UserRole.ATTENDEE,
};
// Normalize role string to canonical value
function normalizeRole(roleStr) {
    if (!roleStr)
        return null;
    const normalized = exports.ROLE_ALIASES[roleStr.toLowerCase()];
    return normalized || null;
}
// Role-based access control permissions - per spec
exports.ROLE_PERMISSIONS = {
    [UserRole.SUPER_ADMIN]: {
        users: ['create', 'read', 'update', 'delete'],
        events: ['create', 'read', 'update', 'delete'],
        clients: ['create', 'read', 'update', 'delete'],
        organizers: ['create', 'read', 'update', 'delete'],
        staff: ['create', 'read', 'update', 'delete'],
        attendees: ['create', 'read', 'update', 'delete'],
        'event-requests': ['create', 'read', 'update', 'delete', 'approve'],
        'event-plans': ['create', 'read', 'update', 'delete', 'approve'],
        registrations: ['create', 'read', 'update', 'delete'],
        payments: ['create', 'read', 'update', 'delete'],
        attendance: ['create', 'read', 'update', 'verify'],
        'staff-assignments': ['create', 'read', 'update', 'delete'],
        reports: ['create', 'read', 'update', 'delete'],
        reviews: ['create', 'read'],
        notifications: ['create', 'read'],
        analytics: ['read'],
    },
    [UserRole.CLIENT]: {
        'event-requests': ['create', 'read'],
        'event-plans': ['read', 'approve'],
        events: ['read'],
        attendees: ['read'],
        registrations: ['read'],
        payments: ['read'],
        reviews: ['create', 'read'],
        notifications: ['read'],
    },
    [UserRole.EVENT_ORGANIZER]: {
        'event-requests': ['read', 'approve'],
        'event-plans': ['create', 'read', 'update'],
        events: ['create', 'read', 'update', 'delete'],
        staff: ['read'],
        attendees: ['read'],
        'staff-assignments': ['create', 'read', 'update', 'delete'],
        attendance: ['read', 'verify'],
        reports: ['create', 'read'],
        reviews: ['read'],
        notifications: ['read'],
    },
    [UserRole.EVENT_STAFF]: {
        'staff-assignments': ['read', 'update'],
        events: ['create', 'read', 'update'],
        registrations: ['create', 'read', 'update'],
        attendance: ['create', 'update', 'verify'],
        reports: ['create', 'read', 'update'],
        reviews: ['create', 'read'],
        notifications: ['read'],
        users: ['read', 'update'],
        'event-requests': ['create', 'read', 'update'],
    },
    [UserRole.ATTENDEE]: {
        events: ['read'],
        registrations: ['create', 'read'],
        payments: ['create', 'read'],
        tickets: ['read'],
        attendance: ['read'],
        reviews: ['create', 'read'],
        notifications: ['read'],
    },
};
var EmployeeType;
(function (EmployeeType) {
    EmployeeType["SUPPORT_EXECUTIVE"] = "SUPPORT_EXECUTIVE";
    EmployeeType["REGISTRATION_VERIFICATION"] = "REGISTRATION_VERIFICATION";
    EmployeeType["EVENT_OPERATIONS"] = "EVENT_OPERATIONS";
    EmployeeType["SUPPORT_FINANCE"] = "SUPPORT_FINANCE";
    EmployeeType["FINANCE_EXECUTIVE"] = "FINANCE_EXECUTIVE";
})(EmployeeType || (exports.EmployeeType = EmployeeType = {}));
//# sourceMappingURL=constants.js.map