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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const attendance_dto_1 = require("./dto/attendance.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
let AttendanceController = class AttendanceController {
    constructor(service) {
        this.service = service;
    }
    verify(dto, role) {
        return this.service.verify(dto, role);
    }
    findAll(role, eventId) {
        return this.service.findAll(role, eventId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify attendee check-in using QR code or verification ID (EVENT_STAFF only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendee checked in successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_STAFF can verify attendance' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No registration found for provided QR/verification ID' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Attendee already checked in' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_dto_1.VerifyAttendanceDto, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List attendance records' }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event ID' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, common_1.Query)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "findAll", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('attendance'),
    (0, common_1.Controller)('api/attendance'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map