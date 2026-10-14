export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    CLIENT = "client",
    EVENT_ORGANIZER = "event_organizer",
    EVENT_STAFF = "event_staff",
    ATTENDEE = "attendee"
}
export declare const ROLE_ALIASES: Record<string, UserRole>;
export declare function normalizeRole(roleStr: string): UserRole | null;
export declare const ROLE_PERMISSIONS: {
    super_admin: {
        users: string[];
        events: string[];
        clients: string[];
        organizers: string[];
        staff: string[];
        attendees: string[];
        'event-requests': string[];
        'event-plans': string[];
        registrations: string[];
        payments: string[];
        attendance: string[];
        'staff-assignments': string[];
        reports: string[];
        reviews: string[];
        notifications: string[];
        analytics: string[];
    };
    client: {
        'event-requests': string[];
        'event-plans': string[];
        events: string[];
        attendees: string[];
        registrations: string[];
        payments: string[];
        reviews: string[];
        notifications: string[];
    };
    event_organizer: {
        'event-requests': string[];
        'event-plans': string[];
        events: string[];
        staff: string[];
        attendees: string[];
        'staff-assignments': string[];
        attendance: string[];
        reports: string[];
        reviews: string[];
        notifications: string[];
    };
    event_staff: {
        'staff-assignments': string[];
        events: string[];
        attendance: string[];
        reports: string[];
        reviews: string[];
        notifications: string[];
    };
    attendee: {
        events: string[];
        registrations: string[];
        payments: string[];
        tickets: string[];
        attendance: string[];
        reviews: string[];
        notifications: string[];
    };
};
export declare enum EmployeeType {
    REGISTRATION_VERIFICATION = "REGISTRATION_VERIFICATION",
    EVENT_OPERATIONS = "EVENT_OPERATIONS",
    SUPPORT_FINANCE = "SUPPORT_FINANCE"
}
//# sourceMappingURL=constants.d.ts.map