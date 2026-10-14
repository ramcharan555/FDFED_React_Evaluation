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
exports.UpdateAssignmentStatusDto = exports.CreateStaffAssignmentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateStaffAssignmentDto {
}
exports.CreateStaffAssignmentDto = CreateStaffAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID', example: 'evt-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffAssignmentDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organizer ID', example: 'org-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffAssignmentDto.prototype, "organizerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Staff ID', example: 'staff-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffAssignmentDto.prototype, "staffId", void 0);
class UpdateAssignmentStatusDto {
}
exports.UpdateAssignmentStatusDto = UpdateAssignmentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Assignment status',
        enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
        example: 'accepted',
    }),
    (0, class_validator_1.IsEnum)(['pending', 'accepted', 'declined', 'completed', 'cancelled']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateAssignmentStatusDto.prototype, "status", void 0);
//# sourceMappingURL=staff-assignment.dto.js.map