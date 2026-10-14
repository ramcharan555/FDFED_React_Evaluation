"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
let NotificationsService = class NotificationsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    findAll(role, userId) {
        if (!userId)
            throw new common_1.ForbiddenException('x-user-id header is required to view notifications');
        return this.db.notifications.filter(n => n.userId === userId);
    }
    markRead(notificationId, userId) {
        if (!userId)
            throw new common_1.ForbiddenException('User ID is required');
        const notif = this.db.notifications.find(n => n.notificationId === notificationId && n.userId === userId);
        if (!notif)
            throw new common_1.NotFoundException('Notification not found');
        notif.read = true;
        return { success: true, message: 'Notification marked as read', data: notif };
    }
    markAllRead(userId) {
        if (!userId)
            throw new common_1.ForbiddenException('User ID is required');
        const notifs = this.db.notifications.filter(n => n.userId === userId);
        notifs.forEach(n => n.read = true);
        return { success: true, message: `${notifs.length} notifications marked as read` };
    }
    getUnreadCount(userId) {
        if (!userId)
            throw new common_1.ForbiddenException('User ID is required');
        const count = this.db.notifications.filter(n => n.userId === userId && !n.read).length;
        return { userId, unreadCount: count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map