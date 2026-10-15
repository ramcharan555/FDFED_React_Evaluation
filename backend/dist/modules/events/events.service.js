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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let EventsService = class EventsService {
    constructor() {
        this.dataStore = data_store_1.DataStore.getInstance();
    }
    isActiveReservation(registration) {
        return registration.status !== 'pending_payment' || !registration.reservationExpiresAt || registration.reservationExpiresAt > new Date();
    }
    // Create Event - Organizer or Super Admin
    create(createEventDto, role, organizerId) {
        if (![constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.EVENT_ORGANIZER].includes(role)) {
            throw new common_1.ForbiddenException('Only organizers and super admin can create events');
        }
        const name = createEventDto.title || createEventDto.name;
        if (!name || !createEventDto.date || !createEventDto.time) {
            throw new common_1.BadRequestException('Event name, date, and time are required');
        }
        const organizer = this.dataStore.organizers.find(o => o.userId === organizerId);
        const eventId = this.dataStore.generateId('evt');
        const event = {
            eventId,
            organizerId: organizer ? organizer.organizerId : (createEventDto.organizerId || 'org-001'),
            clientId: createEventDto.clientId,
            name,
            category: createEventDto.category || 'General',
            date: createEventDto.date,
            time: createEventDto.time,
            location: createEventDto.location || '',
            capacity: createEventDto.capacity || 100,
            ticketPrice: createEventDto.price ?? createEventDto.ticketPrice ?? 0,
            status: createEventDto.status || 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        event.description = createEventDto.description || '';
        event.city = createEventDto.city || '';
        event.registrationDeadline = createEventDto.registrationDeadline;
        event.cancellationDeadline = createEventDto.cancellationDeadline;
        event.eligibility = createEventDto.eligibility;
        event.waitlistEnabled = createEventDto.waitlistEnabled ?? false;
        this.dataStore.events.push(event);
        return this.mapEventToFrontend(event);
    }
    // ─── Normalize backend event to include frontend-friendly aliases ───────────
    mapEventToFrontend(event) {
        // Extract city from location (e.g., "Convention Center, New York" → "New York")
        const locationParts = event.location.split(',');
        const city = event.city ||
            (locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : event.location);
        // Count registrations for this event
        const registered = this.dataStore.registrations.filter(r => r.eventId === event.eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r)).length;
        return {
            ...event,
            // Frontend-compatible aliases
            id: event.eventId,
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
            description: event.description || '',
        };
    }
    // Get all events - filtered based on role
    findAll(role, search, status) {
        let events = [...this.dataStore.events];
        if (search) {
            events = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.location.toLowerCase().includes(search.toLowerCase()));
        }
        if (status) {
            events = events.filter((e) => e.status === status);
        }
        if (role === constants_1.UserRole.ATTENDEE) {
            events = events.filter((e) => e.status === 'published' && new Date(`${e.date}T23:59:59`) >= new Date());
        }
        return events.map(e => this.mapEventToFrontend(e));
    }
    // Get all published events without role restriction (public endpoint)
    findAllPublic(search) {
        let events = this.dataStore.events.filter(e => e.status === 'published');
        if (search) {
            events = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.location.toLowerCase().includes(search.toLowerCase()));
        }
        return events.map(e => this.mapEventToFrontend(e));
    }
    // Get all events (no role filter — for super_admin dashboard)
    findAllAdmin(role, search, status) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only super admin can access the complete event catalog');
        let events = [...this.dataStore.events];
        if (search) {
            events = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) ||
                e.location.toLowerCase().includes(search.toLowerCase()));
        }
        if (status) {
            events = events.filter((e) => e.status === status);
        }
        return events.map(e => this.mapEventToFrontend(e));
    }
    // Get event by ID
    findOne(eventId, role, userId) {
        const event = this.dataStore.events.find((e) => e.eventId === eventId);
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        if (role === constants_1.UserRole.ATTENDEE && (event.status !== 'published' || new Date(`${event.date}T23:59:59`) < new Date())) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.dataStore.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== event.organizerId)
                throw new common_1.ForbiddenException('You can only access your own events');
        }
        return this.mapEventToFrontend(event);
    }
    // Update event - only by organizer who created it or super admin
    update(eventId, updateEventDto, role, userId) {
        const event = this.dataStore.events.find(e => e.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.dataStore.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== event.organizerId) {
                throw new common_1.ForbiddenException('You can only update your own events');
            }
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers and super admin can update events');
        }
        const before = { date: event.date, time: event.time, location: event.location, status: event.status };
        if (event.clientId && updateEventDto.status === 'completed') {
            throw new common_1.BadRequestException('Client events must be completed through the payment-verified completion workflow');
        }
        const occupied = this.dataStore.registrations.filter(r => r.eventId === eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && this.isActiveReservation(r)).length;
        if (updateEventDto.capacity !== undefined && updateEventDto.capacity < occupied)
            throw new common_1.BadRequestException(`Capacity cannot be lower than ${occupied} active registrations`);
        // Support both backend (name) and frontend (title) field names
        const dto = updateEventDto;
        if (dto.name || dto.title)
            event.name = dto.name || dto.title;
        if (dto.category)
            event.category = dto.category;
        if (dto.date)
            event.date = dto.date;
        if (dto.time)
            event.time = dto.time;
        if (dto.location)
            event.location = dto.location;
        if (dto.capacity)
            event.capacity = dto.capacity;
        if (dto.ticketPrice !== undefined)
            event.ticketPrice = dto.ticketPrice;
        if (dto.price !== undefined)
            event.ticketPrice = dto.price;
        if (dto.status)
            event.status = dto.status;
        if (dto.description !== undefined)
            event.description = dto.description;
        if (dto.city)
            event.city = dto.city;
        if (dto.registrationDeadline !== undefined)
            event.registrationDeadline = dto.registrationDeadline;
        if (dto.cancellationDeadline !== undefined)
            event.cancellationDeadline = dto.cancellationDeadline;
        if (dto.eligibility !== undefined)
            event.eligibility = dto.eligibility;
        if (dto.waitlistEnabled !== undefined)
            event.waitlistEnabled = dto.waitlistEnabled;
        event.updatedAt = new Date();
        const changes = [];
        if (before.date !== event.date)
            changes.push({ type: new Date(event.date) > new Date(before.date) ? 'postponed' : 'time_changed', summary: `Event date changed from ${before.date} to ${event.date}`, previousValue: before.date, newValue: event.date });
        if (before.time !== event.time)
            changes.push({ type: 'time_changed', summary: `Event time changed from ${before.time} to ${event.time}`, previousValue: before.time, newValue: event.time });
        if (before.location !== event.location)
            changes.push({ type: 'venue_changed', summary: `Event venue changed from ${before.location} to ${event.location}`, previousValue: before.location, newValue: event.location });
        if (before.status !== 'cancelled' && event.status === 'cancelled')
            changes.push({ type: 'cancelled', summary: 'Event cancelled by the organizer' });
        for (const change of changes) {
            this.dataStore.eventChanges.push({ changeId: this.dataStore.generateId('chg'), eventId, ...change, createdAt: new Date() });
            const affected = this.dataStore.registrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
            for (const registration of affected) {
                const attendee = this.dataStore.attendees.find(a => a.attendeeId === registration.attendeeId);
                if (change.type === 'cancelled') {
                    registration.status = 'cancelled';
                    registration.cancelledAt = new Date();
                    registration.cancellationReason = 'Event cancelled by organizer';
                    registration.qrCode = undefined;
                    registration.verificationId = undefined;
                    registration.updatedAt = new Date();
                    const payment = this.dataStore.payments.find(p => p.registrationId === registration.registrationId && p.status === 'completed');
                    if (payment && !this.dataStore.refunds.some(r => r.registrationId === registration.registrationId)) {
                        const refund = { refundId: this.dataStore.generateId('ref'), paymentId: payment.paymentId, registrationId: registration.registrationId, amount: payment.amount, status: 'pending', reason: 'Event cancelled by organizer', requestedAt: new Date() };
                        this.dataStore.refunds.push(refund);
                        if (attendee)
                            this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, paymentId: payment.paymentId, message: `Event cancelled. Simulated refund of ₹${refund.amount} is pending.`, type: 'refund_pending', read: false, dateTime: new Date(), createdAt: new Date() });
                    }
                }
                if (attendee)
                    this.dataStore.notifications.push({ notificationId: this.dataStore.generateId('notif'), userId: attendee.userId, eventId, registrationId: registration.registrationId, message: `${event.name}: ${change.summary}`, type: change.type === 'cancelled' ? 'event_cancelled' : 'event_changed', read: false, dateTime: new Date(), createdAt: new Date() });
            }
        }
        return this.mapEventToFrontend(event);
    }
    completeClientEvent(eventId, role, userId) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER) {
            throw new common_1.ForbiddenException('Only the assigned organizer can complete this event');
        }
        const event = this.dataStore.events.find(item => item.eventId === eventId);
        if (!event || !event.clientId)
            throw new common_1.NotFoundException(`Client event ${eventId} not found`);
        const organizer = this.dataStore.organizers.find(item => item.userId === userId);
        if (!organizer || organizer.organizerId !== event.organizerId) {
            throw new common_1.ForbiddenException('You can only complete your own events');
        }
        if (event.status !== 'ongoing') {
            throw new common_1.BadRequestException('Only ongoing events can be marked completed');
        }
        const eventDateEnd = new Date(`${event.date}T23:59:59`);
        if (Number.isNaN(eventDateEnd.getTime()) || eventDateEnd > new Date()) {
            throw new common_1.BadRequestException('The event can only be completed after its event date');
        }
        const request = this.dataStore.eventRequests.find(item => item.eventId === eventId && item.organizerId === organizer.organizerId);
        const verifiedPayment = this.dataStore.eventWorkflowPayments.find(payment => payment.eventId === eventId &&
            payment.requestId === request?.requestId &&
            payment.status === 'completed' &&
            payment.amount === request?.budget);
        if (!request || request.status !== 'confirmed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment) {
            throw new common_1.BadRequestException('Verified full payment is required before completing the event');
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
    delete(eventId, role, userId) {
        const event = this.dataStore.events.find(e => e.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.dataStore.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== event.organizerId) {
                throw new common_1.ForbiddenException('You can only delete your own events');
            }
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers and super admin can delete events');
        }
        const index = this.dataStore.events.findIndex((e) => e.eventId === eventId);
        this.dataStore.events.splice(index, 1);
        return { message: `Event ${eventId} deleted successfully` };
    }
    // Publish event
    publish(eventId, role, userId) {
        const event = this.dataStore.events.find(e => e.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.dataStore.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== event.organizerId) {
                throw new common_1.ForbiddenException('You can only publish your own events');
            }
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers and super admin can publish events');
        }
        event.status = 'published';
        event.updatedAt = new Date();
        return this.mapEventToFrontend(event);
    }
    // Get event statistics
    getStatistics() {
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
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventsService);
//# sourceMappingURL=events.service.js.map