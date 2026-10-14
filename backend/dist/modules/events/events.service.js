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
        const registered = this.dataStore.registrations.filter(r => r.eventId === event.eventId && r.status !== 'cancelled').length;
        return {
            ...event,
            // Frontend-compatible aliases
            id: event.eventId,
            title: event.name,
            price: event.ticketPrice,
            city,
            registered,
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
            events = events.filter((e) => e.status === 'published');
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
    findAllAdmin(search, status) {
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
    findOne(eventId) {
        const event = this.dataStore.events.find((e) => e.eventId === eventId);
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
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
        event.updatedAt = new Date();
        return this.mapEventToFrontend(event);
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