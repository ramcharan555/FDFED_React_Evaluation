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
exports.StaffAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let StaffAssignmentsService = class StaffAssignmentsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    create(dto, role) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_ORGANIZER can assign staff');
        }
        // Verify event exists
        const event = this.db.events.find(e => e.eventId === dto.eventId);
        if (!event)
            throw new common_1.NotFoundException(`Event ${dto.eventId} not found`);
        // Verify staff exists
        const staff = this.db.staffProfiles.find(s => s.staffId === dto.staffId);
        if (!staff)
            throw new common_1.NotFoundException(`Staff ${dto.staffId} not found`);
        // ✅ NEW: Check staff availability
        if (staff.availableDates && staff.availableDates.length > 0) {
            const eventDate = event.date; // Format: YYYY-MM-DD
            const isAvailable = staff.availableDates.includes(eventDate);
            if (!isAvailable) {
                throw new common_1.BadRequestException(`Staff ${staff.staffId} is not available on ${eventDate}. Available dates: ${staff.availableDates.join(', ')}`);
            }
        }
        // Duplicate assignment check
        const existing = this.db.staffAssignments.find(a => a.eventId === dto.eventId && a.staffId === dto.staffId && a.status !== 'cancelled');
        if (existing)
            throw new common_1.ConflictException('Staff already assigned to this event');
        const id = this.db.generateId('asgn');
        const assignment = {
            assignmentId: id,
            eventId: dto.eventId,
            organizerId: dto.organizerId,
            staffId: dto.staffId,
            status: 'pending',
            assignedAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.staffAssignments.push(assignment);
        // Notify staff
        const staffProfile = this.db.staffProfiles.find(s => s.staffId === dto.staffId);
        if (staffProfile) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: staffProfile.userId,
                eventId: dto.eventId,
                registrationId: undefined,
                paymentId: undefined,
                message: `You have been assigned to event "${event?.name || dto.eventId}". Please accept or decline.`,
                type: 'assignment',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Staff assignment created', data: assignment };
    }
    findAll(role, userId) {
        let assignments = [...this.db.staffAssignments];
        if (role === constants_1.UserRole.EVENT_STAFF) {
            const staffUser = this.db.staffProfiles.find(s => s.userId === userId);
            if (staffUser)
                assignments = assignments.filter(a => a.staffId === staffUser.staffId);
            else
                assignments = [];
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const org = this.db.organizers.find(o => o.userId === userId);
            if (org)
                assignments = assignments.filter(a => a.organizerId === org.organizerId);
            else
                assignments = [];
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return assignments;
    }
    updateStatus(id, dto, role, userId) {
        const assignment = this.db.staffAssignments.find(a => a.assignmentId === id);
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment ${id} not found`);
        if (role === constants_1.UserRole.EVENT_STAFF) {
            const staffUser = this.db.staffProfiles.find(s => s.userId === userId);
            if (!staffUser || staffUser.staffId !== assignment.staffId) {
                throw new common_1.ForbiddenException('You can only update your own assignments');
            }
        }
        else if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        assignment.status = dto.status;
        assignment.updatedAt = new Date();
        // Notify organizer when staff accepts/declines
        if (dto.status === 'accepted' || dto.status === 'declined') {
            const organizer = this.db.organizers.find(o => o.organizerId === assignment.organizerId);
            if (organizer) {
                const event = this.db.events.find(e => e.eventId === assignment.eventId);
                this.db.notifications.push({
                    notificationId: this.db.generateId('notif'),
                    userId: organizer.userId,
                    eventId: assignment.eventId,
                    registrationId: undefined,
                    paymentId: undefined,
                    message: `Staff ${assignment.staffId} has ${dto.status} assignment for "${event?.name || assignment.eventId}"`,
                    type: `assignment_${dto.status}`,
                    read: false,
                    dateTime: new Date(),
                    createdAt: new Date(),
                });
            }
        }
        return { success: true, message: `Assignment status updated to ${dto.status}`, data: assignment };
    }
};
exports.StaffAssignmentsService = StaffAssignmentsService;
exports.StaffAssignmentsService = StaffAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StaffAssignmentsService);
//# sourceMappingURL=staff-assignments.service.js.map