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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const report_dto_1 = require("./dto/report.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    createEventReport(dto, role) {
        return this.service.createEventReport(dto, role);
    }
    findAllEventReports(role, userId) {
        return this.service.findAllEventReports(role, userId);
    }
    createStaffReport(dto, role) {
        return this.service.createStaffReport(dto, role);
    }
    findAllStaffReports(role, userId) {
        return this.service.findAllStaffReports(role, userId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event report (EVENT_ORGANIZER sends final report to client)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event report created. Notifies client.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_ORGANIZER can create event reports' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateEventReportDto, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createEventReport", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'List event reports (role-filtered)' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAllEventReports", null);
__decorate([
    (0, common_1.Post)('staff'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create staff report (EVENT_STAFF only, must be assigned to event)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff report created. Organizer notified.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Staff can only report for assigned events' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateStaffReportDto, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createStaffReport", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, swagger_1.ApiOperation)({ summary: 'List staff reports (role-filtered)' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAllStaffReports", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('api/reports'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership', required: false }),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map