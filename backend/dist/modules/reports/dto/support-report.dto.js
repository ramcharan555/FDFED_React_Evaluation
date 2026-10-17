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
exports.CreateOperationalReportDto = exports.ReviewSupportReportDto = exports.CreateSupportReportDto = exports.SUPPORT_REPORT_CATEGORIES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.SUPPORT_REPORT_CATEGORIES = [
    'Registration & User Management', 'Event Operations Report', 'Support & Issue Summary',
];
class CreateSupportReportDto {
}
exports.CreateSupportReportDto = CreateSupportReportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.SUPPORT_REPORT_CATEGORIES }),
    (0, class_validator_1.IsIn)(exports.SUPPORT_REPORT_CATEGORIES),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['draft', 'submitted'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['draft', 'submitted']),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Stable reference used to retry a submission without duplicating it' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateSupportReportDto.prototype, "sourceReference", void 0);
class ReviewSupportReportDto {
}
exports.ReviewSupportReportDto = ReviewSupportReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 2000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], ReviewSupportReportDto.prototype, "feedback", void 0);
class CreateOperationalReportDto extends (0, swagger_1.OmitType)(CreateSupportReportDto, ['category']) {
}
exports.CreateOperationalReportDto = CreateOperationalReportDto;
__decorate([
    (0, class_validator_1.IsIn)(['Support Report', 'Finance Report', 'Combined Operational Report']),
    __metadata("design:type", String)
], CreateOperationalReportDto.prototype, "category", void 0);
//# sourceMappingURL=support-report.dto.js.map