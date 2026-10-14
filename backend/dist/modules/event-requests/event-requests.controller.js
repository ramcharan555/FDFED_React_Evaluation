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
exports.EventRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const event_requests_service_1 = require("./event-requests.service");
const event_request_dto_1 = require("./dto/event-request.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let EventRequestsController = class EventRequestsController {
    constructor(service) {
        this.service = service;
    }
    create(dto, role) {
        return this.service.create(dto, role);
    }
    findAll(role, userId) {
        return this.service.findAll(role, userId);
    }
    findOne(id, role, userId) {
        return this.service.findOne(id, role, userId);
    }
    updateStatus(id, dto, role, userId) {
        return this.service.updateStatus(id, dto, role, userId);
    }
};
exports.EventRequestsController = EventRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event request (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event request created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only CLIENT can create event requests' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_request_dto_1.CreateEventRequestDto, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List event requests (role-filtered)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of event requests filtered by role' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event request by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event request details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update event request status (ORGANIZER approves/rejects, CLIENT cancels)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated. Notifies client.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event request not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.UpdateEventRequestStatusDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "updateStatus", null);
exports.EventRequestsController = EventRequestsController = __decorate([
    (0, swagger_1.ApiTags)('event-requests'),
    (0, common_1.Controller)('api/event-requests'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role (client, event_organizer, super_admin)', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership checks', required: false }),
    __metadata("design:paramtypes", [event_requests_service_1.EventRequestsService])
], EventRequestsController);
//# sourceMappingURL=event-requests.controller.js.map