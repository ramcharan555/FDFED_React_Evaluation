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
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const qr_code_service_1 = require("../../common/utils/qr-code.service");
let RegistrationsService = class RegistrationsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    async create(dto, role) {
        if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only ATTENDEE can register for events');
        }
        const attendeeObj = this.db.attendees.find(a => a.attendeeId === dto.attendeeId);
        if (!attendeeObj)
            throw new common_1.NotFoundException(`Attendee ${dto.attendeeId} not found`);
        const event = this.db.events.find(e => e.eventId === dto.eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event ${dto.eventId} not found`);
        if (event.status !== 'published' && event.status !== 'ongoing' && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Event is not open for registration');
        }
        // Duplicate registration check
        const existing = this.db.registrations.find(r => r.attendeeId === dto.attendeeId && r.eventId === dto.eventId && r.status !== 'cancelled');
        if (existing)
            throw new common_1.ConflictException('You have already registered for this event');
        const regId = this.db.generateId('reg');
        const verificationId = qr_code_service_1.QrCodeService.generateVerificationId();
        // ✅ NEW: Generate real QR code (contains verification ID)
        let qrCode = '';
        try {
            qrCode = await qr_code_service_1.QrCodeService.generateQRCode(verificationId);
        }
        catch (error) {
            console.warn('QR code generation failed, using fallback:', error);
            qrCode = `data:image/svg+xml,<svg></svg>`; // Fallback
        }
        const registration = {
            registrationId: regId,
            attendeeId: dto.attendeeId,
            eventId: dto.eventId,
            registrationDate: new Date().toISOString().split('T')[0],
            status: 'registered',
            additionalInfo: dto.additionalInfo,
            ticketType: dto.ticketType,
            qrCode, // Now contains real QR code image data URL
            verificationId, // Fallback verification ID
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.registrations.push(registration);
        // Notify attendee
        const attendee = this.db.attendees.find(a => a.attendeeId === dto.attendeeId);
        if (attendee) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: attendee.userId,
                eventId: dto.eventId,
                registrationId: regId,
                paymentId: undefined,
                message: `Registration confirmed for "${event.name}". Your verification ID: ${verificationId}`,
                type: 'registration_confirmed',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Registration successful', data: registration };
    }
    findAll(role, userId) {
        let regs = [...this.db.registrations];
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            if (attendee)
                regs = regs.filter(r => r.attendeeId === attendee.attendeeId);
            else
                regs = [];
        }
        else if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (client) {
                const clientEventIds = this.db.events.filter(e => e.clientId === client.clientId).map(e => e.eventId);
                regs = regs.filter(r => clientEventIds.includes(r.eventId));
            }
            else
                regs = [];
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const org = this.db.organizers.find(o => o.userId === userId);
            if (org) {
                const orgEventIds = this.db.events.filter(e => e.organizerId === org.organizerId).map(e => e.eventId);
                regs = regs.filter(r => orgEventIds.includes(r.eventId));
            }
            else
                regs = [];
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return regs;
    }
    findOne(id) {
        // Note: Role-based access control should be added here in production
        const reg = this.db.registrations.find(r => r.registrationId === id);
        if (!reg)
            throw new common_1.NotFoundException(`Registration ${id} not found`);
        return reg;
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map