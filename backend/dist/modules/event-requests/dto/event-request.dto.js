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
exports.UpdateEventRequestStatusDto = exports.CreateEventRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateEventRequestDto {
}
exports.CreateEventRequestDto = CreateEventRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client ID', example: 'cli-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventRequestDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organizer ID to send request to', example: 'org-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventRequestDto.prototype, "organizerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event name', example: 'Annual Company Gala' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventRequestDto.prototype, "eventName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Desired event date (YYYY-MM-DD)', example: '2024-09-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventRequestDto.prototype, "eventDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Budget in INR', example: 50000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateEventRequestDto.prototype, "budget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expected capacity', example: 200 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateEventRequestDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Special requirements', example: 'Need catering and live band' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventRequestDto.prototype, "requirements", void 0);
class UpdateEventRequestStatusDto {
}
exports.UpdateEventRequestStatusDto = UpdateEventRequestStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New status for the request',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        example: 'approved',
    }),
    (0, class_validator_1.IsEnum)(['pending', 'approved', 'rejected', 'cancelled']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateEventRequestStatusDto.prototype, "status", void 0);
//# sourceMappingURL=event-request.dto.js.map