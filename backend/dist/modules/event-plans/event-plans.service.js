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
exports.EventPlansService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path = __importStar(require("path"));
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const EVENT_PLAN_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-plans');
let EventPlansService = class EventPlansService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    uploadDocument(requestId, file, role, userId) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            this.removeUploadedFile(file.path);
            throw new common_1.ForbiddenException('Only event organizers can upload event plan PDFs');
        }
        const request = this.db.eventRequests.find(item => item.requestId === requestId);
        if (!request) {
            this.removeUploadedFile(file.path);
            throw new common_1.NotFoundException(`Event request ${requestId} not found`);
        }
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(item => item.userId === userId);
            if (!organizer || organizer.organizerId !== request.organizerId) {
                this.removeUploadedFile(file.path);
                throw new common_1.ForbiddenException('You can only upload plans for your own event requests');
            }
        }
        if (!['planning', 'plan_revision_requested'].includes(request.status)) {
            this.removeUploadedFile(file.path);
            throw new common_1.BadRequestException('The event request must be accepted before uploading a plan');
        }
        const signature = (0, fs_1.readFileSync)(file.path).subarray(0, 5).toString('ascii');
        if (signature !== '%PDF-') {
            this.removeUploadedFile(file.path);
            throw new common_1.BadRequestException('The uploaded file is not a valid PDF');
        }
        if (request.pendingPlanDocument?.fileName) {
            this.removeUploadedFile(path.join(EVENT_PLAN_UPLOAD_DIR, request.pendingPlanDocument.fileName));
        }
        request.pendingPlanDocument = {
            originalName: path.basename(file.originalname),
            fileName: file.filename,
            size: file.size,
        };
        return { success: true, message: 'Event plan PDF uploaded', data: request.pendingPlanDocument };
    }
    create(dto, role, userId) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only event organizers can submit event plans');
        }
        if (!dto.requestId)
            return this.createStandalonePlan(dto, role, userId);
        const request = this.db.eventRequests.find(r => r.requestId === dto.requestId);
        if (!request)
            throw new common_1.NotFoundException(`Event request ${dto.requestId} not found`);
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== request.organizerId) {
                throw new common_1.ForbiddenException('You can only submit plans for your own event requests');
            }
        }
        if (!['planning', 'plan_revision_requested'].includes(request.status)) {
            throw new common_1.BadRequestException('The request must be accepted and its budget/date agreed before submitting a plan');
        }
        if (!request.pendingPlanDocument) {
            throw new common_1.BadRequestException('Upload a PDF event plan before submitting it to the client');
        }
        const pendingFilePath = path.join(EVENT_PLAN_UPLOAD_DIR, path.basename(request.pendingPlanDocument.fileName));
        if (!(0, fs_1.existsSync)(pendingFilePath)) {
            delete request.pendingPlanDocument;
            throw new common_1.BadRequestException('The uploaded event plan PDF is unavailable. Upload it again before submitting.');
        }
        if (Number(dto.budget) !== Number(request.budget)) {
            throw new common_1.BadRequestException('The plan budget must match the agreed event budget');
        }
        if (dto.capacity !== request.capacity) {
            throw new common_1.BadRequestException('The plan capacity must match the event request');
        }
        const schedule = dto.schedule?.trim();
        const services = dto.services?.trim();
        const arrangements = dto.arrangements?.trim();
        const budgetBreakdown = dto.budgetBreakdown?.trim();
        const previousPlans = this.db.eventPlans.filter(plan => plan.requestId === request.requestId);
        const revision = previousPlans.length + 1;
        previousPlans.forEach(plan => {
            if (plan.approvalStatus === 'revision_requested')
                plan.status = 'revised';
        });
        const plan = {
            eventPlanId: this.db.generateId('plan'),
            requestId: request.requestId,
            clientId: request.clientId,
            organizerId: request.organizerId,
            title: dto.title.trim(),
            description: dto.description.trim(),
            budget: Number(dto.budget),
            capacity: dto.capacity,
            schedule,
            services,
            arrangements,
            budgetBreakdown,
            documentName: request.pendingPlanDocument.originalName,
            documentFileName: request.pendingPlanDocument.fileName,
            documentSize: request.pendingPlanDocument.size,
            revision,
            revisionReason: previousPlans.length ? request.planRevisionReason : undefined,
            status: 'submitted',
            approvalStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventPlans.push(plan);
        delete request.pendingPlanDocument;
        request.activeEventPlanId = plan.eventPlanId;
        request.status = 'plan_submitted';
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: `Event Plan Submitted (Revision ${revision})`,
            performedBy: userId || request.organizerId,
            role,
            timestamp: new Date(),
            details: { eventPlanId: plan.eventPlanId, revision },
        });
        const client = this.db.clients.find(c => c.clientId === request.clientId);
        if (client)
            this.notify(client.userId, request.eventId, `Event plan "${plan.title}" (revision ${revision}) is ready for your review.`, 'event_plan');
        return { success: true, message: 'Event plan submitted for client review', data: plan };
    }
    createStandalonePlan(dto, role, userId) {
        const client = this.db.clients.find(profile => profile.clientId === dto.clientId || profile.userId === dto.clientId);
        if (!client)
            throw new common_1.NotFoundException('Client not found');
        const organizer = role === constants_1.UserRole.EVENT_ORGANIZER
            ? this.db.organizers.find(profile => profile.userId === userId)
            : this.db.organizers.find(profile => profile.organizerId === dto.organizerId || profile.userId === dto.organizerId);
        if (!organizer)
            throw new common_1.NotFoundException('Organizer not found');
        if (role === constants_1.UserRole.EVENT_ORGANIZER &&
            dto.organizerId &&
            dto.organizerId !== organizer.organizerId &&
            dto.organizerId !== organizer.userId) {
            throw new common_1.ForbiddenException('You can only submit plans as your own organizer profile');
        }
        const plan = {
            eventPlanId: this.db.generateId('plan'),
            eventId: dto.eventId,
            clientId: client.clientId,
            organizerId: organizer.organizerId,
            title: dto.title.trim(),
            description: dto.description.trim(),
            budget: Number(dto.budget),
            capacity: dto.capacity,
            schedule: dto.schedule?.trim(),
            services: dto.services?.trim(),
            arrangements: dto.arrangements?.trim(),
            budgetBreakdown: dto.budgetBreakdown?.trim(),
            status: 'submitted',
            approvalStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.eventPlans.push(plan);
        this.notify(client.userId, dto.eventId, `New event plan "${plan.title}" submitted for your review`, 'event_plan');
        return { success: true, message: 'Event plan created', data: plan };
    }
    findAll(role, userId) {
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (!client)
                throw new common_1.ForbiddenException('Client profile not found');
            return this.db.eventPlans.filter(plan => plan.clientId === client.clientId);
        }
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (!organizer)
                throw new common_1.ForbiddenException('Organizer profile not found');
            return this.db.eventPlans.filter(plan => plan.organizerId === organizer.organizerId);
        }
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Access denied');
        return [...this.db.eventPlans];
    }
    findOne(planId, role, userId) {
        const plan = this.db.eventPlans.find(p => p.eventPlanId === planId);
        if (!plan)
            throw new common_1.NotFoundException(`Event plan ${planId} not found`);
        if (role === constants_1.UserRole.SUPER_ADMIN)
            return plan;
        if (role === constants_1.UserRole.CLIENT) {
            const client = this.db.clients.find(c => c.userId === userId);
            if (!client || client.clientId !== plan.clientId)
                throw new common_1.ForbiddenException('Access denied to this event plan');
        }
        else if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            const organizer = this.db.organizers.find(o => o.userId === userId);
            if (!organizer || organizer.organizerId !== plan.organizerId)
                throw new common_1.ForbiddenException('Access denied to this event plan');
        }
        else {
            throw new common_1.ForbiddenException('Access denied');
        }
        return plan;
    }
    async getDocument(planId, role, userId) {
        const plan = this.findOne(planId, role, userId);
        if (!plan.documentFileName)
            throw new common_1.NotFoundException('No PDF document is attached to this event plan');
        const filePath = path.join(EVENT_PLAN_UPLOAD_DIR, path.basename(plan.documentFileName));
        if (!(0, fs_1.existsSync)(filePath))
            throw new common_1.NotFoundException('Event plan PDF is unavailable');
        await (0, promises_1.access)(filePath, fs_1.constants.R_OK);
        return { stream: (0, fs_1.createReadStream)(filePath), fileName: plan.documentName || 'event-plan.pdf' };
    }
    removeUploadedFile(filePath) {
        if (filePath && (0, fs_1.existsSync)(filePath))
            (0, fs_1.unlinkSync)(filePath);
    }
    updateApproval(planId, dto, role, userId) {
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only clients can approve or request changes to event plans');
        }
        const plan = this.findOne(planId, role, userId);
        const request = this.db.eventRequests.find(r => r.requestId === plan.requestId);
        if (!request && !plan.requestId) {
            if (dto.approvalStatus === 'revision_requested') {
                throw new common_1.BadRequestException('Plan revisions are only available for request-linked plans');
            }
            plan.approvalStatus = dto.approvalStatus;
            plan.status = dto.approvalStatus === 'approved' ? 'approved' : 'rejected';
            plan.updatedAt = new Date();
            const organizer = this.db.organizers.find(profile => profile.organizerId === plan.organizerId);
            if (organizer) {
                this.notify(organizer.userId, plan.eventId, `Event plan "${plan.title}" has been ${dto.approvalStatus} by client`, `plan_${dto.approvalStatus}`);
            }
            return { success: true, message: `Plan ${dto.approvalStatus}`, data: plan };
        }
        if (!request)
            throw new common_1.NotFoundException('Event request associated with the plan was not found');
        if (request.activeEventPlanId !== plan.eventPlanId || request.status !== 'plan_submitted') {
            throw new common_1.BadRequestException('Only the latest submitted plan can be reviewed');
        }
        if (plan.approvalStatus !== 'pending')
            throw new common_1.BadRequestException('This plan has already been reviewed');
        plan.updatedAt = new Date();
        request.updatedAt = new Date();
        request.auditHistory = request.auditHistory || [];
        if (dto.approvalStatus === 'revision_requested') {
            if (!dto.reason?.trim())
                throw new common_1.BadRequestException('A reason is required when requesting a new plan');
            plan.approvalStatus = 'revision_requested';
            plan.status = 'revised';
            request.status = 'plan_revision_requested';
            request.planRevisionReason = dto.reason.trim();
            request.auditHistory.push({
                id: this.db.generateId('aud'),
                action: `New Plan Requested (Revision ${plan.revision || 1})`,
                performedBy: userId || request.clientId,
                role,
                timestamp: new Date(),
                details: { eventPlanId: plan.eventPlanId, reason: dto.reason.trim() },
            });
            const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
            if (organizer)
                this.notify(organizer.userId, request.eventId, `The client requested a new plan for "${request.eventName}": ${dto.reason.trim()}`, 'plan_revision_requested');
            return { success: true, message: 'Plan revision requested', data: plan };
        }
        plan.approvalStatus = 'approved';
        plan.status = 'approved';
        const eventId = this.db.generateId('evt');
        const event = {
            eventId,
            organizerId: request.organizerId,
            clientId: request.clientId,
            name: request.eventName,
            category: request.eventType || 'Event',
            date: request.eventDate,
            time: '10:00',
            location: request.venue || '',
            capacity: request.capacity,
            ticketPrice: 0,
            status: 'ongoing',
            description: request.requirements || plan.description,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.db.events.push(event);
        plan.eventId = eventId;
        request.eventId = eventId;
        request.status = 'confirmed';
        request.auditHistory.push({
            id: this.db.generateId('aud'),
            action: `Final Event Plan Approved (Revision ${plan.revision || 1}); Event Moved to Ongoing`,
            performedBy: userId || request.clientId,
            role,
            timestamp: new Date(),
            details: { eventPlanId: plan.eventPlanId, eventId },
        });
        const organizer = this.db.organizers.find(o => o.organizerId === plan.organizerId);
        if (organizer)
            this.notify(organizer.userId, eventId, `The client approved the final plan for "${request.eventName}". The event is now ongoing.`, 'plan_approved');
        const client = this.db.clients.find(c => c.clientId === plan.clientId);
        if (client)
            this.notify(client.userId, eventId, `Your approved event "${request.eventName}" has moved to Ongoing Events.`, 'event_ongoing');
        return { success: true, message: 'Final plan approved and event moved to ongoing', data: { plan, event } };
    }
    notify(userId, eventId, message, type) {
        this.db.notifications.push({
            notificationId: this.db.generateId('notif'),
            userId,
            eventId,
            registrationId: undefined,
            paymentId: undefined,
            message,
            type,
            read: false,
            dateTime: new Date(),
            createdAt: new Date(),
        });
    }
};
exports.EventPlansService = EventPlansService;
exports.EventPlansService = EventPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EventPlansService);
//# sourceMappingURL=event-plans.service.js.map