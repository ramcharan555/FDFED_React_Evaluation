import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { VerifyAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  verify(dto: VerifyAttendanceDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_STAFF can verify attendance');
    }
    if (!dto.qrCode && !dto.verificationId) {
      throw new BadRequestException('Either qrCode or verificationId is required');
    }
    if (role === UserRole.EVENT_STAFF) {
      const staff = this.db.staffProfiles.find(s => s.userId === userId);
      if (!staff || staff.staffId !== dto.staffId) throw new ForbiddenException('You cannot check in as another staff member');
      const assigned = this.db.staffAssignments.some(a => a.staffId === staff.staffId && a.eventId === dto.eventId && a.status === 'accepted');
      if (!assigned) throw new ForbiddenException('You can only check in attendees for an accepted event assignment');
    }

    // Find registration by QR or verification ID
    const registration = this.db.registrations.find(
      r => r.eventId === dto.eventId &&
        ((dto.qrCode && r.qrCode === dto.qrCode) || (dto.verificationId && r.verificationId === dto.verificationId)),
    );
    if (!registration) throw new NotFoundException('No registration found for this QR/verification ID');
    if (registration.status !== 'registered') throw new BadRequestException('Ticket is cancelled, unpaid, waitlisted, used, or otherwise invalid');
    const event = this.db.events.find(e => e.eventId === dto.eventId);
    if (!event || event.status === 'cancelled') throw new BadRequestException('Event is not valid for check-in');

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
      checkInTime: new Date().toISOString(),
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
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      if (attendee) {
        records = records.filter(a => a.attendeeId === attendee.attendeeId);
      } else {
        records = [];
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      const allowedEventIds = this.db.events.filter(e => e.organizerId === organizer?.organizerId).map(e => e.eventId);
      if (eventId && !allowedEventIds.includes(eventId)) throw new ForbiddenException('You can only view attendance for your own events');
      records = records.filter(a => allowedEventIds.includes(a.eventId));
    } else if (role === UserRole.EVENT_STAFF) {
      const staff = this.db.staffProfiles.find(s => s.userId === userId);
      const allowedEventIds = this.db.staffAssignments.filter(a => a.staffId === staff?.staffId && a.status === 'accepted').map(a => a.eventId);
      if (eventId && !allowedEventIds.includes(eventId)) throw new ForbiddenException('You can only view attendance for accepted event assignments');
      records = records.filter(a => allowedEventIds.includes(a.eventId));
    }
    if (eventId) records = records.filter(a => a.eventId === eventId);
    
    return records;
  }

  findByEvent(eventId: string): any[] {
    return this.db.attendance.filter(a => a.eventId === eventId);
  }

  reconcileNoShows(eventId: string, role: UserRole, userId?: string): any {
    const event = this.db.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException('Event not found');
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId);
      if (organizer?.organizerId !== event.organizerId) throw new ForbiddenException('You can only reconcile your own event');
    } else if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only the organizer or super admin can reconcile attendance');
    if (new Date(`${event.date}T23:59:59`) >= new Date()) throw new BadRequestException('No-shows can only be determined after the event concludes');
    const checkedIn = new Set(this.db.attendance.filter(a => a.eventId === eventId && a.status === 'checked-in').map(a => a.attendeeId));
    const noShows = this.db.registrations.filter(r => r.eventId === eventId && r.status === 'registered' && !checkedIn.has(r.attendeeId));
    noShows.forEach(r => { r.status = 'no-show'; r.updatedAt = new Date(); });
    return { success: true, message: `${noShows.length} no-show registrations recorded`, data: { eventId, noShowCount: noShows.length } };
  }
}
