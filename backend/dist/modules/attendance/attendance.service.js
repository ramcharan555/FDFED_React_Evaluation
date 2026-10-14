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
    verify(dto, role) {
        if (role !== constants_1.UserRole.EVENT_STAFF && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_STAFF can verify attendance');
        }
        if (!dto.qrCode && !dto.verificationId) {
            throw new common_1.BadRequestException('Either qrCode or verificationId is required');
        }
        // Find registration by QR or verification ID
        const registration = this.db.registrations.find(r => r.eventId === dto.eventId &&
            ((dto.qrCode && r.qrCode === dto.qrCode) || (dto.verificationId && r.verificationId === dto.verificationId)));
        if (!registration)
            throw new common_1.NotFoundException('No registration found for this QR/verification ID');
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
            checkInTime: dto.checkInTime,
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
        if (eventId)
            records = records.filter(a => a.eventId === eventId);
        if (role === constants_1.UserRole.ATTENDEE) {
            const attendee = this.db.attendees.find(a => a.userId === userId);
            if (attendee) {
                records = records.filter(a => a.attendeeId === attendee.attendeeId);
            }
            else {
                records = [];
            }
        }
        return records;
    }
    findByEvent(eventId) {
        return this.db.attendance.filter(a => a.eventId === eventId);
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map