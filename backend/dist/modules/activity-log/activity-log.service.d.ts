import { ActivityLog } from '../../common/data-store';
import { UserRole } from '../../common/constants';
export declare class ActivityLogService {
    private dataStore;
    constructor();
    logActivity(logEntry: Omit<ActivityLog, 'id'>): ActivityLog;
    findAll(limit?: number, offset?: number): {
        logs: ActivityLog[];
        total: number;
    };
    findByRole(role: string): ActivityLog[];
    findByAction(action: string): ActivityLog[];
    findForClient(userId: string, role: UserRole, limit?: number): ActivityLog[];
    private belongsToClient;
    private containsClientIdentifier;
    getStatistics(): {
        totalActions: number;
        actionCounts: {
            [key: string]: number;
        };
        roleCounts: {
            [key: string]: number;
        };
    };
    clearLogs(): {
        message: string;
    };
}
//# sourceMappingURL=activity-log.service.d.ts.map