"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const EVENT_REPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-reports');
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
    createCompletionReport(eventId, dto, files, role, userId) {
        const removeFiles = () => files.forEach(file => {
            if (file.path && (0, fs_1.existsSync)(file.path))
                (0, fs_1.unlinkSync)(file.path);
        });
        if (role !== constants_1.UserRole.EVENT_ORGANIZER) {
            removeFiles();
            throw new common_1.ForbiddenException('Only the assigned organizer can submit an event completion report');
        }
        const event = this.db.events.find(item => item.eventId === eventId);
        if (!event || !event.clientId) {
            removeFiles();
            throw new common_1.NotFoundException(`Client event ${eventId} not found`);
        }
        const organizer = this.db.organizers.find(item => item.userId === userId);
        if (!organizer || organizer.organizerId !== event.organizerId) {
            removeFiles();
            throw new common_1.ForbiddenException('You can only report on your own events');
        }
        const request = this.db.eventRequests.find(item => item.eventId === eventId && item.organizerId === organizer.organizerId);
        const verifiedPayment = request && this.db.eventWorkflowPayments.find(payment => payment.eventId === eventId &&
            payment.requestId === request.requestId &&
            payment.status === 'completed' &&
            payment.amount === request.budget);
        if (event.status !== 'completed' || !request || request.status !== 'completed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment) {
            removeFiles();
            throw new common_1.BadRequestException('A completion report can only be submitted for a completed, fully paid event');
        }
        if (this.db.eventCompletionReports.some(report => report.eventId === eventId)) {
            removeFiles();
            throw new common_1.BadRequestException('A completion report has already been submitted for this event');
        }
        const report = {
            reportId: this.db.generateId('rpt-completion'),
            eventId,
            requestId: request.requestId,
            clientId: request.clientId,
            organizerId: request.organizerId,
            eventName: event.name,
            eventDate: event.date,
            venue: event.location,
            servicesProvided: dto.servicesProvided.trim(),
            expenses: dto.expenses.trim(),
            completionNotes: dto.completionNotes.trim(),
            photos: files.map(file => ({
                originalName: path.basename(file.originalname),
                fileName: path.basename(file.filename),
                mimeType: file.mimetype,
                size: file.size,
            })),
            submittedAt: new Date(),
        };
        if (!report.servicesProvided || !report.expenses || !report.completionNotes) {
            removeFiles();
            throw new common_1.BadRequestException('Services, expenses, and completion notes are required');
        }
        this.db.eventCompletionReports.push(report);
        const client = this.db.clients.find(item => item.clientId === request.clientId);
        if (client) {
            this.db.notifications.push({
                notificationId: this.db.generateId('notif'),
                userId: client.userId,
                eventId,
                registrationId: undefined,
                paymentId: undefined,
                message: `The completion report for "${event.name}" is ready to review.`,
                type: 'event_completion_report',
                read: false,
                dateTime: report.submittedAt,
                createdAt: report.submittedAt,
            });
        }
        return { success: true, message: 'Event completion report submitted', data: report };
    }
    findAllCompletionReports(role, userId) {
        if (role === constants_1.UserRole.SUPER_ADMIN)
            return [...this.db.eventCompletionReports];
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(item => item.userId === userId);
            return client ? this.db.eventCompletionReports.filter(report => report.clientId === client.clientId) : [];
        }
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(item => item.userId === userId);
            return organizer ? this.db.eventCompletionReports.filter(report => report.organizerId === organizer.organizerId) : [];
        }
        throw new common_1.ForbiddenException('Access denied');
    }
    async getCompletionReportPhoto(eventId, fileName, role, userId) {
        const report = this.getCompletionReport(eventId, role, userId);
        const photo = report.photos.find(item => item.fileName === path.basename(fileName));
        if (!photo)
            throw new common_1.NotFoundException('Report photo not found');
        const filePath = path.join(EVENT_REPORT_UPLOAD_DIR, photo.fileName);
        if (!(0, fs_1.existsSync)(filePath))
            throw new common_1.NotFoundException('Report photo is unavailable');
        await (0, promises_1.access)(filePath, fs_1.constants.R_OK);
        return { stream: (0, fs_1.createReadStream)(filePath), mimeType: photo.mimeType, fileName: photo.originalName };
    }
    getCompletionReport(eventId, role, userId) {
        const report = this.db.eventCompletionReports.find(item => item.eventId === eventId);
        if (!report)
            throw new common_1.NotFoundException('Event completion report not found');
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(item => item.userId === userId);
            if (!client || client.clientId !== report.clientId)
                throw new common_1.ForbiddenException('You can only access reports for your own events');
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(item => item.userId === userId);
            if (!organizer || organizer.organizerId !== report.organizerId)
                throw new common_1.ForbiddenException('You can only access reports for your own events');
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return report;
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