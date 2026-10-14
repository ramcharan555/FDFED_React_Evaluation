import { UserRole } from '../../common/constants';
export declare class NotificationsService {
    private db;
    constructor();
    findAll(role: UserRole, userId: string): any[];
    markRead(notificationId: string, userId: string): any;
    markAllRead(userId: string): any;
    getUnreadCount(userId: string): any;
}
//# sourceMappingURL=notifications.service.d.ts.map