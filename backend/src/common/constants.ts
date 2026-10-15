// Role enum for type safety - matches spec exactly
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CLIENT = 'client',
  EVENT_ORGANIZER = 'event_organizer',
  EVENT_STAFF = 'event_staff',
  ATTENDEE = 'attendee',
}

// Normalized role names from frontend (support lowercase/underscore variants)
export const ROLE_ALIASES: Record<string, UserRole> = {
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
export function normalizeRole(roleStr: string): UserRole | null {
  if (!roleStr) return null;
  const normalized = ROLE_ALIASES[roleStr.toLowerCase()];
  return normalized || null;
}

// Role-based access control permissions - per spec
export const ROLE_PERMISSIONS = {
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

export enum EmployeeType {
  SUPPORT_EXECUTIVE = 'SUPPORT_EXECUTIVE',
  REGISTRATION_VERIFICATION = 'REGISTRATION_VERIFICATION',
  EVENT_OPERATIONS = 'EVENT_OPERATIONS',
  SUPPORT_FINANCE = 'SUPPORT_FINANCE',
  FINANCE_EXECUTIVE = 'FINANCE_EXECUTIVE',
}
