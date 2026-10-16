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
exports.EventPlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const event_plans_service_1 = require("./event-plans.service");
const event_plan_dto_1 = require("./dto/event-plan.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let EventPlansController = class EventPlansController {
    constructor(service) {
        this.service = service;
    }
    create(dto, role) {
        return this.service.create(dto, role);
    }
    findAll(role, userId) {
        return this.service.findAll(role, userId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    updateApproval(id, dto, role, userId) {
        return this.service.updateApproval(id, dto, role, userId);
    }
};
exports.EventPlansController = EventPlansController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event plan (EVENT_ORGANIZER)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event plan created. Notifies client.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_plan_dto_1.CreateEventPlanDto, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List event plans (role-filtered)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event plans filtered by role' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event plan by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event plan details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approval'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve/reject event plan (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Approval status updated. Notifies organizer.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only CLIENT can approve/reject' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_plan_dto_1.UpdateEventPlanApprovalDto, String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "updateApproval", null);
exports.EventPlansController = EventPlansController = __decorate([
    (0, swagger_1.ApiTags)('event-plans'),
    (0, common_1.Controller)('api/event-plans'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership checks', required: false }),
    __metadata("design:paramtypes", [event_plans_service_1.EventPlansService])
], EventPlansController);
//# sourceMappingURL=event-plans.controller.js.map