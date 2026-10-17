import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DataStore, Event, EventCancellation } from '../../common/data-store';
import { CancelClientEventDto, CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
import { assertEventPolicyAccepted, getEventPolicy } from '../../common/event-policy';

@Injectable()
export class EventsService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  private isActiveReservation(registration: DataStore['registrations'][number]): boolean {
    return registration.status !== 'pending_payment' || !registration.reservationExpiresAt || registration.reservationExpiresAt > new Date();
  }

  // Create Event - Organizer or Super Admin
  create(createEventDto: CreateEventDto, role: UserRole, organizerId?: string): any {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_ORGANIZER].includes(role)) {
      throw new ForbiddenException('Only organizers and super admin can create events');
    }

    const name = (createEventDto as any).title || createEventDto.name;
    if (!name || !createEventDto.date || !createEventDto.time) {
      throw new BadRequestException('Event name, date, and time are required');
    }

    const organizer = this.dataStore.organizers.find(o => o.userId === organizerId);

    const eventId = this.dataStore.generateId('evt');
    const event: Event = {
      eventId,
      organizerId: organizer ? organizer.organizerId : (createEventDto.organizerId || 'org-001'),
      clientId: createEventDto.clientId,
      name,
      category: createEventDto.category || 'General',
      date: createEventDto.date,
      time: createEventDto.time,
      location: createEventDto.location || '',
      capacity: createEventDto.capacity || 100,
      ticketPrice: (createEventDto as any).price ?? createEventDto.ticketPrice ?? 0,
      status: (createEventDto as any).status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (event as any).description = (createEventDto as any).description || '';
    (event as any).city = (createEventDto as any).city || '';
    event.registrationDeadline = createEventDto.registrationDeadline;
    event.cancellationDeadline = createEventDto.cancellationDeadline;
    event.eligibility = createEventDto.eligibility;
    event.waitlistEnabled = createEventDto.waitlistEnabled ?? false;

    this.dataStore.events.push(event);
    return this.mapEventToFrontend(event);
  }

  // ─── Normalize backend event to include frontend-friendly aliases ───────────
  private mapEventToFrontend(event: Event): any {
    // Extract city from location (e.g., "Convention Center, New York" → "New York")
    const locationParts = event.location.split(',');
    const city = (event as any).city ||
      (locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : event.location);

    // Count registrations for this event
    const registered = this.dataStore.registrations.filter(
      r => r.eventId === event.eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r),
    ).length;

    return {
      ...event,
      // Frontend-compatible aliases
      id: event.eventId,
      organizerUserId: this.dataStore.organizers.find(organizer => organizer.organizerId === event.organizerId)?.userId,
      clientUserId: event.clientId
        ? this.dataStore.clients.find(client => client.clientId === event.clientId)?.userId
        : undefined,
      title: event.name,
      price: event.ticketPrice,
      city,
      registered,
      remainingCapacity: Math.max(0, event.capacity - registered),
      registrationDeadline: event.registrationDeadline || event.date,
      cancellationDeadline: event.cancellationDeadline || event.date,
      eligibility: event.eligibility || 'Open to all active attendees',
      waitlistEnabled: event.waitlistEnabled ?? false,
      changes: this.dataStore.eventChanges.filter(c => c.eventId === event.eventId),
      description: (event as any).description || '',
    };
  }

  // Get all events - filtered based on role
  findAll(role: UserRole, search?: string, status?: string): any[] {
    let events = [...this.dataStore.events];

    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (status) {
      events = events.filter((e) => e.status === status);
    }

    if (role === UserRole.ATTENDEE) {
      events = events.filter((e) => e.status === 'published' && new Date(`${e.date}T23:59:59`) >= new Date());
    }

    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get all published events without role restriction (public endpoint)
  findAllPublic(search?: string): any[] {
    let events = this.dataStore.events.filter(e => e.status === 'published');

    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get all events (no role filter — for super_admin dashboard)
  findAllAdmin(role: UserRole, search?: string, status?: string): any[] {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only super admin can access the complete event catalog');
    let events = [...this.dataStore.events];
    if (search) {
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (status) {
      events = events.filter((e) => e.status === status);
    }
    return events.map(e => this.mapEventToFrontend(e));
  }

  // Get event by ID
  findOne(eventId: string, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find((e) => e.eventId === eventId);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (role === UserRole.ATTENDEE && (event.status !== 'published' || new Date(`${event.date}T23:59:59`) < new Date())) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) throw new ForbiddenException('You can only access your own events');
    }

    return this.mapEventToFrontend(event);
  }

  // Update event - only by organizer who created it or super admin
  update(eventId: string, updateEventDto: UpdateEventDto, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) {
        throw new ForbiddenException('You can only update your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can update events');
    }
    if (event.cancellation) {
      throw new BadRequestException('A client-cancelled event cannot be edited. Its cancellation and refund record must be preserved.');
    }

    const before = { date: event.date, time: event.time, location: event.location, status: event.status };
    if (event.clientId && updateEventDto.status === 'completed') {
      throw new BadRequestException('Client events must be completed through the payment-verified completion workflow');
    }
    const occupied = this.dataStore.registrations.filter(r =>
      r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r),
    ).length;
    if ((updateEventDto as any).capacity !== undefined && (updateEventDto as any).capacity < occupied) throw new BadRequestException(`Capacity cannot be lower than ${occupied} active registrations`);
    // Support both backend (name) and frontend (title) field names
    const dto = updateEventDto as any;
    if (dto.name || dto.title) event.name = dto.name || dto.title;
    if (dto.category) event.category = dto.category;
    if (dto.date) event.date = dto.date;
    if (dto.time) event.time = dto.time;
    if (dto.location) event.location = dto.location;
    if (dto.capacity) event.capacity = dto.capacity;
    if (dto.ticketPrice !== undefined) event.ticketPrice = dto.ticketPrice;
    if (dto.price !== undefined) event.ticketPrice = dto.price;
    if (dto.status) event.status = dto.status;
    if (dto.description !== undefined) (event as any).description = dto.description;
    if (dto.city) (event as any).city = dto.city;
    if (dto.registrationDeadline !== undefined) event.registrationDeadline = dto.registrationDeadline;
    if (dto.cancellationDeadline !== undefined) event.cancellationDeadline = dto.cancellationDeadline;
    if (dto.eligibility !== undefined) event.eligibility = dto.eligibility;
    if (dto.waitlistEnabled !== undefined) event.waitlistEnabled = dto.waitlistEnabled;

    event.updatedAt = new Date();
    const changes: Array<{ type: 'cancelled' | 'postponed' | 'time_changed' | 'venue_changed'; summary: string; previousValue?: string; newValue?: string }> = [];
    if (before.date !== event.date) changes.push({ type: new Date(event.date) > new Date(before.date) ? 'postponed' : 'time_changed', summary: `Event date changed from ${before.date} to ${event.date}`, previousValue: before.date, newValue: event.date });
    if (before.time !== event.time) changes.push({ type: 'time_changed', summary: `Event time changed from ${before.time} to ${event.time}`, previousValue: before.time, newValue: event.time });
    if (before.location !== event.location) changes.push({ type: 'venue_changed', summary: `Event venue changed from ${before.location} to ${event.location}`, previousValue: before.location, newValue: event.location });
    if (before.status !== 'cancelled' && event.status === 'cancelled') changes.push({ type: 'cancelled', summary: 'Event cancelled by the organizer' });
    for (const change of changes) {
      this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, ...change, createdAt: new Date() });
      const affected = this.dataStore.registrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
      for (const registration of affected) {
        const attendee = this.dataStore.attendees.find(a => a.attendeeId === registration.attendeeId);
        if (change.type === 'cancelled') {
          registration.status = 'cancelled'; registration.cancelledAt = new Date(); registration.cancellationReason = 'Event cancelled by organizer'; registration.qrCode = undefined; registration.verificationId = undefined; registration.updatedAt = new Date();
          const payment = this.dataStore.payments.find(p => p.registrationId === registration.registrationId && p.status === 'completed');
          if (payment && !this.dataStore.refunds.some(r => r.registrationId === registration.registrationId)) {
            const refund = { refundId: this.dataStore.generateId('ref'), paymentId: payment.paymentId, registrationId: registration.registrationId, amount: payment.amount, status: 'pending' as const, reason: 'Event cancelled by organizer', requestedAt: new Date() };
            this.dataStore.refunds.push(refund);
            if (attendee) this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, paymentId: payment.paymentId, message: `Event cancelled. Simulated refund of ₹${refund.amount} is pending.`, type: 'refund_pending', read: false, dateTime: new Date(), createdAt: new Date() });
          }
        }
        if (attendee) this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, message: `${event.name}: ${change.summary}`, type: change.type === 'cancelled' ? 'event_cancelled' : 'event_changed', read: false, dateTime: new Date(), createdAt: new Date() });
      }
    }
    return this.mapEventToFrontend(event);
  }

  private ownClientEvent(eventId: string, role: UserRole, userId?: string): Event {
    if (role !== UserRole.CLIENT) throw new ForbiddenException('Only the event client can cancel this event');
    const event = this.dataStore.events.find(item => item.eventId === eventId);
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);
    const client = this.dataStore.clients.find(item => item.userId === userId);
    if (!client || event.clientId !== client.clientId) throw new ForbiddenException('You can only cancel your own events');
    return event;
  }

  clientCancellationPreview(eventId: string, role: UserRole, userId?: string) {
    const event = this.ownClientEvent(eventId, role, userId);
    const request = this.dataStore.eventRequests.find(item => item.eventId === eventId);
    const policy = event.policySnapshot || request?.policySnapshot || getEventPolicy();
    const payment = this.dataStore.eventWorkflowPayments.find(item => item.eventId === eventId && item.status === 'completed');
    const paidPaise = Math.round((payment?.amount || 0) * 100);
    const feePaise = Math.round(paidPaise * policy.cancellation.feePercent / 100);
    const match = String(event.time || '10:00').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    let hours = match ? Number(match[1]) : NaN;
    if (match?.[3]) hours = hours % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    const time = match && hours >= 0 && hours <= 23 && Number(match[2]) <= 59
      ? `${String(hours).padStart(2, '0')}:${match[2]}:00` : '';
    const start = time ? new Date(`${event.date}T${time}+05:30`) : new Date(NaN);
    const deadline = new Date(start.getTime() - policy.cancellation.minimumNoticeDays * 86400000);
    const validDate = !Number.isNaN(deadline.getTime());
    const canCancel = event.status === 'ongoing' && validDate && new Date() <= deadline;
    const unavailableReason = event.status !== 'ongoing'
      ? 'Only an ongoing event can be cancelled.'
      : !validDate ? 'The scheduled event date or time is unavailable.'
      : `Cancellation closes ${policy.cancellation.minimumNoticeDays} days before the scheduled event start.`;
    return {
      eventId, canCancel, unavailableReason: canCancel ? '' : unavailableReason,
      cancellationDeadline: validDate ? deadline.toISOString() : null,
      minimumNoticeDays: policy.cancellation.minimumNoticeDays,
      paidAmount: paidPaise / 100, cancellationFeePercent: policy.cancellation.feePercent,
      cancellationFee: feePaise / 100, refundAmount: (paidPaise - feePaise) / 100,
      policy, paymentId: payment?.paymentId,
    };
  }

  cancelClientEvent(eventId: string, dto: CancelClientEventDto, role: UserRole, userId?: string): any {
    const event = this.ownClientEvent(eventId, role, userId);
    if (event.status === 'cancelled') throw new ConflictException('This event has already been cancelled');
    const preview = this.clientCancellationPreview(eventId, role, userId);
    if (!preview.canCancel) throw new BadRequestException(preview.unavailableReason);
    assertEventPolicyAccepted(dto, preview.policy);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    if (reason.length < 10 || reason.length > 1000) throw new BadRequestException('Provide a cancellation reason of 10 to 1000 characters');
    if (dto.expectedPaidAmount !== preview.paidAmount) {
      throw new ConflictException('The amount paid has changed. Review the updated cancellation fee and refund amount before confirming.');
    }

    const now = new Date();
    const request = this.dataStore.eventRequests.find(item => item.eventId === eventId);
    const refundId = preview.refundAmount > 0 ? this.dataStore.generateId('ref-event') : undefined;
    const cancellation: EventCancellation = {
      reason, cancelledBy: userId!, cancelledAt: now, policyVersion: preview.policy.version,
      paidAmount: preview.paidAmount, cancellationFeePercent: preview.cancellationFeePercent,
      cancellationFee: preview.cancellationFee, refundAmount: preview.refundAmount,
      refundStatus: refundId ? 'pending' : 'not_applicable', refundId,
      cancellationDeadline: preview.cancellationDeadline!,
    };
    if (refundId && preview.paymentId) {
      this.dataStore.eventWorkflowRefunds.push({
        refundId, paymentId: preview.paymentId, eventId, requestId: request?.requestId,
        clientId: event.clientId!, organizerId: event.organizerId,
        paidAmount: preview.paidAmount, cancellationFee: preview.cancellationFee,
        amount: preview.refundAmount, reason, status: 'pending', requestedAt: now,
      });
    }
    event.status = 'cancelled';
    event.cancellation = cancellation;
    event.updatedAt = now;
    if (request) {
      request.status = 'cancelled';
      request.cancellation = cancellation;
      request.updatedAt = now;
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({ id: this.dataStore.generateId('aud'), action: 'Event Cancelled by Client', performedBy: userId!, role, timestamp: now, details: { ...cancellation } });
    }
    this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, type: 'cancelled', summary: `Event cancelled by client: ${reason}`, createdAt: now });
    const notify = (recipient: string, message: string, registrationId?: string, paymentId?: string) => {
      this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: recipient, eventId, registrationId, paymentId, message, type: 'event_cancelled', read: false, dateTime: now, createdAt: now });
    };
    const organizer = this.dataStore.organizers.find(item => item.organizerId === event.organizerId);
    if (organizer) notify(organizer.userId, `The client cancelled "${event.name}": ${reason}`);
    notify(userId!, `You cancelled "${event.name}". Cancellation fee: ₹${cancellation.cancellationFee.toFixed(2)}. Refund due: ₹${cancellation.refundAmount.toFixed(2)}${refundId ? ' (pending review)' : ''}.`);
    for (const assignment of this.dataStore.staffAssignments.filter(item => item.eventId === eventId && ['pending', 'accepted'].includes(item.status))) {
      assignment.status = 'cancelled';
      assignment.updatedAt = now;
      const staff = this.dataStore.staffProfiles.find(item => item.staffId === assignment.staffId);
      if (staff) notify(staff.userId, `Your assignment for "${event.name}" was cancelled because the client cancelled the event.`);
    }
    for (const registration of this.dataStore.registrations.filter(item => item.eventId === eventId && ['registered', 'pending_payment', 'waitlisted'].includes(item.status))) {
      registration.status = 'cancelled';
      registration.cancellationReason = `Event cancelled by client: ${reason}`;
      registration.cancelledAt = now;
      registration.updatedAt = now;
      registration.qrCode = undefined;
      registration.verificationId = undefined;
      registration.offerExpiresAt = undefined;
      const payment = this.dataStore.payments.find(item => item.registrationId === registration.registrationId && item.status === 'completed');
      const attendee = this.dataStore.attendees.find(item => item.attendeeId === registration.attendeeId);
      if (payment && !this.dataStore.refunds.some(item => item.registrationId === registration.registrationId)) {
        this.dataStore.refunds.push({ refundId: this.dataStore.generateId('ref'), paymentId: payment.paymentId, registrationId: registration.registrationId, amount: payment.amount, status: 'pending', reason: 'Event cancelled by client', requestedAt: now });
      }
      if (attendee) notify(attendee.userId, `"${event.name}" was cancelled by the client. Your ticket is invalid.${payment ? ' Your ticket refund is pending review.' : ''}`, registration.registrationId, payment?.paymentId);
    }
    return { success: true, message: 'Event cancelled. Any refund due is pending review.', data: { event: this.mapEventToFrontend(event), cancellation } };
  }

  completeClientEvent(eventId: string, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_ORGANIZER) {
      throw new ForbiddenException('Only the assigned organizer can complete this event');
    }
    const event = this.dataStore.events.find(item => item.eventId === eventId);
    if (!event || !event.clientId) throw new NotFoundException(`Client event ${eventId} not found`);
    const organizer = this.dataStore.organizers.find(item => item.userId === userId);
    if (!organizer || organizer.organizerId !== event.organizerId) {
      throw new ForbiddenException('You can only complete your own events');
    }
    if (event.status !== 'ongoing') {
      throw new BadRequestException('Only ongoing events can be marked completed');
    }
    const eventDateEnd = new Date(`${event.date}T23:59:59`);
    if (Number.isNaN(eventDateEnd.getTime()) || eventDateEnd > new Date()) {
      throw new BadRequestException('The event can only be completed after its event date');
    }
    const request = this.dataStore.eventRequests.find(item =>
      item.eventId === eventId && item.organizerId === organizer.organizerId,
    );
    const verifiedPayment = this.dataStore.eventWorkflowPayments.find(payment =>
      payment.eventId === eventId &&
      payment.requestId === request?.requestId &&
      payment.status === 'completed' &&
      payment.amount === request?.budget,
    );
    if (!request || request.status !== 'confirmed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment) {
      throw new BadRequestException('Verified full payment is required before completing the event');
    }
    event.status = 'completed';
    event.updatedAt = new Date();
    request.status = 'completed';
    request.updatedAt = event.updatedAt;
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.dataStore.generateId('aud'),
      action: 'Event Marked Completed',
      performedBy: userId || organizer.organizerId,
      role,
      timestamp: event.updatedAt,
      details: { eventId },
    });
    const client = this.dataStore.clients.find(item => item.clientId === request.clientId);
    if (client) {
      this.dataStore.notifications.push({
        notificationId: this.dataStore.generateId('notif'),
        userId: client.userId,
        eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `The organizer marked "${event.name}" as completed.`,
        type: 'event_completed',
        read: false,
        dateTime: event.updatedAt,
        createdAt: event.updatedAt,
      });
    }
    return { success: true, message: 'Event marked completed', data: this.mapEventToFrontend(event) };
  }

  // Delete event
  delete(eventId: string, role: UserRole, userId?: string): { message: string } {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) {
        throw new ForbiddenException('You can only delete your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can delete events');
    }
    if (event.cancellation) {
      throw new BadRequestException('A client-cancelled event cannot be deleted. Its cancellation and refund record must be preserved.');
    }

    const index = this.dataStore.events.findIndex((e) => e.eventId === eventId);
    this.dataStore.events.splice(index, 1);

    return { message: `Event ${eventId} deleted successfully` };
  }

  // Publish event
  publish(eventId: string, role: UserRole, userId?: string): any {
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException(`Event with ID ${eventId} not found`);

    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || organizer.organizerId !== event.organizerId) {
        throw new ForbiddenException('You can only publish your own events');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers and super admin can publish events');
    }
    if (event.cancellation) {
      throw new BadRequestException('A client-cancelled event cannot be published again.');
    }

    event.status = 'published';
    event.updatedAt = new Date();
    return this.mapEventToFrontend(event);
  }

  // Get event statistics
  getStatistics(): any {
    const events = this.dataStore.events;
    const totalRegistrations = this.dataStore.registrations.length;
    const totalRevenue = this.dataStore.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === 'published').length,
      ongoingEvents: events.filter((e) => e.status === 'ongoing').length,
      completedEvents: events.filter((e) => e.status === 'completed').length,
      totalRegistrations,
      totalRevenue,
    };
  }
}
