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
const crypto_1 = require("crypto");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
const account_access_1 = require("../../common/account-access");
const events_service_1 = require("../events/events.service");
const registrations_service_1 = require("../registrations/registrations.service");
const users_service_1 = require("../users/users.service");
let WorkspaceService = class WorkspaceService {
    constructor(events, registrations, users) {
        this.events = events;
        this.registrations = registrations;
        this.users = users;
        this.db = data_store_1.DataStore.getInstance();
    }
    safeUser(user, includeProfile = false) {
        const { password, profile, ...safe } = user;
        const organizer = this.db.organizers.find(item => item.userId === user.userId);
        const staff = this.db.staffProfiles.find(item => item.userId === user.userId);
        const reviews = staff ? this.db.staffReviews.filter(review => review.staffId === staff.staffId)
            : organizer ? this.db.clientOrganizerReviews.filter(review => review.organizerId === organizer.organizerId) : [];
        return { ...safe, ...(includeProfile ? { profile } : {}),
            rating: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : staff?.rating || organizer?.rating || 0,
            reviewCount: reviews.length,
            eventCount: organizer ? this.db.events.filter(event => event.organizerId === organizer.organizerId).length : 0,
            completedJobs: staff ? this.db.staffAssignments.filter(assignment => assignment.staffId === staff.staffId &&
                (assignment.status === 'completed' || (assignment.status === 'accepted' && this.db.events.some(event => event.eventId === assignment.eventId && event.status === 'completed')))).length : 0,
            organizerId: this.db.organizers.find(profile => profile.userId === user.userId)?.organizerId,
            clientId: this.db.clients.find(profile => profile.userId === user.userId)?.clientId,
            staffId: this.db.staffProfiles.find(profile => profile.userId === user.userId)?.staffId,
            attendeeId: this.db.attendees.find(profile => profile.userId === user.userId)?.attendeeId,
        };
    }
    snapshot(role, userId) {
        const actor = this.db.findUserById(userId);
        if (!actor || actor.userRole !== role)
            throw new common_1.ForbiddenException('Workspace access denied');
        const admin = role === constants_1.UserRole.SUPER_ADMIN;
        const support = (0, account_access_1.isSupportExecutive)(actor), finance = (0, account_access_1.isFinanceExecutive)(actor);
        const operator = admin || support || finance;
        const organizer = this.db.organizers.find(profile => profile.userId === userId);
        const client = this.db.clients.find(profile => profile.userId === userId);
        const staff = this.db.staffProfiles.find(profile => profile.userId === userId);
        const attendee = this.db.attendees.find(profile => profile.userId === userId);
        const assignments = support || finance ? [] : this.db.staffAssignments.filter(assignment => admin ||
            (role === constants_1.UserRole.EVENT_ORGANIZER && assignment.organizerId === organizer?.organizerId) ||
            (role === constants_1.UserRole.EVENT_STAFF && assignment.staffId === staff?.staffId));
        const ownEventIds = new Set(this.db.events.filter(event => operator ||
            (role === constants_1.UserRole.EVENT_ORGANIZER && event.organizerId === organizer?.organizerId) ||
            (role === constants_1.UserRole.CLIENT && event.clientId === client?.clientId) ||
            (role === constants_1.UserRole.EVENT_STAFF && assignments.some(assignment => assignment.eventId === event.eventId)))
            .map(event => event.eventId));
        const registrations = this.registrations.findAll(constants_1.UserRole.SUPER_ADMIN).filter(registration => operator ||
            (role === constants_1.UserRole.ATTENDEE ? registration.attendeeId === attendee?.attendeeId : ownEventIds.has(registration.eventId)));
        const registrationIds = new Set(registrations.map(registration => registration.registrationId));
        const registeredEventIds = new Set(registrations.map(registration => registration.eventId));
        const events = this.events.findAll(constants_1.UserRole.SUPER_ADMIN).filter(event => operator || ownEventIds.has(event.eventId) ||
            (role === constants_1.UserRole.ATTENDEE && (registeredEventIds.has(event.eventId) ||
                (event.status === 'published' && new Date(`${event.date}T23:59:59`) >= new Date()))));
        const requests = this.db.eventRequests.filter(request => operator ||
            (role === constants_1.UserRole.CLIENT && request.clientId === client?.clientId) ||
            (role === constants_1.UserRole.EVENT_ORGANIZER && request.organizerId === organizer?.organizerId));
        const relatedUserIds = new Set([userId]);
        registrations.forEach(registration => {
            if (registration.attendee?.userId)
                relatedUserIds.add(registration.attendee.userId);
        });
        requests.forEach(request => {
            const owner = this.db.clients.find(profile => profile.clientId === request.clientId);
            if (owner)
                relatedUserIds.add(owner.userId);
        });
        events.forEach(event => { if (event.organizerUserId)
            relatedUserIds.add(event.organizerUserId); });
        const users = this.db.users.filter(user => admin ||
            (support ? user.userRole !== constants_1.UserRole.EVENT_STAFF && !user.employeeType :
                relatedUserIds.has(user.userId) ||
                    ([constants_1.UserRole.CLIENT, constants_1.UserRole.EVENT_ORGANIZER].includes(role) && user.userRole === constants_1.UserRole.EVENT_ORGANIZER) ||
                    (role === constants_1.UserRole.EVENT_ORGANIZER && user.userRole === constants_1.UserRole.EVENT_STAFF && !user.employeeType)))
            .map(user => this.safeUser(user, operator || user.userId === userId));
        const tickets = this.db.supportTickets.filter(ticket => support || ticket.userId === userId);
        const staffProfiles = this.db.staffProfiles.filter(profile => !support && !finance && (admin ||
            (role === constants_1.UserRole.EVENT_ORGANIZER && !this.db.findUserById(profile.userId)?.employeeType) || profile.userId === userId));
        const reportIds = new Set(requests.map(request => request.requestId));
        const payload = {
            currentUser: this.safeUser(actor, true), users, events, registrations, staffAssignments: assignments, staffProfiles,
            eventRequests: requests.map(request => ({ ...request,
                clientUserId: this.db.clients.find(profile => profile.clientId === request.clientId)?.userId,
                organizerUserId: this.db.organizers.find(profile => profile.organizerId === request.organizerId)?.userId,
            })),
            eventPlans: this.db.eventPlans.filter(plan => operator || (plan.requestId && reportIds.has(plan.requestId))).map(plan => {
                const { documentFileName, ...safe } = plan;
                return safe;
            }),
            payments: this.db.payments.filter(payment => registrationIds.has(payment.registrationId)),
            refunds: this.db.refunds.filter(refund => registrationIds.has(refund.registrationId)),
            eventWorkflowPayments: this.db.eventWorkflowPayments.filter(payment => operator || ownEventIds.has(payment.eventId)),
            eventWorkflowRefunds: this.db.eventWorkflowRefunds.filter(refund => operator || ownEventIds.has(refund.eventId)),
            notifications: this.db.notifications.filter(notification => notification.userId === userId),
            supportTickets: tickets.map(ticket => ({ ticketId: ticket.ticketId, userId: ticket.userId,
                concern: ticket.concern, requestType: ticket.requestType, description: ticket.description,
                status: ticket.status, response: ticket.response, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt,
            })),
            staffReports: this.db.staffReports.filter(report => !support && !finance && (admin ||
                (role === constants_1.UserRole.EVENT_ORGANIZER && report.organizerId === organizer?.organizerId) ||
                (role === constants_1.UserRole.EVENT_STAFF && report.staffId === staff?.staffId))),
            supportReports: this.db.supportExecutiveReports.filter(report => admin ? report.status !== 'draft' : report.submittedBy === userId)
                .map(report => {
                const { documentFileName, ...safe } = report;
                return { ...safe, hasDocument: !!documentFileName,
                    author: this.db.findUserById(report.submittedBy)?.name || 'Executive' };
            }),
        };
        return { ...payload, version: (0, crypto_1.createHash)('sha256').update(JSON.stringify(payload)).digest('hex') };
    }
    requireCustomerAccess(userId, role, actorId) {
        const actor = this.db.findUserById(actorId), target = this.db.findUserById(userId);
        if (role !== constants_1.UserRole.SUPER_ADMIN && (!(0, account_access_1.isSupportExecutive)(actor) || !target || target.employeeType ||
            ![constants_1.UserRole.CLIENT, constants_1.UserRole.EVENT_ORGANIZER, constants_1.UserRole.ATTENDEE].includes(target.userRole))) {
            throw new common_1.ForbiddenException('Only an admin can change employee or admin accounts');
        }
    }
    updateCustomer(userId, dto, role, actorId) {
        this.requireCustomerAccess(userId, role, actorId);
        return this.users.update(userId, dto, constants_1.UserRole.SUPER_ADMIN, actorId);
    }
    updateEvent(eventId, dto, role, actorId) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && !(0, account_access_1.isSupportExecutive)(this.db.findUserById(actorId))) {
            throw new common_1.ForbiddenException('Only support executives or admins can manage event operations');
        }
        return this.events.update(eventId, dto, constants_1.UserRole.SUPER_ADMIN, actorId);
    }
    removeCustomer(userId, role, actorId) {
        this.requireCustomerAccess(userId, role, actorId);
        return this.users.remove(userId, constants_1.UserRole.SUPER_ADMIN);
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_service_1.EventsService, registrations_service_1.RegistrationsService,
        users_service_1.UsersService])
], WorkspaceService);
//# sourceMappingURL=workspace.service.js.map