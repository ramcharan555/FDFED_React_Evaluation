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
const event_policy_1 = require("../../common/event-policy");
let EventRequestsController = class EventRequestsController {
    constructor(service) {
        this.service = service;
    }
    policies() {
        return { success: true, data: (0, event_policy_1.getEventPolicy)() };
    }
    checkAvailability(organizerId, date) {
        return this.service.checkDateAvailability(organizerId, date);
    }
    findOrganizers(role) {
        return this.service.findOrganizers(role);
    }
    create(dto, role, userId) {
        return this.service.create(dto, role, userId);
    }
    findAll(role, userId) {
        return this.service.findAll(role, userId);
    }
    findOne(id, role, userId) {
        return this.service.findOne(id, role, userId);
    }
    startReview(id, role, userId) {
        return this.service.startReview(id, role, userId);
    }
    acceptRequest(id, acknowledgement, role, userId) {
        return this.service.acceptRequest(id, role, userId, acknowledgement);
    }
    acceptCounteroffer(id, acknowledgement, role, userId) {
        return this.service.acceptCounteroffer(id, role, userId, acknowledgement);
    }
    requestMissingInfo(id, dto, role, userId) {
        return this.service.requestMissingInfo(id, dto, role, userId);
    }
    provideMissingInfo(id, dto, role, userId) {
        return this.service.provideMissingInfo(id, dto, role, userId);
    }
    sendProposal(id, dto, role, userId) {
        return this.service.sendProposal(id, dto, role, userId);
    }
    reviseProposal(id, dto, role, userId) {
        return this.service.reviseProposal(id, dto, role, userId);
    }
    rejectRequest(id, dto, role, userId) {
        return this.service.rejectRequest(id, dto, role, userId);
    }
    clientResponse(id, dto, role, userId) {
        return this.service.clientResponse(id, dto, role, userId);
    }
    updateAgreementStatus(id, dto, role, userId) {
        return this.service.updateAgreementStatus(id, dto, role, userId);
    }
    updatePaymentStatus(id, dto, role, userId) {
        return this.service.updatePaymentStatus(id, dto, role, userId);
    }
    confirmBooking(id, dto, role, userId) {
        return this.service.confirmBooking(id, dto, role, userId);
    }
    updateStatus(id, dto, role, userId) {
        return this.service.updateStatus(id, dto, role, userId);
    }
};
exports.EventRequestsController = EventRequestsController;
__decorate([
    (0, common_1.Get)('policies'),
    (0, swagger_1.ApiOperation)({ summary: 'Read the event rules, cancellation policy, and terms acknowledged by clients and organizers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "policies", null);
__decorate([
    (0, common_1.Get)('check-availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Check date availability for an organizer' }),
    (0, swagger_1.ApiQuery)({ name: 'organizerId', required: true, example: 'org-001' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, example: '2026-09-05' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Date availability check results' }),
    __param(0, (0, common_1.Query)('organizerId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Get)('organizers'),
    (0, swagger_1.ApiOperation)({ summary: 'List public organizer profiles for event requests' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "findOrganizers", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event request (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event request created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Past date or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only CLIENT can create event requests' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Duplicate active request exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_request_dto_1.CreateEventRequestDto, String, String]),
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
    (0, common_1.Post)(':id/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Organizer starts review (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status moved to under_review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "startReview", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Organizer accepts an event request and starts planning' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_policy_1.EventPolicyAcknowledgementDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)(':id/accept-counteroffer'),
    (0, swagger_1.ApiOperation)({ summary: 'Organizer accepts the client counteroffer and starts planning' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_policy_1.EventPolicyAcknowledgementDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "acceptCounteroffer", null);
__decorate([
    (0, common_1.Post)(':id/request-info'),
    (0, swagger_1.ApiOperation)({ summary: 'Request missing information from client (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Query recorded and client notified' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.RequestMissingInfoDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "requestMissingInfo", null);
__decorate([
    (0, common_1.Post)(':id/provide-info'),
    (0, swagger_1.ApiOperation)({ summary: 'Client provides missing information (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Information provided and organizer notified' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.ProvideMissingInfoDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "provideMissingInfo", null);
__decorate([
    (0, common_1.Post)(':id/proposal'),
    (0, swagger_1.ApiOperation)({ summary: 'Send proposal to client (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Proposal recorded and status moved to proposal_sent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.SendProposalDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "sendProposal", null);
__decorate([
    (0, common_1.Post)(':id/revise-proposal'),
    (0, swagger_1.ApiOperation)({ summary: 'Revise proposal to client (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revised proposal version recorded' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.ReviseProposalDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "reviseProposal", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject request with mandatory reason (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request rejected and reason recorded' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.RejectRequestDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Post)(':id/client-response'),
    (0, swagger_1.ApiOperation)({ summary: 'Client responds to proposal: accept, request_revision, reject, withdraw (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Client decision recorded' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.ClientResponseDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "clientResponse", null);
__decorate([
    (0, common_1.Post)(':id/agreement'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agreement status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agreement status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.UpdateAgreementStatusDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "updateAgreementStatus", null);
__decorate([
    (0, common_1.Post)(':id/payment'),
    (0, swagger_1.ApiOperation)({ summary: 'Update deposit / payment status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.UpdatePaymentStatusDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "updatePaymentStatus", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm booking after agreement and deposit satisfied (ORGANIZER only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking confirmed and event created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing agreement or deposit satisfaction' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_request_dto_1.ConfirmBookingDto, String, String]),
    __metadata("design:returntype", void 0)
], EventRequestsController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update event request status (backward-compatible)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
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