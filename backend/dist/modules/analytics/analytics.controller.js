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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let AnalyticsController = class AnalyticsController {
    constructor(service) {
        this.service = service;
    }
    getDashboard(role) {
        return this.service.getDashboard(role);
    }
    getOrganizerDashboard(role, userId) {
        return this.service.getOrganizerDashboard(role, userId);
    }
    getClientDashboard(role, userId) {
        return this.service.getClientDashboard(role, userId);
    }
    getStaffDashboard(role, userId) {
        return this.service.getStaffDashboard(role, userId);
    }
    getAttendeeDashboard(role, userId) {
        return this.service.getAttendeeDashboard(role, userId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Super admin dashboard — total users, events, revenue, registrations, pending requests, etc.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Dashboard analytics summary for SUPER_ADMIN',
        schema: {
            example: {
                success: true,
                data: {
                    users: { total: 12, active: 12, byRole: { super_admin: 1, client: 2, event_organizer: 3, event_staff: 3, attendee: 3 } },
                    events: { total: 4, published: 3, draft: 1 },
                    eventRequests: { total: 2, pending: 1, approved: 1 },
                    registrations: { total: 3 },
                    payments: { total: 2, totalRevenue: 298 },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only SUPER_ADMIN can view analytics' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('organizer-dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Event organizer dashboard: my events, registrations, staff assignments, revenue' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Organizer dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getOrganizerDashboard", null);
__decorate([
    (0, common_1.Get)('client-dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Client dashboard: my event requests, event plans, ongoing/completed events' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only CLIENT can view' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getClientDashboard", null);
__decorate([
    (0, common_1.Get)('staff-dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Event staff dashboard: my assignments, reports submitted, available dates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_STAFF can view' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getStaffDashboard", null);
__decorate([
    (0, common_1.Get)('attendee-dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Attendee dashboard: registered events, attendance status, tickets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only ATTENDEE can view' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getAttendeeDashboard", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('api/analytics'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for role-specific dashboard', required: false }),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map