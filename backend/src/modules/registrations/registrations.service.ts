import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateRegistrationDto } from './dto/registration.dto';
import { QrCodeService } from '../../common/utils/qr-code.service';

@Injectable()
export class RegistrationsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  async create(dto: CreateRegistrationDto, role: UserRole): Promise<any> {
    if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE can register for events');
    }

    const attendeeObj = this.db.attendees.find(a => a.attendeeId === dto.attendeeId);
    if (!attendeeObj) throw new NotFoundException(`Attendee ${dto.attendeeId} not found`);

    const event = this.db.events.find(e => e.eventId === dto.eventId);
    if (!event) throw new NotFoundException(`Event ${dto.eventId} not found`);
    if (event.status !== 'published' && event.status !== 'ongoing' && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Event is not open for registration');
    }

    // Duplicate registration check
    const existing = this.db.registrations.find(
      r => r.attendeeId === dto.attendeeId && r.eventId === dto.eventId && r.status !== 'cancelled',
    );
    if (existing) throw new ConflictException('You have already registered for this event');

    const regId = this.db.generateId('reg');
    const verificationId = QrCodeService.generateVerificationId();
    
    // ✅ NEW: Generate real QR code (contains verification ID)
    let qrCode = '';
    try {
      qrCode = await QrCodeService.generateQRCode(verificationId);
    } catch (error) {
      console.warn('QR code generation failed, using fallback:', error);
      qrCode = `data:image/svg+xml,<svg></svg>`; // Fallback
    }

    const registration = {
      registrationId: regId,
      attendeeId: dto.attendeeId,
      eventId: dto.eventId,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'registered' as const,
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

  findAll(role: UserRole, userId?: string): any[] {
    let regs = [...this.db.registrations];
    if (role === UserRole.ATTENDEE) {
      const attendee = this.db.attendees.find(a => a.userId === userId);
      if (attendee) regs = regs.filter(r => r.attendeeId === attendee.attendeeId);
      else regs = [];
    } else if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (client) {
        const clientEventIds = this.db.events.filter(e => (e as any).clientId === client.clientId).map(e => e.eventId);
        regs = regs.filter(r => clientEventIds.includes(r.eventId));
      } else regs = [];
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const org = this.db.organizers.find(o => o.userId === userId);
      if (org) {
        const orgEventIds = this.db.events.filter(e => (e as any).organizerId === org.organizerId).map(e => e.eventId);
        regs = regs.filter(r => orgEventIds.includes(r.eventId));
      } else regs = [];
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return regs;
  }

  findOne(id: string): any {
    // Note: Role-based access control should be added here in production
    const reg = this.db.registrations.find(r => r.registrationId === id);
    if (!reg) throw new NotFoundException(`Registration ${id} not found`);
    return reg;
  }
}
