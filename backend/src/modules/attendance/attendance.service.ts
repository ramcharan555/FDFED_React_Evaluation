import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { VerifyAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  verify(dto: VerifyAttendanceDto, role: UserRole): any {
    if (role !== UserRole.EVENT_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_STAFF can verify attendance');
    }
    if (!dto.qrCode && !dto.verificationId) {
      throw new BadRequestException('Either qrCode or verificationId is required');
    }

    // Find registration by QR or verification ID
    const registration = this.db.registrations.find(
      r => r.eventId === dto.eventId &&
        ((dto.qrCode && r.qrCode === dto.qrCode) || (dto.verificationId && r.verificationId === dto.verificationId)),
    );
    if (!registration) throw new NotFoundException('No registration found for this QR/verification ID');

    // Prevent duplicate check-in
    const existing = this.db.attendance.find(
      a => a.attendeeId === registration.attendeeId && a.eventId === dto.eventId && a.status === 'checked-in',
    );
    if (existing) throw new ConflictException('Attendee already checked in');

    const attendanceId = this.db.generateId('atnd');
    const record = {
      attendanceId,
      attendeeId: registration.attendeeId,
      eventId: dto.eventId,
      staffId: dto.staffId,
      checkInTime: dto.checkInTime,
      status: 'checked-in' as const,
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

  findAll(role: UserRole, eventId?: string, userId?: string): any[] {
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_ORGANIZER && role !== UserRole.EVENT_STAFF && role !== UserRole.ATTENDEE) {
      throw new ForbiddenException('Access denied');
    }
    let records = [...this.db.attendance];
    if (eventId) records = records.filter(a => a.eventId === eventId);
    
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      if (attendee) {
        records = records.filter(a => a.attendeeId === attendee.attendeeId);
      } else {
        records = [];
      }
    }
    
    return records;
  }

  findByEvent(eventId: string): any[] {
    return this.db.attendance.filter(a => a.eventId === eventId);
  }
}
