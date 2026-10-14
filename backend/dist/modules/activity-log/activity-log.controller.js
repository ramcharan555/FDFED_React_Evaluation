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
exports.ActivityLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const activity_log_service_1 = require("./activity-log.service");
const role_guard_1 = require("../../common/guards/role.guard");
let ActivityLogController = class ActivityLogController {
    constructor(activityLogService) {
        this.activityLogService = activityLogService;
    }
    findAll(limit, offset) {
        return this.activityLogService.findAll(limit ? parseInt(limit) : 100, offset ? parseInt(offset) : 0);
    }
    findByRole(role) {
        return this.activityLogService.findByRole(role);
    }
    findByAction(action) {
        return this.activityLogService.findByAction(action);
    }
    getStatistics() {
        return this.activityLogService.getStatistics();
    }
    clearLogs() {
        return this.activityLogService.clearLogs();
    }
};
exports.ActivityLogController = ActivityLogController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all activity logs' }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Limit results (default: 100)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'offset',
        required: false,
        type: Number,
        description: 'Offset for pagination (default: 0)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity logs',
    }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-role/:role'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity logs by role' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity logs filtered by role',
    }),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "findByRole", null);
__decorate([
    (0, common_1.Get)('by-action/:action'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity logs by action' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity logs filtered by action',
    }),
    __param(0, (0, common_1.Param)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "findByAction", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity log statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity statistics',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all activity logs' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All logs cleared',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "clearLogs", null);
exports.ActivityLogController = ActivityLogController = __decorate([
    (0, common_1.Controller)('api/activity-logs'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-role',
        description: 'User role',
        required: true,
    }),
    __metadata("design:paramtypes", [activity_log_service_1.ActivityLogService])
], ActivityLogController);
//# sourceMappingURL=activity-log.controller.js.map