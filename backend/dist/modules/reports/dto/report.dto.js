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
exports.CreateStaffReviewDto = exports.CreateEventReviewDto = exports.CreateStaffReportDto = exports.CreateEventReportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateEventReportDto {
}
exports.CreateEventReportDto = CreateEventReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID', example: 'evt-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organizer ID', example: 'org-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "organizerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Client ID', example: 'cli-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Staff ID (if submitted by staff)', example: 'staff-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "submittedByStaffId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Report title', example: 'Tech Conference 2024 - Final Report' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "reportTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Report details', example: 'Event was successful with 450 attendees.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "reportDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Submission date (YYYY-MM-DD)', example: '2024-06-20' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReportDto.prototype, "submissionDate", void 0);
class CreateStaffReportDto {
}
exports.CreateStaffReportDto = CreateStaffReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Staff ID', example: 'staff-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReportDto.prototype, "staffId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organizer ID', example: 'org-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReportDto.prototype, "organizerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID', example: 'evt-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReportDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Report text', example: 'Event ran smoothly. Check-in was efficient.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReportDto.prototype, "reportText", void 0);
class CreateEventReviewDto {
}
exports.CreateEventReviewDto = CreateEventReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reviewer ID (attendeeId or clientId)', example: 'att-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReviewDto.prototype, "reviewerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID', example: 'evt-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReviewDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rating (1–5)', minimum: 1, maximum: 5, example: 5 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateEventReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Review comment', example: 'Excellent event!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventReviewDto.prototype, "comment", void 0);
class CreateStaffReviewDto {
}
exports.CreateStaffReviewDto = CreateStaffReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organizer ID (reviewer)', example: 'org-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReviewDto.prototype, "reviewerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Staff ID being reviewed', example: 'staff-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReviewDto.prototype, "staffId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID', example: 'evt-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReviewDto.prototype, "eventId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rating (1–5)', minimum: 1, maximum: 5, example: 5 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateStaffReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Review comment', example: 'Very professional.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStaffReviewDto.prototype, "comment", void 0);
//# sourceMappingURL=report.dto.js.map