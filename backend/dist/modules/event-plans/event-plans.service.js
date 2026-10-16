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
exports.EventPlansService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let EventPlansService = class EventPlansService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    create(dto, role) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_ORGANIZER can create event plans');
        }
        const clientExists = this.db.clients.find(c => c.clientId === dto.clientId);
        if (!clientExists)
            throw new common_1.NotFoundException('Client not found');
        const planId = this.db.generateId('plan');
        const plan = {
            eventPlanId: planId,
            eventId: dto.eventId,
            clientId: dto.clientId,
            organizerId: dto.organizerId,
            title: dto.title,
            description: dto.description,
            budget: dto.budget,
            capacity: dto.capacity,
            status: 'submitted',
            approvalStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventPlans.push(plan);
        // Notify client
        const client = this.db.clients.find(c => c.clientId === dto.clientId);
        if (client) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: client.userId,
                eventId: dto.eventId,
                registrationId: undefined,
                paymentId: undefined,
                message: `New event plan "${dto.title}" submitted for your review`,
                type: 'event_plan',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Event plan created', data: plan };
    }
    findAll(role, userId) {
        let plans = [...this.db.eventPlans];
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (client)
                plans = plans.filter(p => p.clientId === client.clientId);
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (organizer)
                plans = plans.filter(p => p.organizerId === organizer.organizerId);
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return plans;
    }
    findOne(planId) {
        // Note: Role-based access control should be added here
        const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
        if (!plan)
            throw new common_1.NotFoundException(`Event plan ${planId} not found`);
        return plan;
    }
    updateApproval(planId, dto, role, userId) {
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only CLIENT can approve/reject event plans');
        }
        const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
        if (!plan)
            throw new common_1.NotFoundException(`Event plan ${planId} not found`);
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (!client || client.clientId !== plan.clientId) {
                throw new common_1.ForbiddenException('You can only approve/reject plans for your own events');
            }
        }
        plan.approvalStatus = dto.approvalStatus;
        plan.status = dto.approvalStatus === 'approved' ? 'approved' : 'rejected';
        plan.updatedAt = new Date();
        // Notify organizer
        const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
        if (organizer) {
            const orgUser = this.db.findUserById(organizer.userId);
            if (orgUser) {
                this.db.notifications.push({
                    notificationId: this.db.generateId('notif'),
                    userId: orgUser.userId,
                    eventId: plan.eventId,
                    registrationId: undefined,
                    paymentId: undefined,
                    message: `Event plan "${plan.title}" has been ${dto.approvalStatus} by client`,
                    type: `plan_${dto.approvalStatus}`,
                    read: false,
                    dateTime: new Date(),
                    createdAt: new Date(),
                });
            }
        }
        return { success: true, message: `Plan ${dto.approvalStatus}`, data: plan };
    }
};
exports.EventPlansService = EventPlansService;
exports.EventPlansService = EventPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventPlansService);
//# sourceMappingURL=event-plans.service.js.map