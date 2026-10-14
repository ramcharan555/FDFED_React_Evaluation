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
exports.EventRequestsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let EventRequestsService = class EventRequestsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    create(dto, role) {
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only CLIENT can create event requests');
        }
        const requestId = this.db.generateId('req');
        const request = {
            requestId,
            clientId: dto.clientId,
            organizerId: dto.organizerId,
            eventName: dto.eventName,
            eventDate: dto.eventDate,
            budget: dto.budget,
            capacity: dto.capacity,
            requirements: dto.requirements || '',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventRequests.push(request);
        // Notify organizer
        const organizer = this.db.organizers.find(o => o.organizerId === dto.organizerId);
        this.db.notifications.push({
            notificationId: this.db.generateId('notif'),
            userId: organizer ? organizer.userId : dto.organizerId,
            eventId: undefined,
            registrationId: undefined,
            paymentId: undefined,
            message: `New event request: "${dto.eventName}" from client ${dto.clientId}`,
            type: 'event_request',
            read: false,
            dateTime: new Date(),
            createdAt: new Date(),
        });
        return { success: true, message: 'Event request created', data: request };
    }
    findAll(role, userId) {
        let requests = [...this.db.eventRequests];
        if (role === constants_1.UserRole.CLIENT) {
            // Client sees only their own requests
            const client = this.db.clients.find(c => c.userId === userId);
            if (client)
                requests = requests.filter(r => r.clientId === client.clientId);
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (organizer)
                requests = requests.filter(r => r.organizerId === organizer.organizerId);
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return requests;
    }
    findOne(requestId, role, userId) {
        const request = this.db.eventRequests.find(r => r.requestId === requestId);
        if (!request)
            throw new common_1.NotFoundException(`Event request ${requestId} not found`);
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (!client || client.clientId !== request.clientId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== request.organizerId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return request;
    }
    updateStatus(requestId, dto, role, userId) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const request = this.db.eventRequests.find(r => r.requestId === requestId);
        if (!request)
            throw new common_1.NotFoundException(`Event request ${requestId} not found`);
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (!client || client.clientId !== request.clientId) {
                throw new common_1.ForbiddenException('You can only update your own requests');
            }
            if (dto.status !== 'cancelled') {
                throw new common_1.ForbiddenException('Clients can only cancel requests');
            }
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== request.organizerId) {
                throw new common_1.ForbiddenException('You can only update requests assigned to you');
            }
        }
        // Only organizer or super admin can approve/reject
        if ((dto.status === 'approved' || dto.status === 'rejected') &&
            role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only organizers can approve/reject event requests');
        }
        request.status = dto.status;
        request.updatedAt = new Date();
        // If approved, create an event record
        if (dto.status === 'approved') {
            const eventId = this.db.generateId('evt');
            const event = {
                eventId,
                organizerId: request.organizerId,
                clientId: request.clientId,
                name: request.eventName,
                category: 'Corporate', // Default to Corporate
                date: request.eventDate,
                time: '10:00',
                location: 'TBD',
                capacity: request.capacity,
                ticketPrice: 0,
                status: 'ongoing',
                description: request.requirements,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.db.events.push(event);
        }
        // Notify client about status change
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        if (client) {
            const clientUser = this.db.findUserById(client.userId);
            if (clientUser) {
                this.db.notifications.push({
                    notificationId: this.db.generateId('notif'),
                    userId: clientUser.userId,
                    eventId: undefined,
                    registrationId: undefined,
                    paymentId: undefined,
                    message: `Your event request "${request.eventName}" has been ${dto.status}`,
                    type: `request_${dto.status}`,
                    read: false,
                    dateTime: new Date(),
                    createdAt: new Date(),
                });
            }
        }
        return { success: true, message: `Request status updated to ${dto.status}`, data: request };
    }
};
exports.EventRequestsService = EventRequestsService;
exports.EventRequestsService = EventRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventRequestsService);
//# sourceMappingURL=event-requests.service.js.map