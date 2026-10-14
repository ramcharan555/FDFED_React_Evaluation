export declare class AppService {
    getWelcome(): {
        message: string;
        version: string;
        endpoints: {
            auth: string;
            users: string;
            events: string;
            'event-requests': string;
            'event-plans': string;
            attendees: string;
            registrations: string;
            payments: string;
            staff: string;
            'staff-assignments': string;
            attendance: string;
            reports: string;
            reviews: string;
            notifications: string;
            analytics: string;
            'activity-logs': string;
            'api-docs': string;
        };
        docs: string;
        roles: string[];
        'pass-role-header': string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
}
//# sourceMappingURL=app.service.d.ts.map