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
exports.AttendeesService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let AttendeesService = class AttendeesService {
    constructor() {
        this.dataStore = data_store_1.DataStore.getInstance();
    }
    // ─── Map attendee + user data to frontend-friendly shape ─────────────────────
    mapAttendeeToFrontend(a) {
        const user = this.dataStore.users.find((u) => u.userId === a.userId);
        // Registrations for this attendee
        const regs = this.dataStore.registrations.filter(r => r.attendeeId === a.attendeeId);
        const eventIds = regs.map(r => r.eventId);
        return {
            ...a,
            // Frontend-compatible aliases
            id: a.attendeeId,
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phoneNo || '',
            status: user?.status || 'active',
            registrationCount: regs.length,
            eventIds,
            // First registered event (for simple displays)
            eventId: eventIds[0] || null,
            joinedAt: user?.createdAt || a.createdAt,
        };
    }
    // Create Attendee (registration via user creation)
    create(createAttendeeDto, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.ATTENDEE) {
            throw new common_1.ForbiddenException('Only attendees and super admin can create attendee profiles');
        }
        const existingUser = this.dataStore.users.find((u) => u.email.toLowerCase() === createAttendeeDto.email.toLowerCase());
        if (existingUser) {
            throw new common_1.BadRequestException('Email already registered');
        }
        const userId = this.dataStore.generateId('usr-attendee');
        const attendeeId = this.dataStore.generateId('att');
        const user = {
            userId,
            name: createAttendeeDto.name,
            email: createAttendeeDto.email,
            password: createAttendeeDto.password || '',
            userRole: constants_1.UserRole.ATTENDEE,
            status: 'active',
            phoneNo: createAttendeeDto.phone || '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const attendee = {
            attendeeId,
            userId,
            createdAt: new Date(),
        };
        this.dataStore.users.push(user);
        this.dataStore.attendees.push(attendee);
        return this.mapAttendeeToFrontend(attendee);
    }
    // Get all attendees
    findAll(role, search) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.EVENT_ORGANIZER) {
            // Return empty rather than 403 so the UI can degrade gracefully
            return [];
        }
        let attendees = this.dataStore.attendees.map((a) => this.mapAttendeeToFrontend(a));
        if (search) {
            attendees = attendees.filter((a) => a.name?.toLowerCase().includes(search.toLowerCase()) ||
                a.email?.toLowerCase().includes(search.toLowerCase()));
        }
        return attendees;
    }
    // Get attendee by ID
    findOne(attendeeId, role) {
        const attendee = this.dataStore.attendees.find((a) => a.attendeeId === attendeeId);
        if (!attendee) {
            throw new common_1.NotFoundException(`Attendee with ID ${attendeeId} not found`);
        }
        return this.mapAttendeeToFrontend(attendee);
    }
    // Get attendees by event ID
    findByEvent(eventId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.EVENT_STAFF && role !== constants_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const registrations = this.dataStore.registrations.filter(r => r.eventId === eventId);
        const attendeeIds = registrations.map(r => r.attendeeId);
        const attendees = this.dataStore.attendees.filter(a => attendeeIds.includes(a.attendeeId));
        return attendees.map(a => this.mapAttendeeToFrontend(a));
    }
    // Update attendee profile
    update(attendeeId, updateAttendeeDto, role, userId) {
        const attendee = this.dataStore.attendees.find((a) => a.attendeeId === attendeeId);
        if (!attendee) {
            throw new common_1.NotFoundException(`Attendee with ID ${attendeeId} not found`);
        }
        if (role === constants_1.UserRole.ATTENDEE && attendee.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        else if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You do not have permission to update this profile');
        }
        const user = this.dataStore.users.find((u) => u.userId === attendee.userId);
        if (!user) {
            throw new common_1.NotFoundException('Associated user not found');
        }
        const dto = updateAttendeeDto;
        if (dto.name)
            user.name = dto.name;
        if (dto.email)
            user.email = dto.email;
        if (dto.phone)
            user.phoneNo = dto.phone;
        if (dto.status)
            user.status = dto.status;
        user.updatedAt = new Date();
        return this.mapAttendeeToFrontend(attendee);
    }
    // Delete attendee
    delete(attendeeId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only super admin can delete attendees');
        }
        const index = this.dataStore.attendees.findIndex((a) => a.attendeeId === attendeeId);
        if (index === -1) {
            throw new common_1.NotFoundException(`Attendee with ID ${attendeeId} not found`);
        }
        const attendee = this.dataStore.attendees[index];
        this.dataStore.attendees.splice(index, 1);
        const userIndex = this.dataStore.users.findIndex((u) => u.userId === attendee.userId);
        if (userIndex !== -1) {
            this.dataStore.users.splice(userIndex, 1);
        }
        return { message: `Attendee ${attendeeId} deleted successfully` };
    }
    // Get attendee statistics
    getStatistics() {
        const attendees = this.dataStore.attendees;
        const activeCount = attendees.length;
        const totalRegistrations = this.dataStore.registrations.length;
        return {
            totalAttendees: activeCount,
            totalRegistrations,
            avgRegistrationsPerAttendee: activeCount > 0 ? totalRegistrations / activeCount : 0,
        };
    }
};
exports.AttendeesService = AttendeesService;
exports.AttendeesService = AttendeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AttendeesService);
//# sourceMappingURL=attendees.service.js.map