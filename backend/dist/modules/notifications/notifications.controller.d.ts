import { NotificationsService } from './notifications.service';
import { UserRole } from '../../common/constants';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    findAll(role: UserRole, userId: string): any[];
    getUnreadCount(userId: string): any;
    markRead(id: string, userId: string): any;
    markAllRead(userId: string): any;
}
//# sourceMappingURL=notifications.controller.d.ts.map