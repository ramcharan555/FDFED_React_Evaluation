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
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const events_service_1 = require("../events/events.service");
const password_1 = require("../../common/utils/password");
let WorkspaceService = class WorkspaceService {
    constructor(events) {
        this.events = events;
        this.db = data_store_1.DataStore.getInstance();
    }
    actor(id) {
        const actor = this.db.users.find(u => u.userId === id && u.status === 'active');
        if (!actor)
            throw new common_1.ForbiddenException('Active authenticated account required');
        return actor;
    }
    department(id, allowed) {
        const actor = this.actor(id);
        if (actor.userRole !== constants_1.UserRole.SUPER_ADMIN && !(actor.userRole === constants_1.UserRole.EVENT_STAFF && allowed.includes(String(actor.employeeType))))
            throw new common_1.ForbiddenException('This action is not allowed for your department');
        return actor;
    }
    log(id, action, entityId, details = {}) {
        this.db.activityLogs.push({ id: this.db.generateId('log'), action, resource: entityId, role: this.actor(id).userRole, timestamp: new Date(), status: 'success', details: { actorId: id, ...details } });
    }
    notify(id, message, type) { this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: id, message, type, read: false, dateTime: new Date(), createdAt: new Date() }); }
    safeUser(u) { const { password, ...safe } = u; return safe; }
    snapshot(id) {
        const actor = this.actor(id), admin = actor.userRole === constants_1.UserRole.SUPER_ADMIN;
        const employee = actor.userRole === constants_1.UserRole.EVENT_STAFF && !!actor.employeeType;
        const operations = employee && [constants_1.EmployeeType.EVENT_OPERATIONS, constants_1.EmployeeType.REGISTRATION_VERIFICATION, constants_1.EmployeeType.SUPPORT_EXECUTIVE].includes(actor.employeeType);
        const staff = this.db.staffProfiles.find(s => s.userId === id);
        const org = this.db.organizers.find(o => o.userId === id);
        const client = this.db.clients.find(c => c.userId === id);
        const attendee = this.db.attendees.find(a => a.userId === id);
        const assignments = this.db.staffAssignments.filter(a => admin || operations || (actor.userRole === constants_1.UserRole.EVENT_ORGANIZER && a.organizerId === org?.organizerId) || (actor.userRole === constants_1.UserRole.EVENT_STAFF && a.staffId === staff?.staffId)).map(a => ({ ...a, eventName: this.db.events.find(e => e.eventId === a.eventId)?.name }));
        const ownEvents = new Set(this.db.events.filter(e => admin || operations || (actor.userRole === constants_1.UserRole.EVENT_ORGANIZER && e.organizerId === org?.organizerId) || (actor.userRole === constants_1.UserRole.CLIENT && e.clientId === client?.clientId) || (actor.userRole === constants_1.UserRole.EVENT_STAFF && assignments.some(a => a.eventId === e.eventId))).map(e => e.eventId));
        const acceptedEvents = new Set(assignments.filter(a => a.status === 'accepted' || a.status === 'completed').map(a => a.eventId));
        const registrations = this.db.registrations.filter(r => admin || operations || (actor.userRole === constants_1.UserRole.ATTENDEE ? r.attendeeId === attendee?.attendeeId : actor.userRole === constants_1.UserRole.EVENT_STAFF ? acceptedEvents.has(r.eventId) : ownEvents.has(r.eventId))).map(r => {
            const a = this.db.attendees.find(a => a.attendeeId === r.attendeeId), u = this.db.users.find(u => u.userId === a?.userId);
            return { ...r, attendeeName: u?.name, attendeeUserId: u?.userId, email: u?.email, eventName: this.db.events.find(e => e.eventId === r.eventId)?.name };
        });
        const registrationIds = new Set(registrations.map(r => r.registrationId));
        const viewRevenue = admin || [constants_1.UserRole.ATTENDEE, constants_1.UserRole.CLIENT, constants_1.UserRole.EVENT_ORGANIZER].includes(actor.userRole);
        const payments = this.db.payments.filter(p => admin || (viewRevenue && registrationIds.has(p.registrationId)));
        const refunds = this.db.refunds.filter(r => payments.some(p => p.paymentId === r.paymentId));
        const requests = this.db.eventRequests.filter(r => admin || (actor.userRole === constants_1.UserRole.EVENT_ORGANIZER && r.organizerId === org?.organizerId) || (actor.userRole === constants_1.UserRole.CLIENT && r.clientId === client?.clientId));
        const events = this.db.events.filter(e => ownEvents.has(e.eventId) || (actor.userRole === constants_1.UserRole.ATTENDEE && (e.status === 'published' || registrations.some(r => r.eventId === e.eventId)))).map(e => ({ ...e, registered: this.db.registrations.filter(r => r.eventId === e.eventId && ['registered', 'attended', 'pending_payment'].includes(r.status) && (!r.reservationExpiresAt || +new Date(r.reservationExpiresAt) > Date.now())).length }));
        const userIds = new Set([id, ...registrations.map(r => r.attendeeUserId), ...this.db.organizers.map(o => o.userId), ...assignments.map(a => this.db.staffProfiles.find(s => s.staffId === a.staffId)?.userId)]);
        const users = this.db.users.filter(u => admin || (operations && actor.employeeType === constants_1.EmployeeType.REGISTRATION_VERIFICATION ? u.userRole === constants_1.UserRole.ATTENDEE || u.userId === id : userIds.has(u.userId) || actor.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS && u.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS)).map(u => admin || u.userId === id ? this.safeUser(u) : ({ userId: u.userId, name: u.name, userRole: u.userRole, employeeType: u.employeeType, status: u.status, ...(operations || actor.userRole === constants_1.UserRole.EVENT_ORGANIZER ? { email: u.email, phoneNo: u.phoneNo } : {}) }));
        const seen = new Set();
        const gross = payments.filter(p => ['completed', 'refunded'].includes(p.status)).reduce((n, p) => { if (seen.has(p.registrationId))
            return n; seen.add(p.registrationId); return n + Math.round(p.amount * 100); }, 0);
        const refunded = refunds.filter(r => r.status === 'completed').reduce((n, r) => n + Math.round(r.amount * 100), 0);
        return { generatedAt: new Date(), actor: this.safeUser(actor), permissions: { admin, employee, operations, verify: admin || actor.employeeType === constants_1.EmployeeType.REGISTRATION_VERIFICATION || (!employee && actor.userRole === constants_1.UserRole.EVENT_STAFF), manageEvents: admin || actor.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS || actor.userRole === constants_1.UserRole.EVENT_ORGANIZER, manageUsers: admin || actor.employeeType === constants_1.EmployeeType.REGISTRATION_VERIFICATION }, users, events, registrations, payments, refunds, requests, assignments,
            clientId: client?.clientId,
            viewRevenue,
            financeGrants: admin ? this.db.financeGrants : [],
            clients: admin || actor.userRole === constants_1.UserRole.EVENT_ORGANIZER ? this.db.clients.map(c => ({ clientId: c.clientId, name: this.db.users.find(u => u.userId === c.userId)?.name || c.companyName })) : [],
            organizers: this.db.organizers.filter(o => this.db.users.some(u => u.userId === o.userId && u.userRole === constants_1.UserRole.EVENT_ORGANIZER && u.status === 'active')).map(o => ({ organizerId: o.organizerId, userId: o.userId, name: this.db.users.find(u => u.userId === o.userId)?.name || o.businessName })),
            staff: admin || operations || actor.userRole === constants_1.UserRole.EVENT_ORGANIZER ? this.db.staffProfiles.map(s => ({ ...s, name: this.db.users.find(u => u.userId === s.userId)?.name })) : staff ? [staff] : [],
            attendees: admin || operations ? this.db.attendees : attendee ? [attendee] : [],
            notifications: this.db.notifications.filter(n => n.userId === id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
            reports: this.db.employeeReports.filter(r => admin || r.submittedBy === id),
            eventReports: this.db.eventReports.filter(r => admin || (actor.userRole === constants_1.UserRole.EVENT_ORGANIZER && r.organizerId === org?.organizerId) || (actor.userRole === constants_1.UserRole.CLIENT && r.clientId === client?.clientId)),
            tasks: this.db.operationTasks.filter(t => admin || actor.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS || t.assignedTo === id).map(t => ({ ...t, eventName: this.db.events.find(e => e.eventId === t.eventId)?.name, assignedToName: this.db.users.find(u => u.userId === t.assignedTo)?.name })),
            supportTickets: this.db.supportTickets.filter(t => admin || actor.employeeType === constants_1.EmployeeType.SUPPORT_EXECUTIVE || t.userId === id).map(t => ({ ...t, requesterName: this.db.users.find(u => u.userId === t.userId)?.name })),
            summary: { users: users.length, events: events.length, registrations: registrations.length, checkedIn: registrations.filter(r => r.status === 'attended').length, pendingPayments: payments.filter(p => p.status === 'pending').length, gross, refunded, net: gross - refunded, pendingRequests: requests.filter(r => !['confirmed', 'approved', 'rejected', 'cancelled', 'withdrawn', 'expired'].includes(r.status)).length, pendingReports: this.db.employeeReports.filter(r => (admin || r.submittedBy === id) && r.status === 'submitted').length, openTasks: this.db.operationTasks.filter(t => (admin || t.assignedTo === id || actor.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS) && t.status !== 'completed').length },
        };
    }
    account(id, body) {
        const u = this.actor(id);
        if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || (body.phoneNo && !/^[6-9]\d{9}$/.test(body.phoneNo)) || (body.bio && (typeof body.bio !== 'string' || body.bio.length > 2000)))
            throw new common_1.BadRequestException('Enter valid profile information');
        if (this.db.users.some(x => x.userId !== id && x.email.toLowerCase() === body.email.trim().toLowerCase()))
            throw new common_1.ConflictException('Email already registered');
        const reauthenticate = u.email !== body.email.trim();
        const preferences = body.preferences || u.preferences;
        if (preferences && ['emailNotifications', 'smsReminders', 'eventRecommendations'].some(k => typeof preferences[k] !== 'boolean'))
            throw new common_1.BadRequestException('Invalid preferences');
        Object.assign(u, { name: body.name.trim(), email: body.email.trim(), phoneNo: body.phoneNo || '', bio: body.bio || '', preferences, updatedAt: new Date() });
        this.log(id, 'account.update', id);
        return { user: this.safeUser(u), reauthenticate };
    }
    password(id, body) {
        const u = this.actor(id);
        if (!body || typeof body.currentPassword !== 'string' || body.currentPassword.length > 200 || !(0, password_1.verifyPassword)(body.currentPassword, u.password))
            throw new common_1.ForbiddenException('Current password is incorrect');
        if (typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 200 || body.newPassword.trim() !== body.newPassword)
            throw new common_1.BadRequestException('Use an 8–200 character password without surrounding spaces');
        u.password = (0, password_1.hashPassword)(body.newPassword);
        u.updatedAt = new Date();
        this.log(id, 'password.update', id);
        return { success: true };
    }
    reviewRegistration(id, registrationId, body) {
        this.department(id, [constants_1.EmployeeType.REGISTRATION_VERIFICATION]);
        const r = this.db.registrations.find(r => r.registrationId === registrationId);
        if (!r)
            throw new common_1.NotFoundException('Registration not found');
        if (!body || !['approved', 'flagged'].includes(body.status) || (body.status === 'flagged' && (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 2000)))
            throw new common_1.BadRequestException('Valid review status and flag reason required');
        // Reviewing a booking never changes its payment state or issues a ticket.
        Object.assign(r, { reviewStatus: body.status, reviewedBy: id, reviewReason: body.reason?.trim() || '', updatedAt: new Date() });
        const attendee = this.db.attendees.find(a => a.attendeeId === r.attendeeId);
        if (attendee)
            this.notify(attendee.userId, `Your registration ${registrationId} was ${body.status} by registration verification. ${r.reviewReason}`, 'registration_review');
        this.log(id, 'registration.review', registrationId, { status: body.status, reason: r.reviewReason });
        return r;
    }
    eventAction(id, eventId, body) {
        this.department(id, [constants_1.EmployeeType.EVENT_OPERATIONS]);
        if (!body || !['published', 'ongoing', 'completed', 'cancelled'].includes(body.status))
            throw new common_1.BadRequestException('Invalid event status');
        const event = this.db.events.find(e => e.eventId === eventId);
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const transitions = { draft: ['published', 'cancelled'], published: ['ongoing', 'cancelled'], ongoing: ['completed', 'cancelled'], completed: [], cancelled: [] };
        if (!transitions[event.status].includes(body.status))
            throw new common_1.ConflictException('Invalid event status transition');
        // Department authorization above is explicit; reuse cancellation/refund notifications.
        const result = this.events.update(eventId, { status: body.status }, constants_1.UserRole.SUPER_ADMIN, id);
        this.log(id, 'event.status', eventId, { status: body.status });
        return result;
    }
    editEvent(id, eventId, body) {
        this.department(id, [constants_1.EmployeeType.EVENT_OPERATIONS]);
        const result = this.events.update(eventId, body, constants_1.UserRole.SUPER_ADMIN, id);
        this.log(id, 'event.update', eventId);
        return result;
    }
    editUser(id, targetId, body) {
        const actor = this.department(id, [constants_1.EmployeeType.REGISTRATION_VERIFICATION]);
        const u = this.db.users.find(u => u.userId === targetId);
        if (!u)
            throw new common_1.NotFoundException('User not found');
        if (actor.userRole !== constants_1.UserRole.SUPER_ADMIN && u.userRole !== constants_1.UserRole.ATTENDEE)
            throw new common_1.ForbiddenException('This department can only edit attendee accounts');
        if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 254 || (body.phoneNo && !/^[6-9]\d{9}$/.test(body.phoneNo)))
            throw new common_1.BadRequestException('Valid name, email and mobile number required');
        if (this.db.users.some(x => x.userId !== targetId && x.email.toLowerCase() === body.email.trim().toLowerCase()))
            throw new common_1.ConflictException('Email already registered');
        if (body.employeeType !== undefined) {
            if (actor.userRole !== constants_1.UserRole.SUPER_ADMIN || u.userRole !== constants_1.UserRole.EVENT_STAFF)
                throw new common_1.ForbiddenException('Only Super Admin can configure an employee department');
            if (body.employeeType !== '' && !Object.values(constants_1.EmployeeType).includes(body.employeeType))
                throw new common_1.BadRequestException('Invalid employee department');
            u.employeeType = body.employeeType || undefined;
        }
        Object.assign(u, { name: body.name.trim(), email: body.email.trim(), phoneNo: body.phoneNo || '', updatedAt: new Date() });
        this.log(id, 'user.update', targetId);
        return this.safeUser(u);
    }
    userStatus(id, targetId, body) {
        const actor = this.department(id, [constants_1.EmployeeType.REGISTRATION_VERIFICATION]);
        const u = this.db.users.find(u => u.userId === targetId);
        if (!u)
            throw new common_1.NotFoundException('User not found');
        if (actor.userRole !== constants_1.UserRole.SUPER_ADMIN && u.userRole !== constants_1.UserRole.ATTENDEE)
            throw new common_1.ForbiddenException('This department can only manage attendee accounts');
        if (u.userId === id || !body || !['active', 'inactive', 'suspended'].includes(body.status))
            throw new common_1.BadRequestException('Invalid account status change');
        if (u.userRole === constants_1.UserRole.SUPER_ADMIN && body.status !== 'active' && this.db.users.filter(x => x.userRole === constants_1.UserRole.SUPER_ADMIN && x.status === 'active').length <= 1)
            throw new common_1.ConflictException('Keep at least one active Super Admin');
        u.status = body.status;
        u.updatedAt = new Date();
        this.log(id, 'user.status', targetId, { status: body.status });
        return this.safeUser(u);
    }
    task(id, taskId, body) {
        this.department(id, [constants_1.EmployeeType.EVENT_OPERATIONS]);
        if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160 || !this.db.events.some(e => e.eventId === body.eventId) || !['pending', 'in_progress', 'completed', 'blocked'].includes(body.status))
            throw new common_1.BadRequestException('Task title, event and valid status required');
        const assignee = this.db.users.find(u => u.userId === body.assignedTo && u.status === 'active' && u.employeeType === constants_1.EmployeeType.EVENT_OPERATIONS);
        if (!assignee)
            throw new common_1.BadRequestException('Assign the task to an active Event Operations employee');
        let task = this.db.operationTasks.find(t => t.id === taskId);
        if (taskId && !task)
            throw new common_1.NotFoundException('Task not found');
        if (!task) {
            task = { id: this.db.generateId('task'), createdBy: id, createdAt: new Date() };
            this.db.operationTasks.push(task);
        }
        Object.assign(task, { title: body.title.trim(), eventId: body.eventId, status: body.status, assignedTo: assignee.userId, updatedAt: new Date() });
        this.notify(assignee.userId, `Event operation task: ${task.title} (${task.status})`, 'operation_task');
        this.log(id, 'task.save', task.id);
        return task;
    }
    submitReport(id, body) {
        const actor = this.actor(id);
        if (actor.userRole !== constants_1.UserRole.EVENT_STAFF || !actor.employeeType)
            throw new common_1.ForbiddenException('Department employee required');
        if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160 || typeof body.content !== 'string' || !body.content.trim() || body.content.length > 20000 || typeof body.key !== 'string' || !/^[\w-]{16,100}$/.test(body.key))
            throw new common_1.BadRequestException('Report title, content and submission key required');
        const existing = this.db.employeeReports.find(r => r.submittedBy === id && r.key === body.key);
        if (existing) {
            if (existing.title !== body.title.trim() || existing.content !== body.content.trim())
                throw new common_1.ConflictException('Submission key already used');
            return existing;
        }
        const admins = this.db.users.filter(u => u.userRole === constants_1.UserRole.SUPER_ADMIN && u.status === 'active');
        if (!admins.length)
            throw new common_1.ConflictException('No active Super Admin to receive this report');
        const row = { id: this.db.generateId('emp-rpt'), title: body.title.trim(), content: body.content.trim(), department: actor.employeeType, submittedBy: id, submittedByName: actor.name, status: 'submitted', key: body.key, createdAt: new Date() };
        this.db.employeeReports.push(row);
        admins.forEach(u => this.notify(u.userId, `${actor.name} submitted ${row.title}. Open Employee Reports.`, 'employee_report'));
        this.log(id, 'report.submit', row.id);
        return row;
    }
    reviewReport(id, reportId, body) {
        const actor = this.department(id, []);
        const row = this.db.employeeReports.find(r => r.id === reportId);
        if (!row)
            throw new common_1.NotFoundException('Report not found');
        if (row.status !== 'submitted')
            throw new common_1.ConflictException('Report already reviewed');
        if (!body || typeof body.notes !== 'string' || body.notes.length > 2000)
            throw new common_1.BadRequestException('Valid review notes required');
        Object.assign(row, { status: 'reviewed', reviewedBy: actor.userId, reviewedAt: new Date(), reviewNotes: body.notes });
        this.notify(row.submittedBy, `Super Admin reviewed "${row.title}". ${body.notes}`, 'employee_report_reviewed');
        this.log(id, 'report.review', reportId);
        return row;
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map