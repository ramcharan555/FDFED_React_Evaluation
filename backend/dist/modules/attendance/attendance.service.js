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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let AttendanceService = class AttendanceService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    verify(dto, role, userId) {
        if (role !== constants_1.UserRole.EVENT_STAFF && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_STAFF can verify attendance');
        }
        if (!dto.qrCode && !dto.verificationId) {
            throw new common_1.BadRequestException('Either qrCode or verificationId is required');
        }
        if (role === constants_1.UserRole.EVENT_STAFF) {
            const staff = this.db.staffProfiles.find(s => s.userId === userId);
            if (!staff || staff.staffId !== dto.staffId)
                throw new common_1.ForbiddenException('You cannot check in as another staff member');
            const assigned = this.db.staffAssignments.some(a => a.staffId === staff.staffId && a.eventId === dto.eventId && a.status === 'accepted');
            if (!assigned)
                throw new common_1.ForbiddenException('You can only check in attendees for an accepted event assignment');
        }
        // Find registration by QR or verification ID
        const registration = this.db.registrations.find(r => r.eventId === dto.eventId &&
            ((dto.qrCode && r.qrCode === dto.qrCode) || (dto.verificationId && r.verificationId === dto.verificationId)));
        if (!registration)
            throw new common_1.NotFoundException('No registration found for this QR/verification ID');
        if (registration.status !== 'registered')
            throw new common_1.BadRequestException('Ticket is cancelled, unpaid, waitlisted, used, or otherwise invalid');
        const event = this.db.events.find(e => e.eventId === dto.eventId);
        if (!event || event.status === 'cancelled')
            throw new common_1.BadRequestException('Event is not valid for check-in');
        // Prevent duplicate check-in
        const existing = this.db.attendance.find(a => a.attendeeId === registration.attendeeId && a.eventId === dto.eventId && a.status === 'checked-in');
        if (existing)
            throw new common_1.ConflictException('Attendee already checked in');
        const attendanceId = this.db.generateId('atnd');
        const record = {
            attendanceId,
            attendeeId: registration.attendeeId,
            eventId: dto.eventId,
            staffId: dto.staffId,
            checkInTime: new Date().toISOString(),
            status: 'checked-in',
            qrCode: dto.qrCode,
            verificationId: dto.verificationId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.attendance.push(record);
        registration.status = 'attended';
        registration.updatedAt = new Date();
        return { success: true, message: 'Attendee checked in successfully', data: record };
    }
    findAll(role, eventId, userId) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.EVENT_STAFF && role !== constants_1.UserRole.ATTENDEE) {
            throw new common_1.ForbiddenException('Access denied');
        }
        let records = [...this.db.attendance];
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            if (attendee) {
                records = records.filter(a => a.attendeeId === attendee.attendeeId);
            }
            else {
                records = [];
            }
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            const allowedEventIds = this.db.events.filter(e => e.organizerId === organizer?.organizerId).map(e => e.eventId);
            if (eventId && !allowedEventIds.includes(eventId))
                throw new common_1.ForbiddenException('You can only view attendance for your own events');
            records = records.filter(a => allowedEventIds.includes(a.eventId));
        }
        else if (role === constants_1.UserRole.EVENT_STAFF) {
            const staff = this.db.staffProfiles.find(s => s.userId === userId);
            const allowedEventIds = this.db.staffAssignments.filter(a => a.staffId === staff?.staffId && a.status === 'accepted').map(a => a.eventId);
            if (eventId && !allowedEventIds.includes(eventId))
                throw new common_1.ForbiddenException('You can only view attendance for accepted event assignments');
            records = records.filter(a => allowedEventIds.includes(a.eventId));
        }
        if (eventId)
            records = records.filter(a => a.eventId === eventId);
        return records;
    }
    findByEvent(eventId) {
        return this.db.attendance.filter(a => a.eventId === eventId);
    }
    reconcileNoShows(eventId, role, userId) {
        const event = this.db.events.find(e => e.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (organizer?.organizerId !== event.organizerId)
                throw new common_1.ForbiddenException('You can only reconcile your own event');
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only the organizer or super admin can reconcile attendance');
        if (new Date(`${event.date}T23:59:59`) >= new Date())
            throw new common_1.BadRequestException('No-shows can only be determined after the event concludes');
        const checkedIn = new Set(this.db.attendance.filter(a => a.eventId === eventId && a.status === 'checked-in').map(a => a.attendeeId));
        const noShows = this.db.registrations.filter(r => r.eventId === eventId && r.status === 'registered' && !checkedIn.has(r.attendeeId));
        noShows.forEach(r => { r.status = 'no-show'; r.updatedAt = new Date(); });
        return { success: true, message: `${noShows.length} no-show registrations recorded`, data: { eventId, noShowCount: noShows.length } };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map