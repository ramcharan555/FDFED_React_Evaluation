import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataStore, Event } from '../../common/data-store';
import { CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';

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

    const organizer = role === UserRole.EVENT_ORGANIZER ? this.dataStore.organizers.find(o => o.userId === organizerId) : this.dataStore.organizers.find(o => o.organizerId === createEventDto.organizerId);
    if (!organizer) throw new BadRequestException('Select an existing organizer');
    if (createEventDto.clientId && !this.dataStore.clients.some(c => c.clientId === createEventDto.clientId)) throw new BadRequestException('Client not found');
    if (!Number.isInteger(createEventDto.capacity) || createEventDto.capacity < 1 || !Number.isFinite(createEventDto.ticketPrice) || createEventDto.ticketPrice < 0 || Math.abs(createEventDto.ticketPrice * 100 - Math.round(createEventDto.ticketPrice * 100)) > 0.00001 || !Number.isFinite(+new Date(createEventDto.date))) throw new BadRequestException('Valid event date, capacity and price required');

    const eventId = this.dataStore.generateId('evt');
    const event: Event = {
      eventId,
      organizerId: organizer.organizerId,
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

    const before = { date: event.date, time: event.time, location: event.location, status: event.status };
    const occupied = this.dataStore.registrations.filter(r =>
      r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r),
    ).length;
    if ((updateEventDto as any).capacity !== undefined && (updateEventDto as any).capacity < occupied) throw new BadRequestException(`Capacity cannot be lower than ${occupied} active registrations`);
    // Support both backend (name) and frontend (title) field names
    const dto = updateEventDto as any;
    if (dto.capacity !== undefined && (!Number.isInteger(dto.capacity) || dto.capacity < 1)) throw new BadRequestException('Capacity must be a positive integer');
    if (dto.ticketPrice !== undefined && (!Number.isFinite(dto.ticketPrice) || dto.ticketPrice < 0 || Math.abs(dto.ticketPrice * 100 - Math.round(dto.ticketPrice * 100)) > 0.00001)) throw new BadRequestException('Ticket price must be nonnegative with at most two decimal places');
    if (dto.date && !Number.isFinite(+new Date(dto.date))) throw new BadRequestException('Invalid event date');
    if (dto.status && !['draft', 'published', 'ongoing', 'completed', 'cancelled'].includes(dto.status)) throw new BadRequestException('Invalid event status');
    if (dto.status && dto.status !== event.status) {
      const transitions: Record<string, string[]> = { draft: ['published', 'cancelled'], published: ['ongoing', 'completed', 'cancelled'], ongoing: ['completed', 'cancelled'], completed: [], cancelled: [] };
      if (!transitions[event.status]?.includes(dto.status)) throw new BadRequestException('Invalid event status transition');
    }
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

    const index = this.dataStore.events.findIndex((e) => e.eventId === eventId);
    if (this.dataStore.registrations.some(r => r.eventId === eventId) || this.dataStore.staffAssignments.some(a => a.eventId === eventId)) throw new BadRequestException('Events with registrations or assignments must be cancelled to preserve history');
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
