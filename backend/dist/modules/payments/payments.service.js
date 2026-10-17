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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const qr_code_service_1 = require("../../common/utils/qr-code.service");
let PaymentsService = class PaymentsService {
    constructor() {
        this.processingRegistrations = new Set();
        this.db = data_store_1.DataStore.getInstance();
    }
    async create(dto, role, userId) {
        if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only ATTENDEE can make payments');
        }
        const registration = this.db.registrations.find(r => r.registrationId === dto.registrationId);
        if (!registration)
            throw new common_1.NotFoundException(`Registration ${dto.registrationId} not found`);
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            if (!attendee || attendee.attendeeId !== registration.attendeeId)
                throw new common_1.ForbiddenException('You can only pay for your own registration');
        }
        if (registration.status !== 'pending_payment')
            throw new common_1.ConflictException('Registration is not awaiting payment');
        if (this.processingRegistrations.has(registration.registrationId))
            throw new common_1.ConflictException('Payment is already being processed');
        if (registration.reservationExpiresAt && registration.reservationExpiresAt < new Date()) {
            registration.status = 'cancelled';
            registration.cancellationReason = 'Payment reservation expired';
            registration.cancelledAt = new Date();
            registration.updatedAt = new Date();
            throw new common_1.ConflictException('Payment reservation expired; register again');
        }
        const event = this.db.events.find(e => e.eventId === registration.eventId);
        if (!event || event.status !== 'published')
            throw new common_1.ConflictException('Event is no longer open');
        if (dto.amount !== event.ticketPrice)
            throw new common_1.ConflictException('Payment amount does not match the ticket price');
        // Prevent double payment
        const existing = this.db.payments.find(p => p.registrationId === dto.registrationId && p.status === 'completed');
        if (existing)
            throw new common_1.ConflictException('Payment already completed for this registration');
        if (dto.paymentMethod !== 'DEMO_PROVIDER')
            throw new common_1.BadRequestException('Only the simulated demo payment provider is configured');
        this.processingRegistrations.add(registration.registrationId);
        try {
            const verificationId = qr_code_service_1.QrCodeService.generateVerificationId();
            const qrCode = await qr_code_service_1.QrCodeService.generateQRCode(verificationId);
            if (registration.status !== 'pending_payment')
                throw new common_1.ConflictException('Registration is no longer awaiting payment');
            const paymentId = this.db.generateId('pay');
            const now = new Date();
            const payment = {
                paymentId,
                registrationId: dto.registrationId,
                amount: dto.amount,
                status: 'completed',
                paymentDate: dto.paymentDate,
                paymentMethod: 'DEMO_PROVIDER',
                createdAt: now,
                updatedAt: now,
            };
            this.db.payments.push(payment);
            registration.status = 'registered';
            registration.reservationExpiresAt = undefined;
            registration.verificationId = verificationId;
            registration.qrCode = qrCode;
            registration.updatedAt = now;
            const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
            if (attendee) {
                this.db.notifications.push({
                    notificationId: this.db.generateId('notif'),
                    userId: attendee.userId,
                    eventId: registration.eventId,
                    registrationId: dto.registrationId,
                    paymentId,
                    message: `Simulated payment of ₹${dto.amount} confirmed for "${event.name}"`,
                    type: 'payment_confirmed',
                    read: false,
                    dateTime: now,
                    createdAt: now,
                });
            }
            return { success: true, simulated: true, message: 'Demo payment successful', data: { ...payment, simulated: true, registration } };
        }
        finally {
            this.processingRegistrations.delete(registration.registrationId);
        }
    }
    payForOngoingEvent(eventId, paymentMethod, role, userId) {
        if (role !== constants_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only the event client can pay for this event');
        }
        if (paymentMethod !== 'DEMO_PROVIDER') {
            throw new common_1.BadRequestException('Only the simulated demo payment provider is configured');
        }
        const event = this.db.events.find(item => item.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event ${eventId} not found`);
        const client = this.db.clients.find(item => item.userId === userId);
        if (!client || event.clientId !== client.clientId) {
            throw new common_1.ForbiddenException('You can only pay for your own events');
        }
        if (event.status !== 'ongoing') {
            throw new common_1.ConflictException('Only an ongoing approved event can be paid for');
        }
        const request = this.db.eventRequests.find(item => item.eventId === eventId && item.clientId === client.clientId);
        if (!request || request.status !== 'confirmed') {
            throw new common_1.ConflictException('The event does not have an approved event plan');
        }
        if (this.db.eventWorkflowPayments.some(payment => payment.eventId === eventId && payment.status === 'completed')) {
            throw new common_1.ConflictException('This event has already been paid in full');
        }
        const approvedPlan = this.db.eventPlans.find(plan => plan.eventPlanId === request.activeEventPlanId && plan.approvalStatus === 'approved');
        if (!approvedPlan || Number(approvedPlan.budget) <= 0 || Number(approvedPlan.budget) !== Number(request.budget)) {
            throw new common_1.ConflictException('The final agreed event budget is unavailable');
        }
        const now = new Date();
        const payment = {
            paymentId: this.db.generateId('pay-event'),
            eventId,
            requestId: request.requestId,
            clientId: client.clientId,
            organizerId: request.organizerId,
            amount: Number(approvedPlan.budget),
            status: 'completed',
            paymentDate: now.toISOString().slice(0, 10),
            paymentMethod: 'DEMO_PROVIDER',
            createdAt: now,
            updatedAt: now,
        };
        this.db.eventWorkflowPayments.push(payment);
        request.paymentStatus = 'fully_paid';
        request.updatedAt = now;
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: 'Full Event Payment Verified',
            performedBy: userId || client.clientId,
            role,
            timestamp: now,
            details: { eventId, paymentId: payment.paymentId, amount: payment.amount },
        });
        const organizer = this.db.organizers.find(item => item.organizerId === request.organizerId);
        if (organizer) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: organizer.userId,
                eventId,
                registrationId: undefined,
                paymentId: payment.paymentId,
                message: `Full payment of ₹${payment.amount.toLocaleString()} has been verified for "${event.name}".`,
                type: 'event_payment_confirmed',
                read: false,
                dateTime: now,
                createdAt: now,
            });
        }
        this.db.notifications.push({
            notificationId: this.db.generateId('notif'),
            userId: client.userId,
            eventId,
            registrationId: undefined,
            paymentId: payment.paymentId,
            message: `Your full payment of ₹${payment.amount.toLocaleString()} for "${event.name}" is confirmed.`,
            type: 'event_payment_confirmed',
            read: false,
            dateTime: now,
            createdAt: now,
        });
        return { success: true, message: 'Full event payment verified', data: payment };
    }
    processRefund(refundId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can process refunds');
        const refund = this.db.refunds.find(item => item.refundId === refundId);
        if (!refund)
            throw new common_1.NotFoundException(`Refund ${refundId} not found`);
        if (refund.status !== 'pending')
            throw new common_1.ConflictException('Refund is not pending');
        const payment = this.db.payments.find(item => item.paymentId === refund.paymentId);
        if (!payment || payment.status !== 'completed' || payment.registrationId !== refund.registrationId)
            throw new common_1.ConflictException('Completed payment not found for refund');
        if (!Number.isSafeInteger(refund.amount) || refund.amount <= 0 || refund.amount > payment.amount)
            throw new common_1.BadRequestException('Invalid refund amount');
        if (this.db.refunds.some(item => item.refundId !== refundId && item.paymentId === payment.paymentId && item.status === 'completed'))
            throw new common_1.ConflictException('Payment has already been refunded');
        const registration = this.db.registrations.find(item => item.registrationId === refund.registrationId);
        const attendee = registration && this.db.attendees.find(item => item.attendeeId === registration.attendeeId);
        const now = new Date();
        refund.status = 'completed';
        refund.processedAt = now;
        payment.status = 'refunded';
        payment.updatedAt = now;
        if (attendee) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: attendee.userId,
                eventId: registration?.eventId,
                registrationId: refund.registrationId,
                paymentId: payment.paymentId,
                message: `Demo refund of ₹${refund.amount} completed.`,
                type: 'refund_completed',
                read: false,
                dateTime: now,
                createdAt: now,
            });
        }
        return { success: true, simulated: true, data: refund };
    }
    findAll(role, userId) {
        let payments = [...this.db.payments];
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            if (attendee) {
                const regIds = this.db.registrations.filter(r => r.attendeeId === attendee.attendeeId).map(r => r.registrationId);
                payments = payments.filter(p => regIds.includes(p.registrationId));
            }
            else
                payments = [];
        }
        else if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (client) {
                const eventIds = this.db.events.filter(e => e.clientId === client.clientId).map(e => e.eventId);
                const regIds = this.db.registrations.filter(r => eventIds.includes(r.eventId)).map(r => r.registrationId);
                payments = payments.filter(p => regIds.includes(p.registrationId));
            }
            else
                payments = [];
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return payments;
    }
    findOne(id, role, userId) {
        const payment = this.db.payments.find(p => p.paymentId === id);
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            const registration = this.db.registrations.find(r => r.registrationId === payment.registrationId);
            if (!attendee || registration?.attendeeId !== attendee.attendeeId)
                throw new common_1.ForbiddenException('You can only view your own payment');
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Access denied');
        return payment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map