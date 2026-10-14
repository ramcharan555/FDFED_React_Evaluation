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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const staff_service_1 = require("./staff.service");
const staff_dto_1 = require("./dtos/staff.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let StaffController = class StaffController {
    constructor(staffService) {
        this.staffService = staffService;
    }
    create(createStaffDto, role) {
        return this.staffService.create(createStaffDto, role);
    }
    findAll(role, search) {
        return this.staffService.findAll(role, search);
    }
    getStatistics(role) {
        // Only super admin may view aggregated staff statistics
        if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only super admin can view staff statistics');
        }
        return this.staffService.getStatistics();
    }
    findOne(id, role) {
        return this.staffService.findOne(id, role);
    }
    update(id, updateStaffDto, role, userId) {
        return this.staffService.update(id, updateStaffDto, role, userId);
    }
    delete(id, role) {
        return this.staffService.delete(id, role);
    }
    assignEvent(staffId, eventId, role) {
        return this.staffService.assignEvent(staffId, eventId, role);
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new staff member (superuser only)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Staff created successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - insufficient permissions',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_dto_1.CreateStaffDto, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all staff' }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        description: 'Search by staff name, email, or role',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of staff',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Attendees cannot view staff list',
    }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff statistics',
    }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff details',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Attendees cannot view staff details',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Staff not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update staff (superuser only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff updated successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request or insufficient permissions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Staff not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, staff_dto_1.UpdateStaffDto, String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete staff (superuser only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Insufficient permissions',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Staff not found',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/events/:eventId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Assign event to staff (superuser only)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Event assigned successfully',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad request - insufficient permissions',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('eventId')),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "assignEvent", null);
exports.StaffController = StaffController = __decorate([
    (0, swagger_1.ApiTags)('staff'),
    (0, common_1.Controller)('api/staff'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-role',
        description: 'User role (super_admin, client, event_organizer, event_staff, attendee)',
        required: true,
    }),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map