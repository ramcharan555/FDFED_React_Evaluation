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
exports.AttendeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendees_service_1 = require("./attendees.service");
const attendee_dto_1 = require("./dtos/attendee.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
let AttendeesController = class AttendeesController {
    constructor(attendeesService) {
        this.attendeesService = attendeesService;
    }
    create(createAttendeeDto, role) {
        return this.attendeesService.create(createAttendeeDto, role);
    }
    findAll(role, search) {
        return this.attendeesService.findAll(role, search);
    }
    getStatistics() {
        return this.attendeesService.getStatistics();
    }
    findByEvent(eventId, role) {
        return this.attendeesService.findByEvent(eventId, role);
    }
    findOne(id, role) {
        return this.attendeesService.findOne(id, role);
    }
    update(id, updateAttendeeDto, role, userId) {
        return this.attendeesService.update(id, updateAttendeeDto, role, userId);
    }
    delete(id, role) {
        return this.attendeesService.delete(id, role);
    }
};
exports.AttendeesController = AttendeesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new attendee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Attendee created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - missing required fields or email already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendee_dto_1.CreateAttendeeDto, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all attendees' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by attendee name or email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of attendees' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendee statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('event/:eventId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendees for a specific event' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of attendees for the event' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "findByEvent", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendee by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Attendee not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update attendee' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request or insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Attendee not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attendee_dto_1.UpdateAttendeeDto, String, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete attendee (superuser only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Attendee not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendeesController.prototype, "delete", null);
exports.AttendeesController = AttendeesController = __decorate([
    (0, swagger_1.ApiTags)('attendees'),
    (0, common_1.Controller)('api/attendees'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({
        name: 'x-role',
        description: 'User role (super_admin, client, event_organizer, event_staff, attendee)',
        required: true,
    }),
    __metadata("design:paramtypes", [attendees_service_1.AttendeesService])
], AttendeesController);
//# sourceMappingURL=attendees.controller.js.map