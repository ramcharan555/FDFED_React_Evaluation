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
      r => r.eventId === event.eventId && r.status !== 'cancelled',
    ).length;

    return {
      ...event,
      // Frontend-compatible aliases
      id: event.eventId,
      title: event.name,
      price: event.ticketPrice,
      city,
      registered,
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
      events = events.filter((e) => e.status === 'published');
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
  findAllAdmin(search?: string, status?: string): any[] {
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
  findOne(eventId: string): any {
    const event = this.dataStore.events.find((e) => e.eventId === eventId);

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
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

    event.updatedAt = new Date();
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
