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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let ReportsService = class ReportsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    // EVENT REPORTS
    createEventReport(dto, role) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_ORGANIZER can create event reports');
        }
        const id = this.db.generateId('rpt-evt');
        const report = {
            eventReportId: id,
            organizerId: dto.organizerId,
            eventId: dto.eventId,
            clientId: dto.clientId,
            submittedByStaffId: dto.submittedByStaffId,
            reportTitle: dto.reportTitle,
            reportDetails: dto.reportDetails,
            submissionDate: dto.submissionDate,
            status: 'submitted',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventReports.push(report);
        // Notify client if clientId provided
        if (dto.clientId) {
            const client = this.db.clients.find(c => c.clientId === dto.clientId);
            if (client) {
                this.db.notifications.push({
                    notificationId: this.db.generateId('notif'),
                    userId: client.userId,
                    eventId: dto.eventId,
                    registrationId: undefined,
                    paymentId: undefined,
                    message: `New event report: "${dto.reportTitle}" has been submitted`,
                    type: 'event_report',
                    read: false,
                    dateTime: new Date(),
                    createdAt: new Date(),
                });
            }
        }
        return { success: true, message: 'Event report created', data: report };
    }
    findAllEventReports(role, userId) {
        let reports = [...this.db.eventReports];
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (client)
                reports = reports.filter(r => r.clientId === client.clientId);
            else
                reports = [];
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const org = this.db.organizers.find(o => o.userId === userId);
            if (org)
                reports = reports.filter(r => r.organizerId === org.organizerId);
            else
                reports = [];
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return reports;
    }
    // STAFF REPORTS
    createStaffReport(dto, role) {
        if (role !== constants_1.UserRole.EVENT_STAFF && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_STAFF can create staff reports');
        }
        // Staff should only report for assigned events
        const assignment = this.db.staffAssignments.find(a => a.staffId === dto.staffId && a.eventId === dto.eventId && a.status === 'accepted');
        if (!assignment && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('You can only report for events you are assigned to');
        }
        const id = this.db.generateId('rpt-staff');
        const report = {
            staffReportId: id,
            staffId: dto.staffId,
            organizerId: dto.organizerId,
            eventId: dto.eventId,
            reportText: dto.reportText,
            status: 'submitted',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.staffReports.push(report);
        // Notify organizer
        const organizer = this.db.organizers.find(o => o.organizerId === dto.organizerId);
        if (organizer) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: organizer.userId,
                eventId: dto.eventId,
                registrationId: undefined,
                paymentId: undefined,
                message: `Staff report submitted by ${dto.staffId} for event ${dto.eventId}`,
                type: 'staff_report',
                read: false,
                dateTime: new Date(),
                createdAt: new Date(),
            });
        }
        return { success: true, message: 'Staff report created', data: report };
    }
    findAllStaffReports(role, userId) {
        let reports = [...this.db.staffReports];
        if (role === constants_1.UserRole.EVENT_STAFF) {
            const staff = this.db.staffProfiles.find(s => s.userId === userId);
            if (staff)
                reports = reports.filter(r => r.staffId === staff.staffId);
            else
                reports = [];
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const org = this.db.organizers.find(o => o.userId === userId);
            if (org)
                reports = reports.filter(r => r.organizerId === org.organizerId);
            else
                reports = [];
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return reports;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ReportsService);
//# sourceMappingURL=reports.service.js.map