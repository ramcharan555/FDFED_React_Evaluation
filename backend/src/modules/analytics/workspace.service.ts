import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { isFinanceExecutive, isSupportExecutive } from '../../common/account-access';
import { EventsService } from '../events/events.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from '../users/dto/user.dto';
import { UpdateEventDto } from '../events/dtos/event.dto';

@Injectable()
export class WorkspaceService {
  private readonly db = DataStore.getInstance();

  constructor(private readonly events: EventsService, private readonly registrations: RegistrationsService,
    private readonly users: UsersService) {}

  private safeUser(user: DataStore['users'][number], includeProfile = false) {
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

  snapshot(role: UserRole, userId: string) {
    const actor = this.db.findUserById(userId);
    if (!actor || actor.userRole !== role) throw new ForbiddenException('Workspace access denied');
    const admin = role === UserRole.SUPER_ADMIN;
    const support = isSupportExecutive(actor), finance = isFinanceExecutive(actor);
    const operator = admin || support || finance;
    const organizer = this.db.organizers.find(profile => profile.userId === userId);
    const client = this.db.clients.find(profile => profile.userId === userId);
    const staff = this.db.staffProfiles.find(profile => profile.userId === userId);
    const attendee = this.db.attendees.find(profile => profile.userId === userId);
    const assignments = support || finance ? [] : this.db.staffAssignments.filter(assignment => admin ||
      (role === UserRole.EVENT_ORGANIZER && assignment.organizerId === organizer?.organizerId) ||
      (role === UserRole.EVENT_STAFF && assignment.staffId === staff?.staffId));
    const ownEventIds = new Set(this.db.events.filter(event => operator ||
      (role === UserRole.EVENT_ORGANIZER && event.organizerId === organizer?.organizerId) ||
      (role === UserRole.CLIENT && event.clientId === client?.clientId) ||
      (role === UserRole.EVENT_STAFF && assignments.some(assignment => assignment.eventId === event.eventId)))
      .map(event => event.eventId));
    const registrations = this.registrations.findAll(UserRole.SUPER_ADMIN).filter(registration => operator ||
      (role === UserRole.ATTENDEE ? registration.attendeeId === attendee?.attendeeId : ownEventIds.has(registration.eventId)));
    const registrationIds = new Set(registrations.map(registration => registration.registrationId));
    const registeredEventIds = new Set(registrations.map(registration => registration.eventId));
    const events = this.events.findAll(UserRole.SUPER_ADMIN).filter(event => operator || ownEventIds.has(event.eventId) ||
      (role === UserRole.ATTENDEE && (registeredEventIds.has(event.eventId) ||
        (event.status === 'published' && new Date(`${event.date}T23:59:59`) >= new Date()))));
    const requests = this.db.eventRequests.filter(request => operator ||
      (role === UserRole.CLIENT && request.clientId === client?.clientId) ||
      (role === UserRole.EVENT_ORGANIZER && request.organizerId === organizer?.organizerId));
    const relatedUserIds = new Set<string>([userId]);
    registrations.forEach(registration => {
      if (registration.attendee?.userId) relatedUserIds.add(registration.attendee.userId);
    });
    requests.forEach(request => {
      const owner = this.db.clients.find(profile => profile.clientId === request.clientId);
      if (owner) relatedUserIds.add(owner.userId);
    });
    events.forEach(event => { if (event.organizerUserId) relatedUserIds.add(event.organizerUserId); });
    const users = this.db.users.filter(user => admin ||
      (support ? user.userRole !== UserRole.EVENT_STAFF && !user.employeeType :
        relatedUserIds.has(user.userId) ||
        ([UserRole.CLIENT, UserRole.EVENT_ORGANIZER].includes(role) && user.userRole === UserRole.EVENT_ORGANIZER) ||
        (role === UserRole.EVENT_ORGANIZER && user.userRole === UserRole.EVENT_STAFF && !user.employeeType)))
      .map(user => this.safeUser(user, operator || user.userId === userId));
    const tickets = this.db.supportTickets.filter(ticket => support || ticket.userId === userId);
    const staffProfiles = this.db.staffProfiles.filter(profile => !support && !finance && (admin ||
      (role === UserRole.EVENT_ORGANIZER && !this.db.findUserById(profile.userId)?.employeeType) || profile.userId === userId));
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
        (role === UserRole.EVENT_ORGANIZER && report.organizerId === organizer?.organizerId) ||
        (role === UserRole.EVENT_STAFF && report.staffId === staff?.staffId))),
      supportReports: this.db.supportExecutiveReports.filter(report => admin ? report.status !== 'draft' : report.submittedBy === userId)
        .map(report => { const { documentFileName, ...safe } = report; return { ...safe, hasDocument: !!documentFileName,
          author: this.db.findUserById(report.submittedBy)?.name || 'Executive' }; }),
    };
    return { ...payload, version: createHash('sha256').update(JSON.stringify(payload)).digest('hex') };
  }

  private requireCustomerAccess(userId: string, role: UserRole, actorId: string) {
    const actor = this.db.findUserById(actorId), target = this.db.findUserById(userId);
    if (role !== UserRole.SUPER_ADMIN && (!isSupportExecutive(actor) || !target || target.employeeType ||
      ![UserRole.CLIENT, UserRole.EVENT_ORGANIZER, UserRole.ATTENDEE].includes(target.userRole))) {
      throw new ForbiddenException('Only an admin can change employee or admin accounts');
    }
  }

  updateCustomer(userId: string, dto: UpdateUserDto, role: UserRole, actorId: string) {
    this.requireCustomerAccess(userId, role, actorId);
    return this.users.update(userId, dto, UserRole.SUPER_ADMIN, actorId);
  }

  updateEvent(eventId: string, dto: UpdateEventDto, role: UserRole, actorId: string) {
    if (role !== UserRole.SUPER_ADMIN && !isSupportExecutive(this.db.findUserById(actorId))) {
      throw new ForbiddenException('Only support executives or admins can manage event operations');
    }
    return this.events.update(eventId, dto, UserRole.SUPER_ADMIN, actorId);
  }

  removeCustomer(userId: string, role: UserRole, actorId: string) {
    this.requireCustomerAccess(userId, role, actorId);
    return this.users.remove(userId, UserRole.SUPER_ADMIN);
  }
}
