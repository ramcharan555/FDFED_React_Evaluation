import { UserRole } from '../../common/constants';
export declare class AnalyticsService {
    private db;
    constructor();
    getDashboard(role: UserRole): any;
    getOrganizerDashboard(role: UserRole, userId: string): any;
    getClientDashboard(role: UserRole, userId: string): any;
    getStaffDashboard(role: UserRole, userId: string): any;
    getAttendeeDashboard(role: UserRole, userId: string): any;
}
//# sourceMappingURL=analytics.service.d.ts.map