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
exports.StaffAssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const staff_assignments_service_1 = require("./staff-assignments.service");
const staff_assignment_dto_1 = require("./dto/staff-assignment.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let StaffAssignmentsController = class StaffAssignmentsController {
    constructor(service) {
        this.service = service;
    }
    create(dto, role) {
        return this.service.create(dto, role);
    }
    findAll(role, userId) {
        return this.service.findAll(role, userId);
    }
    updateStatus(id, dto, role, userId) {
        return this.service.updateStatus(id, dto, role, userId);
    }
};
exports.StaffAssignmentsController = StaffAssignmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Assign staff to event (EVENT_ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Assignment created. Staff notified.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_ORGANIZER can assign staff' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Staff already assigned to this event' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_assignment_dto_1.CreateStaffAssignmentDto, String]),
    __metadata("design:returntype", void 0)
], StaffAssignmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List assignments (role-filtered: staff sees own, organizer sees own, admin sees all)' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StaffAssignmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept/decline assignment (EVENT_STAFF). Cancel (ORGANIZER).' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assignment status updated. Organizer notified.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Staff can only update own assignments' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Assignment not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, staff_assignment_dto_1.UpdateAssignmentStatusDto, String, String]),
    __metadata("design:returntype", void 0)
], StaffAssignmentsController.prototype, "updateStatus", null);
exports.StaffAssignmentsController = StaffAssignmentsController = __decorate([
    (0, swagger_1.ApiTags)('staff-assignments'),
    (0, common_1.Controller)('api/staff-assignments'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership', required: false }),
    __metadata("design:paramtypes", [staff_assignments_service_1.StaffAssignmentsService])
], StaffAssignmentsController);
//# sourceMappingURL=staff-assignments.controller.js.map