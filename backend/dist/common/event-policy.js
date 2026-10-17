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
exports.EventPolicyAcknowledgementDto = void 0;
exports.getEventPolicy = getEventPolicy;
exports.assertEventPolicyAccepted = assertEventPolicyAccepted;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const EVENT_POLICY = {
    version: '2026-10-17.1',
    cancellation: { minimumNoticeDays: 14, feePercent: 10 },
    sections: [
        { title: 'Event rules', items: [
                'Provide accurate event dates, venue, guest capacity, budget, and requirements.',
                'The client and organizer must agree on venue permissions, safety arrangements, capacity limits, and the services to be provided.',
                'Record changes to the date, budget, venue, or services in the event request and obtain the other party’s approval.',
            ] },
        { title: 'Cancellation and refund policy', items: [
                'The client may cancel an approved ongoing event only when at least 14 days remain before its scheduled start time (India Standard Time).',
                'A cancellation fee of 10% of the amount actually paid is deducted. The refund due is the remaining 90%. No fee is charged if nothing has been paid.',
                'A cancellation reason and confirmation of the fee and refund amount are required. The event and linked request are cancelled, and the organizer is notified.',
                'Any refund due is recorded as pending review. Cancelling the event does not mean the refund has already been paid.',
            ] },
        { title: 'Terms and conditions', items: [
                'Accepting a request starts planning. The event is created only after the client approves the final event plan.',
                'The latest approved plan defines the agreed scope, schedule, services, capacity, and budget. Plan revisions require a reason and a new client approval.',
                'Both parties must acknowledge these rules, policies, and terms. The accepted policy version and acknowledgement times are saved with the request.',
                'Payments and refunds in this application use a demo provider and do not transfer real money.',
            ] },
    ],
};
function getEventPolicy() {
    return structuredClone(EVENT_POLICY);
}
class EventPolicyAcknowledgementDto {
}
exports.EventPolicyAcknowledgementDto = EventPolicyAcknowledgementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Explicit acceptance of the displayed event rules, policies, and terms', example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.Equals)(true),
    __metadata("design:type", Boolean)
], EventPolicyAcknowledgementDto.prototype, "policyAccepted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Version of the displayed event policy', example: EVENT_POLICY.version }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EventPolicyAcknowledgementDto.prototype, "acceptedPolicyVersion", void 0);
function assertEventPolicyAccepted(acknowledgement, policy) {
    if (acknowledgement.policyAccepted !== true || acknowledgement.acceptedPolicyVersion !== policy.version) {
        throw new common_1.BadRequestException('Read and accept the displayed event rules, policies, and terms before continuing. Refresh if the policy version has changed.');
    }
}
//# sourceMappingURL=event-policy.js.map