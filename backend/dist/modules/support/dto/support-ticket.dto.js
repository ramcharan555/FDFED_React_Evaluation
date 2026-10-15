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
exports.CreateSupportFollowUpDto = exports.UpdateSupportTicketStatusDto = exports.CreateSupportTicketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const support_constants_1 = require("../support.constants");
class CreateSupportTicketDto {
}
exports.CreateSupportTicketDto = CreateSupportTicketDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: Object.keys(support_constants_1.SUPPORT_CONCERNS) }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(Object.keys(support_constants_1.SUPPORT_CONCERNS)),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "requestType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Concern selected from the request type options' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "concern", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 5000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateSupportTicketDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], maxItems: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSupportTicketDto.prototype, "attachmentIds", void 0);
class UpdateSupportTicketStatusDto {
}
exports.UpdateSupportTicketStatusDto = UpdateSupportTicketStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['open', 'in_progress', 'resolved'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['open', 'in_progress', 'resolved']),
    __metadata("design:type", String)
], UpdateSupportTicketStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 2000, description: 'Reply visible to the requester in their support ticket' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateSupportTicketStatusDto.prototype, "response", void 0);
class CreateSupportFollowUpDto {
}
exports.CreateSupportFollowUpDto = CreateSupportFollowUpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 2000 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateSupportFollowUpDto.prototype, "message", void 0);
//# sourceMappingURL=support-ticket.dto.js.map