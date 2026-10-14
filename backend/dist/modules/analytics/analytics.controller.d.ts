import { AnalyticsService } from './analytics.service';
import { UserRole } from '../../common/constants';
export declare class AnalyticsController {
    private readonly service;
    constructor(service: AnalyticsService);
    getDashboard(role: UserRole): any;
    getOrganizerDashboard(role: UserRole, userId: string): any;
    getClientDashboard(role: UserRole, userId: string): any;
    getStaffDashboard(role: UserRole, userId: string): any;
    getAttendeeDashboard(role: UserRole, userId: string): any;
}
//# sourceMappingURL=analytics.controller.d.ts.map