import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataStore, Registration } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateRegistrationDto, UpdateRegistrationDetailsDto } from './dto/registration.dto';
import { QrCodeService } from '../../common/utils/qr-code.service';

@Injectable()
export class RegistrationsService {
  private db = DataStore.getInstance();

  private attendeeForUser(userId?: string) { return this.db.attendees.find(a => a.userId === userId); }
  private activeReservation(r: Registration) { return r.status !== 'pending_payment' || !r.reservationExpiresAt || r.reservationExpiresAt > new Date(); }
  private occupied(eventId: string) {
    return this.db.registrations.filter(r => r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.activeReservation(r)).length;
  }
  private assertOwner(registration: Registration, role: UserRole, userId?: string) {
    if (role === UserRole.SUPER_ADMIN) return;
    const attendee = this.attendeeForUser(userId);
    if (role !== UserRole.ATTENDEE || attendee?.attendeeId !== registration.attendeeId) throw new ForbiddenException('You can only access your own registration');
  }
  private async issueTicket(registration: Registration) {
    const verificationId = QrCodeService.generateVerificationId();
    registration.verificationId = verificationId;
    registration.qrCode = await QrCodeService.generateQRCode(verificationId);
    registration.updatedAt = new Date();
  }
  private notify(registration: Registration, message: string, type: string, paymentId?: string) {
    const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
    if (!attendee) return;
    this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: attendee.userId, eventId: registration.eventId, registrationId: registration.registrationId, paymentId, message, type, read: false, dateTime: new Date(), createdAt: new Date() });
  }
  private enrich(registration: Registration) {
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    const attendee = this.db.attendees.find(a => a.attendeeId === registration.attendeeId);
    const attendeeUser = attendee && this.db.users.find(u => u.userId === attendee.userId);
    const payment = this.db.payments.filter(p => p.registrationId === registration.registrationId).sort((a, b) => +b.createdAt - +a.createdAt)[0] || null;
    const refund = this.db.refunds.filter(r => r.registrationId === registration.registrationId).sort((a, b) => +b.requestedAt - +a.requestedAt)[0] || null;
    const attendance = this.db.attendance.find(a => a.attendeeId === registration.attendeeId && a.eventId === registration.eventId);
    const queue = this.db.registrations.filter(r => r.eventId === registration.eventId && r.status === 'waitlisted').sort((a, b) => +a.createdAt - +b.createdAt);
    const waitlistPosition = registration.status === 'waitlisted' ? queue.findIndex(r => r.registrationId === registration.registrationId) + 1 : null;
    return {
      ...registration,
      attendee: attendee && attendeeUser ? {
        attendeeId: attendee.attendeeId,
        userId: attendeeUser.userId,
        name: attendeeUser.name,
        email: attendeeUser.email,
        phoneNo: attendeeUser.phoneNo,
      } : null,
      event,
      payment,
      refund,
      checkInStatus: attendance?.status || 'not_checked_in',
      waitlistPosition,
    };
  }

  async create(dto: CreateRegistrationDto, role: UserRole, userId?: string): Promise<any> {
    if (![UserRole.ATTENDEE, UserRole.SUPER_ADMIN].includes(role)) throw new ForbiddenException('Only attendees can register for events');
    const attendee = role === UserRole.SUPER_ADMIN ? this.db.attendees.find(a => a.attendeeId === dto.attendeeId) : this.attendeeForUser(userId);
    if (!attendee) throw new NotFoundException('Attendee profile not found');
    if (role === UserRole.ATTENDEE && attendee.attendeeId !== dto.attendeeId && attendee.userId !== dto.attendeeId) throw new ForbiddenException('You cannot register another attendee');
    const user = this.db.users.find(u => u.userId === attendee.userId);
    if (!user || user.status !== 'active' || !user.name || !user.email) throw new BadRequestException('An active attendee profile with name and email is required');
    const event = this.db.events.find(e => e.eventId === dto.eventId);
    if (!event) throw new NotFoundException(`Event ${dto.eventId} not found`);
    if (event.status !== 'published') throw new BadRequestException('Event is not open for registration');
    if (new Date(`${event.date}T23:59:59`) < new Date()) throw new BadRequestException('This event has already concluded');
    if (event.registrationDeadline && new Date(`${event.registrationDeadline}T23:59:59`) < new Date()) throw new BadRequestException('The registration deadline has passed');
    this.db.registrations.filter(r => r.attendeeId === attendee.attendeeId && r.eventId === event.eventId && r.status === 'pending_payment' && !this.activeReservation(r)).forEach(r => { r.status = 'cancelled'; r.cancellationReason = 'Payment reservation expired'; r.cancelledAt = new Date(); r.updatedAt = new Date(); });
    const existing = this.db.registrations.find(r => r.attendeeId === attendee.attendeeId && r.eventId === event.eventId && r.status !== 'cancelled');
    if (existing) throw new ConflictException('You already have an active registration for this event');

    const full = this.occupied(event.eventId) >= event.capacity;
    if (full && (!event.waitlistEnabled || !dto.joinWaitlist)) throw new ConflictException(event.waitlistEnabled ? 'Event is full. Join the waitlist instead.' : 'Event is full and the waitlist is closed');
    const status: Registration['status'] = full ? 'waitlisted' : event.ticketPrice > 0 ? 'pending_payment' : 'registered';
    const now = new Date();
    const registration: Registration = { registrationId: this.db.generateId('reg'), attendeeId: attendee.attendeeId, eventId: event.eventId, registrationDate: now.toISOString().slice(0, 10), status, additionalInfo: dto.additionalInfo, ticketType: dto.ticketType, reservationExpiresAt: status === 'pending_payment' ? new Date(now.getTime() + 15 * 60 * 1000) : undefined, createdAt: now, updatedAt: now };
    // Insert the reservation before asynchronous ticket generation so concurrent requests see occupied capacity.
    registration.ticketPriceAtBooking = event.ticketPrice;
    this.db.registrations.push(registration);
    if (status === 'registered') {
      try { await this.issueTicket(registration); }
      catch { this.db.registrations = this.db.registrations.filter(r => r.registrationId !== registration.registrationId); throw new BadRequestException('Ticket generation failed; registration was rolled back'); }
    }
    this.notify(registration, status === 'registered' ? `Registration confirmed for "${event.name}".` : status === 'waitlisted' ? `You joined the waitlist for "${event.name}".` : `Registration for "${event.name}" is pending payment.`, status === 'registered' ? 'registration_confirmed' : status);
    return { success: true, message: status === 'registered' ? 'Registration confirmed' : status === 'waitlisted' ? 'Waitlist joined' : 'Registration pending payment', data: this.enrich(registration) };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let registrations = [...this.db.registrations];
    if (role === UserRole.ATTENDEE) { const attendee = this.attendeeForUser(userId); registrations = attendee ? registrations.filter(r => r.attendeeId === attendee.attendeeId) : []; }
    else if (role === UserRole.EVENT_ORGANIZER) { const organizer = this.db.organizers.find(o => o.userId === userId); const ids = this.db.events.filter(e => e.organizerId === organizer?.organizerId).map(e => e.eventId); registrations = registrations.filter(r => ids.includes(r.eventId)); }
    else if (role === UserRole.CLIENT) { const client = this.db.clients.find(c => c.userId === userId); const ids = this.db.events.filter(e => e.clientId === client?.clientId).map(e => e.eventId); registrations = registrations.filter(r => ids.includes(r.eventId)); }
    else if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Access denied');
    return registrations.map(r => this.enrich(r));
  }

  findOne(id: string, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId); return this.enrich(registration);
  }

  updateDetails(id: string, dto: UpdateRegistrationDetailsDto, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (['cancelled', 'attended', 'no-show'].includes(registration.status)) throw new BadRequestException('Historical registrations cannot be changed');
    registration.additionalInfo = dto.additionalInfo; registration.updatedAt = new Date();
    return { success: true, message: 'Registration details updated', data: this.enrich(registration) };
  }

  async confirmWaitlist(id: string, role: UserRole, userId?: string): Promise<any> {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (registration.status !== 'waitlisted' || !registration.offerExpiresAt) throw new BadRequestException('No active waitlist offer exists');
    if (registration.offerExpiresAt < new Date()) { registration.offerExpiresAt = undefined; throw new BadRequestException('The waitlist offer has expired'); }
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event || event.status !== 'published') throw new BadRequestException('Event is no longer open');
    if (this.occupied(event.eventId) >= event.capacity) throw new ConflictException('The offered place is no longer available');
    registration.offerExpiresAt = undefined;
    registration.ticketPriceAtBooking = event.ticketPrice;
    registration.status = event.ticketPrice > 0 ? 'pending_payment' : 'registered';
    registration.reservationExpiresAt = event.ticketPrice > 0 ? new Date(Date.now() + 15 * 60 * 1000) : undefined;
    if (!event.ticketPrice) await this.issueTicket(registration);
    this.notify(registration, event.ticketPrice > 0 ? `Your place for "${event.name}" is reserved pending payment.` : `Your waitlist place for "${event.name}" is confirmed.`, event.ticketPrice > 0 ? 'pending_payment' : 'registration_confirmed');
    return { success: true, message: 'Waitlist offer accepted', data: this.enrich(registration) };
  }

  cancel(id: string, reason: string, role: UserRole, userId?: string): any {
    const registration = this.db.registrations.find(r => r.registrationId === id);
    if (!registration) throw new NotFoundException(`Registration ${id} not found`);
    this.assertOwner(registration, role, userId);
    if (registration.status === 'cancelled') throw new ConflictException('Registration is already cancelled');
    if (registration.status === 'attended') throw new BadRequestException('A checked-in registration cannot be cancelled');
    const event = this.db.events.find(e => e.eventId === registration.eventId);
    if (!event) throw new NotFoundException('Event not found');
    const priorStatus = registration.status; const now = new Date();
    registration.status = 'cancelled'; registration.cancellationReason = reason; registration.cancelledAt = now; registration.qrCode = undefined; registration.verificationId = undefined; registration.offerExpiresAt = undefined; registration.updatedAt = now;
    const payment = this.db.payments.find(p => p.registrationId === id && p.status === 'completed');
    let refund: any = null;
    if (payment) { const eligible = !event.cancellationDeadline || now <= new Date(`${event.cancellationDeadline}T23:59:59`); refund = { refundId: this.db.generateId('ref'), paymentId: payment.paymentId, registrationId: id, amount: eligible ? payment.amount : 0, status: eligible ? 'pending' : 'not_applicable', reason, requestedAt: now }; this.db.refunds.push(refund); }
    this.notify(registration, refund?.status === 'pending' ? `Registration cancelled. Refund of ₹${refund.amount} is pending.` : `Registration cancelled for "${event.name}".`, refund?.status === 'pending' ? 'refund_pending' : 'registration_cancelled', payment?.paymentId);
    if (['registered', 'pending_payment'].includes(priorStatus)) this.offerNext(event.eventId);
    return { success: true, message: 'Registration cancelled', data: this.enrich(registration) };
  }

  private offerNext(eventId: string) {
    const next = this.db.registrations.filter(r => r.eventId === eventId && r.status === 'waitlisted' && !r.offerExpiresAt).sort((a, b) => +a.createdAt - +b.createdAt)[0];
    if (!next) return;
    next.offerExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); next.updatedAt = new Date();
    const event = this.db.events.find(e => e.eventId === eventId);
    this.notify(next, `A place is available for "${event?.name || eventId}". Accept it within 48 hours.`, 'waitlist_offer');
  }
}
