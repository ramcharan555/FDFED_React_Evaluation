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
exports.EventRequestsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let EventRequestsService = class EventRequestsService {
    constructor() {
        this.db = data_store_1.DataStore.getInstance();
    }
    /**
     * Helper: Check if date is in the past
     */
    isPastDate(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(dateStr);
        return targetDate < today;
    }
    /**
     * Check date availability for an organizer
     */
    checkDateAvailability(organizerId, dateStr) {
        if (!dateStr || !dateStr.trim()) {
            return { available: false, reason: 'Date string is required' };
        }
        if (this.isPastDate(dateStr)) {
            return {
                available: false,
                reason: 'Event date is in the past',
                pastDate: true,
            };
        }
        const organizer = this.db.organizers.find(o => o.organizerId === organizerId || o.userId === organizerId);
        const validOrgIds = new Set([organizerId]);
        if (organizer) {
            validOrgIds.add(organizer.organizerId);
            validOrgIds.add(organizer.userId);
        }
        // Check organizer's existing active events
        const conflictEvent = this.db.events.find(e => (validOrgIds.has(e.organizerId) || validOrgIds.has(e.organizer)) &&
            e.date === dateStr &&
            e.status !== 'cancelled');
        if (conflictEvent) {
            return {
                available: false,
                reason: `Organizer already has an event scheduled on ${dateStr} ("${conflictEvent.name || conflictEvent.title}")`,
                conflictEvent: {
                    eventId: conflictEvent.eventId || conflictEvent.id,
                    name: conflictEvent.name || conflictEvent.title,
                    date: conflictEvent.date,
                    venue: conflictEvent.location || conflictEvent.venue,
                },
            };
        }
        // Check organizer's confirmed requests on the same date
        const conflictRequest = this.db.eventRequests.find(r => (validOrgIds.has(r.organizerId) || validOrgIds.has(r.organizer)) &&
            r.eventDate === dateStr &&
            r.status === 'confirmed');
        if (conflictRequest) {
            return {
                available: false,
                reason: `Organizer already has a confirmed event request on ${dateStr} ("${conflictRequest.eventName}")`,
                conflictEvent: {
                    requestId: conflictRequest.requestId,
                    name: conflictRequest.eventName,
                    date: conflictRequest.eventDate,
                },
            };
        }
        return {
            available: true,
            reason: 'Date is available for booking',
        };
    }
    /**
     * Auto-expire proposals that have passed their validUntil date
     */
    checkAndExpireProposals(requests) {
        const now = new Date();
        for (const req of requests) {
            if ((req.status === 'proposal_sent' || req.status === 'awaiting_client') &&
                Array.isArray(req.proposals) &&
                req.proposals.length > 0) {
                const activeProposal = req.proposals[req.proposals.length - 1];
                if (activeProposal &&
                    activeProposal.status === 'pending_client' &&
                    activeProposal.validUntil) {
                    const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
                    if (validUntilDate < now) {
                        activeProposal.status = 'expired';
                        req.status = 'expired';
                        req.updatedAt = new Date();
                        req.auditHistory = req.auditHistory || [];
                        req.auditHistory.push({
                            id: this.db.generateId('aud'),
                            action: `Proposal (v${activeProposal.version}) Expired`,
                            performedBy: 'system',
                            role: 'system',
                            timestamp: new Date(),
                            details: { validUntil: activeProposal.validUntil },
                        });
                    }
                }
            }
        }
    }
    create(dto, role, userId) {
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only CLIENT can create event requests');
        }
        const client = this.db.clients.find((item) => item.userId === userId || item.clientId === userId);
        if (role === constants_1.UserRole.CLIENT && !client) {
            throw new common_1.ForbiddenException('Client profile not found');
        }
        const clientId = role === constants_1.UserRole.CLIENT ? client.clientId : dto.clientId;
        const organizer = this.db.organizers.find((item) => item.organizerId === dto.organizerId || item.userId === dto.organizerId);
        if (!organizer) {
            throw new common_1.BadRequestException('Selected organizer was not found');
        }
        if (this.isPastDate(dto.eventDate)) {
            throw new common_1.BadRequestException('Desired event date cannot be in the past');
        }
        if (dto.budget <= 0) {
            throw new common_1.BadRequestException('Budget must be greater than zero');
        }
        if (dto.capacity < 1) {
            throw new common_1.BadRequestException('Capacity must be at least 1 guest');
        }
        // Check for duplicate active requests
        const isDuplicate = this.db.eventRequests.some(r => r.clientId === clientId &&
            r.organizerId === organizer.organizerId &&
            r.eventName.toLowerCase().trim() === dto.eventName.toLowerCase().trim() &&
            r.eventDate === dto.eventDate &&
            ['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'confirmed'].includes(r.status));
        if (isDuplicate) {
            throw new common_1.ConflictException(`A pending or active event request for "${dto.eventName}" on ${dto.eventDate} already exists.`);
        }
        const requestId = this.db.generateId('req');
        const request = {
            requestId,
            clientId,
            organizerId: organizer.organizerId,
            eventName: dto.eventName.trim(),
            eventType: dto.eventType?.trim() || 'General',
            eventDate: dto.eventDate,
            eventTime: dto.eventTime?.trim() || '00:00',
            city: dto.city?.trim() || '',
            dateFlexibility: dto.dateFlexibility || 'exact',
            budget: Number(dto.budget),
            capacity: Number(dto.capacity),
            requirements: dto.requirements || '',
            notes: dto.notes || '',
            status: 'submitted',
            agreementStatus: 'not_sent',
            paymentStatus: 'unpaid',
            currentProposalVersion: 0,
            proposals: [],
            clarifications: [],
            auditHistory: [
                {
                    id: this.db.generateId('aud'),
                    action: 'Request Submitted',
                    performedBy: userId || clientId,
                    role: role,
                    timestamp: new Date(),
                    details: { budget: dto.budget, capacity: dto.capacity, eventDate: dto.eventDate, eventType: dto.eventType, city: dto.city },
                },
            ],
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventRequests.push(request);
        // Notify organizer
        this.db.notifications.push({
            notificationId: this.db.generateId('notif'),
            userId: organizer.userId,
            eventId: undefined,
            registrationId: undefined,
            paymentId: undefined,
            message: `New event request: "${dto.eventName}" from client ${clientId}`,
            type: 'event_request',
            read: false,
            dateTime: new Date(),
            createdAt: new Date(),
        });
        return { success: true, message: 'Event request submitted successfully', data: request };
    }
    findAll(role, userId) {
        this.checkAndExpireProposals(this.db.eventRequests);
        let requests = [...this.db.eventRequests];
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
            const clientId = client ? client.clientId : userId;
            requests = requests.filter(r => r.clientId === clientId || r.clientId === userId);
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
            const organizerId = organizer ? organizer.organizerId : userId;
            requests = requests.filter(r => r.organizerId === organizerId || r.organizerId === userId || r.organizer === userId || r.organizer === organizerId);
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return requests;
    }
    findOne(requestId, role, userId) {
        this.checkAndExpireProposals(this.db.eventRequests);
        const request = this.db.eventRequests.find(r => r.requestId === requestId || r.id === requestId);
        if (!request)
            throw new common_1.NotFoundException(`Event request ${requestId} not found`);
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
            const clientId = client ? client.clientId : userId;
            if (request.clientId !== clientId && request.clientId !== userId) {
                throw new common_1.ForbiddenException('Access denied to this request');
            }
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
            const organizerId = organizer ? organizer.organizerId : userId;
            if (request.organizerId !== organizerId &&
                request.organizerId !== userId &&
                request.organizer !== userId &&
                request.organizer !== organizerId) {
                throw new common_1.ForbiddenException('Access denied to this request');
            }
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return request;
    }
    /**
     * Organizer starts review of a submitted request
     */
    startReview(requestId, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can start request reviews');
        }
        if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
            throw new common_1.BadRequestException(`Cannot review a request that is already ${request.status}`);
        }
        if (request.status !== 'under_review') {
            request.status = 'under_review';
            request.updatedAt = new Date();
            request.auditHistory = request.auditHistory || [];
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: 'Review Started',
                performedBy: userId || 'organizer',
                role: role,
                timestamp: new Date(),
                details: { previousStatus: request.status },
            });
        }
        return { success: true, message: 'Request is now under review', data: request };
    }
    /**
     * Organizer requests missing info from client
     */
    requestMissingInfo(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can request missing information');
        }
        if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
            throw new common_1.BadRequestException(`Cannot request info for a request that is ${request.status}`);
        }
        if (!dto.message || !dto.message.trim()) {
            throw new common_1.BadRequestException('Message is required when requesting information');
        }
        request.clarifications = request.clarifications || [];
        request.clarifications.push({
            id: this.db.generateId('clr'),
            senderId: userId || 'organizer',
            senderRole: 'organizer',
            senderName: 'Organizer',
            message: dto.message.trim(),
            timestamp: new Date(),
        });
        request.status = 'info_requested';
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: 'Missing Information Requested',
            performedBy: userId || 'organizer',
            role: role,
            timestamp: new Date(),
            details: { query: dto.message.trim() },
        });
        // Notify client
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        const clientUser = client ? this.db.findUserById(client.userId) : null;
        if (clientUser) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: clientUser.userId,
                eventId: undefined,
                registrationId: undefined,
                paymentId: undefined,
                message: `Organizer requested additional information for "${request.eventName}": "${dto.message.slice(0, 60)}..."`,
                type: 'info_requested',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Information requested from client', data: request };
    }
    /**
     * Client provides missing information
     */
    provideMissingInfo(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only client can respond to missing information requests');
        }
        if (!dto.response || !dto.response.trim()) {
            throw new common_1.BadRequestException('Response is required');
        }
        request.clarifications = request.clarifications || [];
        request.clarifications.push({
            id: this.db.generateId('clr'),
            senderId: userId || 'client',
            senderRole: 'client',
            senderName: 'Client',
            message: dto.response.trim(),
            timestamp: new Date(),
        });
        request.status = 'under_review';
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: 'Information Provided by Client',
            performedBy: userId || 'client',
            role: role,
            timestamp: new Date(),
            details: { response: dto.response.trim() },
        });
        // Notify organizer
        const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
        if (organizer) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: organizer.userId,
                eventId: undefined,
                registrationId: undefined,
                paymentId: undefined,
                message: `Client provided information for "${request.eventName}"`,
                type: 'info_provided',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Information sent to organizer', data: request };
    }
    /**
     * Organizer sends proposal
     */
    sendProposal(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can send proposals');
        }
        if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
            throw new common_1.BadRequestException(`Cannot send proposal for a request that is ${request.status}`);
        }
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Proposal amount must be greater than zero');
        }
        if (dto.depositRequired < 0 || dto.depositRequired > dto.amount) {
            throw new common_1.BadRequestException('Deposit required must be between 0 and total amount');
        }
        if (this.isPastDate(dto.validUntil)) {
            throw new common_1.BadRequestException('Proposal expiration date cannot be in the past');
        }
        const proposedDate = dto.proposedDate || request.eventDate;
        if (this.isPastDate(proposedDate)) {
            throw new common_1.BadRequestException('Proposed event date cannot be in the past');
        }
        // Check date availability
        const avail = this.checkDateAvailability(request.organizerId, proposedDate);
        if (!avail.available) {
            throw new common_1.ConflictException(`Cannot propose date ${proposedDate}: ${avail.reason}`);
        }
        request.proposals = request.proposals || [];
        // If there were any existing pending proposals, mark them superseded
        request.proposals.forEach((p) => {
            if (p.status === 'pending_client')
                p.status = 'revision_requested';
        });
        const newVersion = (request.proposals.length || 0) + 1;
        const proposal = {
            version: newVersion,
            amount: Number(dto.amount),
            depositRequired: Number(dto.depositRequired),
            proposedDate,
            validUntil: dto.validUntil,
            terms: dto.terms || 'Standard service agreement terms apply.',
            notes: dto.notes || '',
            status: 'pending_client',
            sentAt: new Date(),
        };
        request.proposals.push(proposal);
        request.currentProposalVersion = newVersion;
        request.status = 'proposal_sent';
        request.agreementStatus = 'not_sent';
        request.paymentStatus = 'unpaid';
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: `Proposal Sent (v${newVersion})`,
            performedBy: userId || 'organizer',
            role: role,
            timestamp: new Date(),
            details: {
                version: newVersion,
                amount: dto.amount,
                depositRequired: dto.depositRequired,
                validUntil: dto.validUntil,
                proposedDate,
            },
        });
        // Notify client
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        const clientUser = client ? this.db.findUserById(client.userId) : null;
        if (clientUser) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: clientUser.userId,
                eventId: undefined,
                registrationId: undefined,
                paymentId: undefined,
                message: `New proposal received for "${request.eventName}" (v${newVersion}: ₹${dto.amount.toLocaleString()})`,
                type: 'proposal_sent',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: `Proposal v${newVersion} sent successfully`, data: request };
    }
    /**
     * Organizer revises existing proposal
     */
    reviseProposal(requestId, dto, role, userId) {
        return this.sendProposal(requestId, dto, role, userId);
    }
    /**
     * Organizer rejects request with mandatory reason
     */
    rejectRequest(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can reject event requests');
        }
        if (request.status === 'confirmed') {
            throw new common_1.BadRequestException('Cannot reject an already confirmed request. Please cancel the booking instead.');
        }
        if (!dto.reason || !dto.reason.trim()) {
            throw new common_1.BadRequestException('A reason is mandatory when declining/rejecting a request');
        }
        request.status = 'rejected';
        request.rejectionReason = dto.reason.trim();
        request.updatedAt = new Date();
        // Mark any active proposal as rejected
        if (Array.isArray(request.proposals)) {
            request.proposals.forEach((p) => {
                if (p.status === 'pending_client')
                    p.status = 'rejected';
            });
        }
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: 'Request Rejected',
            performedBy: userId || 'organizer',
            role: role,
            timestamp: new Date(),
            details: { reason: dto.reason.trim() },
        });
        // Notify client
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        const clientUser = client ? this.db.findUserById(client.userId) : null;
        if (clientUser) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: clientUser.userId,
                eventId: undefined,
                registrationId: undefined,
                paymentId: undefined,
                message: `Your event request "${request.eventName}" was declined: ${dto.reason.trim()}`,
                type: 'request_rejected',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Request rejected with reason recorded', data: request };
    }
    /**
     * Client responds to proposal (accept, request_revision, reject, withdraw)
     */
    clientResponse(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only clients can respond to proposals');
        }
        if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
            throw new common_1.BadRequestException(`Cannot respond to a request that is already ${request.status}`);
        }
        const proposals = request.proposals || [];
        const activeProposal = proposals[proposals.length - 1];
        if (dto.decision === 'withdraw') {
            request.status = 'withdrawn';
            request.withdrawalReason = dto.notes || 'Withdrawn by client';
            request.updatedAt = new Date();
            request.auditHistory = request.auditHistory || [];
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: 'Request Withdrawn by Client',
                performedBy: userId || 'client',
                role: role,
                timestamp: new Date(),
                details: { notes: dto.notes },
            });
            return { success: true, message: 'Event request withdrawn', data: request };
        }
        if (!activeProposal) {
            throw new common_1.BadRequestException('No active proposal found on this request to respond to');
        }
        if (request.status !== 'proposal_sent' || activeProposal.status !== 'pending_client') {
            throw new common_1.BadRequestException('This proposal is no longer awaiting a client decision');
        }
        if (dto.decision === 'request_revision' && !dto.notes?.trim()) {
            throw new common_1.BadRequestException('A reason is required when requesting a revised proposal');
        }
        // Check expiry
        if (activeProposal.validUntil) {
            const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
            if (validUntilDate < new Date()) {
                activeProposal.status = 'expired';
                request.status = 'expired';
                request.updatedAt = new Date();
                throw new common_1.BadRequestException('This proposal has expired. Please request a revised proposal.');
            }
        }
        activeProposal.clientResponseAt = new Date();
        activeProposal.clientNotes = dto.notes?.trim() || '';
        if (dto.decision === 'accept') {
            activeProposal.status = 'accepted';
            request.status = 'awaiting_client';
            request.agreementStatus = 'pending_signature';
            request.paymentStatus = 'deposit_pending';
            request.updatedAt = new Date();
            request.auditHistory = request.auditHistory || [];
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: `Proposal Accepted (v${activeProposal.version})`,
                performedBy: userId || 'client',
                role: role,
                timestamp: new Date(),
                details: { notes: dto.notes },
            });
        }
        else if (dto.decision === 'request_revision') {
            activeProposal.status = 'revision_requested';
            request.status = 'under_review';
            request.updatedAt = new Date();
            request.auditHistory = request.auditHistory || [];
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: `Revision Requested by Client (v${activeProposal.version})`,
                performedBy: userId || 'client',
                role: role,
                timestamp: new Date(),
                details: { notes: dto.notes },
            });
        }
        else if (dto.decision === 'reject') {
            activeProposal.status = 'rejected';
            request.status = 'rejected';
            request.rejectionReason = dto.notes || 'Proposal rejected by client';
            request.updatedAt = new Date();
            request.auditHistory = request.auditHistory || [];
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: `Proposal Rejected by Client (v${activeProposal.version})`,
                performedBy: userId || 'client',
                role: role,
                timestamp: new Date(),
                details: { notes: dto.notes },
            });
        }
        // Notify organizer
        const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
        if (organizer) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: organizer.userId,
                eventId: undefined,
                registrationId: undefined,
                paymentId: undefined,
                message: dto.decision === 'request_revision'
                    ? `Client requested a revised plan for "${request.eventName}": ${activeProposal.clientNotes}`
                    : `Client responded to proposal for "${request.eventName}": ${dto.decision.toUpperCase()}`,
                type: `proposal_${dto.decision}`,
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: `Response "${dto.decision}" recorded`, data: request };
    }
    /**
     * Update Agreement Status (agreed, pending_signature, declined)
     */
    updateAgreementStatus(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        request.agreementStatus = dto.agreementStatus;
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: `Agreement Status: ${dto.agreementStatus}`,
            performedBy: userId || 'user',
            role: role,
            timestamp: new Date(),
        });
        return { success: true, message: `Agreement status updated to ${dto.agreementStatus}`, data: request };
    }
    /**
     * Update Payment Status (unpaid, deposit_pending, deposit_paid, fully_paid)
     */
    updatePaymentStatus(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        request.paymentStatus = dto.paymentStatus;
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: `Payment Status: ${dto.paymentStatus}`,
            performedBy: userId || 'user',
            role: role,
        });
        return { success: true, message: `Payment status updated to ${dto.paymentStatus}`, data: request };
    }
    /**
     * Confirm booking: STRICTLY requires agreementStatus === 'agreed' AND paymentStatus satisfied
     */
    confirmBooking(requestId, dto, role, userId) {
        const request = this.findOne(requestId, role, userId);
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can confirm event bookings');
        }
        if (request.status === 'confirmed') {
            return { success: true, message: 'Booking is already confirmed', data: request };
        }
        if (request.status === 'rejected' || request.status === 'withdrawn') {
            throw new common_1.BadRequestException(`Cannot confirm a request that has been ${request.status}`);
        }
        // Check agreement condition
        const isAgreed = request.agreementStatus === 'agreed' || dto?.agreementConfirmed;
        if (!isAgreed) {
            throw new common_1.BadRequestException('Cannot confirm booking: Signed agreement is required before confirmation. (Agreement status: ' +
                request.agreementStatus +
                ')');
        }
        // Check payment / deposit condition
        const isDepositSatisfied = request.paymentStatus === 'deposit_paid' ||
            request.paymentStatus === 'fully_paid' ||
            dto?.depositConfirmed;
        if (!isDepositSatisfied) {
            throw new common_1.BadRequestException('Cannot confirm booking: Required deposit/payment must be satisfied before confirmation. (Payment status: ' +
                request.paymentStatus +
                ')');
        }
        // Check date availability one more time to prevent double-booking
        const eventDate = request.proposals?.length
            ? request.proposals[request.proposals.length - 1].proposedDate || request.eventDate
            : request.eventDate;
        const avail = this.checkDateAvailability(request.organizerId, eventDate);
        if (!avail.available && !avail.reason?.includes('already has a confirmed')) {
            throw new common_1.ConflictException(`Cannot confirm booking for date ${eventDate}: ${avail.reason}`);
        }
        // Create Event in db.events
        const eventId = this.db.generateId('evt');
        const newEvent = {
            eventId,
            organizerId: request.organizerId,
            clientId: request.clientId,
            name: request.eventName,
            category: 'Corporate',
            date: eventDate,
            time: '10:00',
            location: 'TBD',
            capacity: request.capacity,
            ticketPrice: 0,
            status: 'ongoing',
            description: request.requirements,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.events.push(newEvent);
        request.status = 'confirmed';
        request.agreementStatus = 'agreed';
        if (request.paymentStatus === 'unpaid' || request.paymentStatus === 'deposit_pending') {
            request.paymentStatus = 'deposit_paid';
        }
        request.eventId = eventId;
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: 'Booking Confirmed & Event Created',
            performedBy: userId || 'organizer',
            role: role,
            timestamp: new Date(),
            details: { eventId, eventDate, budget: request.budget },
        });
        // Notify client
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        const clientUser = client ? this.db.findUserById(client.userId) : null;
        if (clientUser) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: clientUser.userId,
                eventId,
                registrationId: undefined,
                paymentId: undefined,
                message: `Your event booking for "${request.eventName}" has been confirmed!`,
                type: 'booking_confirmed',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return {
            success: true,
            message: `Booking confirmed successfully and event ${eventId} created!`,
            data: request,
            eventId,
        };
    }
    /**
     * Generic status updater (backward compatibility)
     */
    updateStatus(requestId, dto, role, userId) {
        if (dto.status === 'confirmed' || dto.status === 'approved') {
            return this.confirmBooking(requestId, { agreementConfirmed: true, depositConfirmed: true }, role, userId);
        }
        if (dto.status === 'rejected') {
            return this.rejectRequest(requestId, { reason: 'Declined by organizer' }, role, userId);
        }
        if (dto.status === 'under_review') {
            return this.startReview(requestId, role, userId);
        }
        if (dto.status === 'cancelled' || dto.status === 'withdrawn') {
            return this.clientResponse(requestId, { decision: 'withdraw' }, role, userId);
        }
        const request = this.findOne(requestId, role, userId);
        request.status = dto.status;
        request.updatedAt = new Date();
        return { success: true, message: `Request status updated to ${dto.status}`, data: request };
    }
};
exports.EventRequestsService = EventRequestsService;
exports.EventRequestsService = EventRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventRequestsService);
//# sourceMappingURL=event-requests.service.js.map