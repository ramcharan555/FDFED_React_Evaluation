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
let PaymentsService = class PaymentsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    create(dto, role) {
        if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only ATTENDEE can make payments');
        }
        const registration = this.db.registrations.find(r => r.registrationId === dto.registrationId);
        if (!registration)
            throw new common_1.NotFoundException(`Registration ${dto.registrationId} not found`);
        // Prevent double payment
        const existing = this.db.payments.find(p => p.registrationId === dto.registrationId && p.status === 'completed');
        if (existing)
            throw new common_1.ConflictException('Payment already completed for this registration');
        const paymentId = this.db.generateId('pay');
        const payment = {
            paymentId,
            registrationId: dto.registrationId,
            amount: dto.amount,
            status: 'completed',
            paymentDate: dto.paymentDate,
            paymentMethod: dto.paymentMethod,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.payments.push(payment);
        // Update registration status to confirmed
        if (registration.status !== 'cancelled') {
            registration.status = 'registered';
            registration.updatedAt = new Date();
        }
        // Notify attendee
        const event = this.db.events.find(e => e.eventId === registration.eventId);
        const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
        if (attendee) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: attendee.userId,
                eventId: registration.eventId,
                registrationId: dto.registrationId,
                paymentId,
                message: `Payment of ₹${dto.amount} confirmed for "${event?.name || registration.eventId}"`,
                type: 'payment_confirmed',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Payment successful', data: payment };
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
    findOne(id) {
        const payment = this.db.payments.find(p => p.paymentId === id);
        if (!payment)
            throw new common_1.NotFoundException(`Payment ${id} not found`);
        return payment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map