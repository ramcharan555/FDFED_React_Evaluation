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
exports.ConfirmBookingDto = exports.UpdatePaymentStatusDto = exports.UpdateAgreementStatusDto = exports.ClientResponseDto = exports.RejectRequestDto = exports.ReviseProposalDto = exports.SendProposalDto = exports.ProvideMissingInfoDto = exports.RequestMissingInfoDto = exports.UpdateEventRequestStatusDto = exports.CreateEventRequestDto = void 0;
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
    (0, swagger_1.ApiProperty)({ description: 'Desired event date (YYYY-MM-DD)', example: '2026-09-01' }),
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
        enum: ['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'confirmed', 'approved', 'rejected', 'cancelled', 'withdrawn', 'expired'],
        example: 'under_review',
    }),
    (0, class_validator_1.IsEnum)(['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'confirmed', 'approved', 'rejected', 'cancelled', 'withdrawn', 'expired']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateEventRequestStatusDto.prototype, "status", void 0);
class RequestMissingInfoDto {
}
exports.RequestMissingInfoDto = RequestMissingInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Query / question requesting missing information from the client', example: 'Could you specify the preferred AV equipment and catering dietary preferences?' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestMissingInfoDto.prototype, "message", void 0);
class ProvideMissingInfoDto {
}
exports.ProvideMissingInfoDto = ProvideMissingInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client response to the missing info request', example: 'We require 3 wireless microphones, 4K projector, and 20% vegetarian meals.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProvideMissingInfoDto.prototype, "response", void 0);
class SendProposalDto {
}
exports.SendProposalDto = SendProposalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total proposed amount in INR', example: 60000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], SendProposalDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required deposit amount in INR', example: 15000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SendProposalDto.prototype, "depositRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Proposed event date if different (YYYY-MM-DD)', example: '2026-09-05' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendProposalDto.prototype, "proposedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Proposal validity expiration date (YYYY-MM-DD)', example: '2026-08-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendProposalDto.prototype, "validUntil", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Terms and conditions / deliverables', example: 'Includes full day hall rental, standard audio setup, and buffet catering.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendProposalDto.prototype, "terms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional notes for the client', example: 'Deposit required within 7 days of agreement to lock the venue.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendProposalDto.prototype, "notes", void 0);
class ReviseProposalDto extends SendProposalDto {
}
exports.ReviseProposalDto = ReviseProposalDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reason for proposal revision', example: 'Adjusted catering options and reduced deposit per client request.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviseProposalDto.prototype, "revisionReason", void 0);
class RejectRequestDto {
}
exports.RejectRequestDto = RejectRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mandatory reason for rejection', example: 'Venue is booked for maintenance on requested dates.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RejectRequestDto.prototype, "reason", void 0);
class ClientResponseDto {
}
exports.ClientResponseDto = ClientResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client decision on the proposal or request',
        enum: ['accept', 'request_revision', 'reject', 'withdraw'],
        example: 'accept',
    }),
    (0, class_validator_1.IsEnum)(['accept', 'request_revision', 'reject', 'withdraw']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Feedback or notes from the client', example: 'We accept the proposal terms and are ready to sign agreement.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ClientResponseDto.prototype, "notes", void 0);
class UpdateAgreementStatusDto {
}
exports.UpdateAgreementStatusDto = UpdateAgreementStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Agreement status',
        enum: ['not_sent', 'pending_signature', 'agreed', 'declined'],
        example: 'agreed',
    }),
    (0, class_validator_1.IsEnum)(['not_sent', 'pending_signature', 'agreed', 'declined']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateAgreementStatusDto.prototype, "agreementStatus", void 0);
class UpdatePaymentStatusDto {
}
exports.UpdatePaymentStatusDto = UpdatePaymentStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Deposit / Payment status',
        enum: ['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded'],
        example: 'deposit_paid',
    }),
    (0, class_validator_1.IsEnum)(['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdatePaymentStatusDto.prototype, "paymentStatus", void 0);
class ConfirmBookingDto {
}
exports.ConfirmBookingDto = ConfirmBookingDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Force confirm agreement if verified out-of-band', example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ConfirmBookingDto.prototype, "agreementConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Force confirm deposit if verified out-of-band', example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ConfirmBookingDto.prototype, "depositConfirmed", void 0);
//# sourceMappingURL=event-request.dto.js.map