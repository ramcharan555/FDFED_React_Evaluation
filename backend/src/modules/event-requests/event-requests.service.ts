import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { assertEventPolicyAccepted, EventPolicyAcknowledgementDto, getEventPolicy } from '../../common/event-policy';
import {
  CreateEventRequestDto,
  UpdateEventRequestStatusDto,
  RequestMissingInfoDto,
  ProvideMissingInfoDto,
  SendProposalDto,
  ReviseProposalDto,
  RejectRequestDto,
  ClientResponseDto,
  UpdateAgreementStatusDto,
  UpdatePaymentStatusDto,
  ConfirmBookingDto,
  PayDepositDto,
  RequestEventModificationDto,
  RespondToEventModificationDto,
} from './dto/event-request.dto';

@Injectable()
export class EventRequestsService {
  private db: DataStore;
  constructor() {
    this.db = DataStore.getInstance();
  }

  /** Reject invalid dates and dates that are not strictly in the future. */
  private isPastDate(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return true;
    }
    const normalizedDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(normalizedDate.getTime()) || normalizedDate.toISOString().slice(0, 10) !== dateStr) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(`${dateStr}T00:00:00`);
    return targetDate <= today;
  }

  /** Check future dates against both confirmed events and active request holds. */
  checkDateAvailability(organizerId: string, dateStr: string, excludeRequestId?: string): {
    available: boolean;
    reason?: string;
    pastDate?: boolean;
    conflictEvent?: any;
  } {
    if (!dateStr || !dateStr.trim()) {
      return { available: false, reason: 'Date string is required' };
    }

    if (this.isPastDate(dateStr)) {
      return {
        available: false,
        reason: 'Event date must be in the future',
        pastDate: true,
      };
    }

    const organizer = this.db.organizers.find(item => item.organizerId === organizerId || item.userId === organizerId);
    const ownerId = organizer?.organizerId || organizerId;
    const eventConflict = this.db.events.find(event =>
      event.organizerId === ownerId && event.date === dateStr && event.status !== 'cancelled',
    );
    if (eventConflict) {
      return { available: false, reason: `Organizer is already scheduled for "${eventConflict.name}"`, conflictEvent: eventConflict };
    }
    const activeRequest = this.db.eventRequests.find(request =>
      request.requestId !== excludeRequestId && request.organizerId === ownerId && request.eventDate === dateStr
      && !['rejected', 'withdrawn', 'cancelled', 'expired', 'completed'].includes(request.status),
    );
    if (activeRequest) {
      return { available: false, reason: `Date is being held for "${activeRequest.eventName}"` };
    }
    return { available: true, reason: 'Future event date accepted' };
  }

  /**
   * Auto-expire proposals that have passed their validUntil date
   */
  private checkAndExpireProposals(requests: any[]): void {
    const now = new Date();
    for (const req of requests) {
      if (
        (req.status === 'proposal_sent' || req.status === 'awaiting_client') &&
        Array.isArray(req.proposals) &&
        req.proposals.length > 0
      ) {
        const activeProposal = req.proposals[req.proposals.length - 1];
        if (
          activeProposal &&
          activeProposal.status === 'pending_client' &&
          activeProposal.validUntil
        ) {
          const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
          if (validUntilDate < now) {
            activeProposal.status = 'expired';
            req.status = 'expired';
            req.updatedAt = new Date();
            req.auditHistory = req.auditHistory || [];
            req.auditHistory.push({
              id: this.db.generateId('aud'),
              action: `Proposal (v${activeProposal.version}) Expired`,
              performedBy: 'system',
              role: 'system',
              timestamp: new Date(),
              details: { validUntil: activeProposal.validUntil },
            });
          }

        }
      }
    }
  }

  private addAudit(request: any, action: string, userId: string | undefined, role: UserRole, details?: any): void {
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action,
      performedBy: userId || role,
      role,
      timestamp: new Date(),
      ...(details ? { details } : {}),
    });
  }

  private notifyRequestClient(request: any, message: string, type: string): void {
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    if (!client) return;
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: client.userId,
      eventId: request.eventId,
      registrationId: undefined,
      paymentId: undefined,
      message,
      type,
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });
  }

  private notifyRequestOrganizer(request: any, message: string, type: string): void {
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (!organizer) return;
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: organizer.userId,
      eventId: request.eventId,
      registrationId: undefined,
      paymentId: undefined,
      message,
      type,
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });
  }

  findOrganizers(role: UserRole): any[] {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can browse organizers');
    }
    return this.db.organizers.flatMap(organizer => {
      const user = this.db.findUserById(organizer.userId);
      if (!user || user.status !== 'active') return [];
      const reviews = this.db.clientOrganizerReviews.filter(review => review.organizerId === organizer.organizerId);
      const averageReviewRating = reviews.length
        ? Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1))
        : undefined;

      // Compute years of experience from account creation date
      const createdDate = organizer.createdAt ? new Date(organizer.createdAt) : new Date();
      const yearsExperience = Math.max(1, new Date().getFullYear() - createdDate.getFullYear());

      // Completed events count
      const completedEvents = this.db.events.filter(e => e.organizerId === organizer.organizerId && e.status === 'completed').length;

      return [{
        organizerId: organizer.organizerId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        businessName: organizer.businessName || '',
        rating: averageReviewRating || organizer.rating,
        reviewCount: reviews.length,
        yearsExperience,
        completedEvents,
        verified: yearsExperience >= 1,
      }];
    });
  }

  create(dto: CreateEventRequestDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can create event requests');
    }
    const policy = getEventPolicy();
    assertEventPolicyAccepted(dto, policy);

    const client = this.db.clients.find(
      (item) => item.userId === userId || item.clientId === userId,
    );
    if (role === UserRole.CLIENT && !client) {
      throw new ForbiddenException('Client profile not found');
    }
    const clientId = role === UserRole.CLIENT ? client!.clientId : dto.clientId;
    const organizer = this.db.organizers.find(
      (item) => item.organizerId === dto.organizerId || item.userId === dto.organizerId,
    );
    if (!organizer) {
      throw new BadRequestException('Selected organizer was not found');
    }

    if (this.isPastDate(dto.eventDate)) {
      throw new BadRequestException('Desired event date must be in the future');
    }

    if (dto.budget <= 0) {
      throw new BadRequestException('Budget must be greater than zero');
    }

    if (dto.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1 guest');
    }

    const clientProfile = role === UserRole.CLIENT
      ? this.db.clients.find(c => c.userId === userId)
      : this.db.clients.find(c => c.clientId === dto.clientId || c.userId === dto.clientId);
    if (!clientProfile) throw new NotFoundException('Client profile not found');
    if (role === UserRole.SUPER_ADMIN && dto.clientId && clientProfile.clientId !== dto.clientId && clientProfile.userId !== dto.clientId) {
      throw new BadRequestException('Invalid client');
    }

    const organizerProfile = this.db.organizers.find(o =>
      o.organizerId === dto.organizerId || o.userId === dto.organizerId,
    );
    if (!organizerProfile) throw new NotFoundException('Organizer not found');

    // Check for duplicate active requests
    const isDuplicate = this.db.eventRequests.some(
      r =>
        r.clientId === clientProfile.clientId &&
        r.organizerId === organizerProfile.organizerId &&
        r.eventName.toLowerCase().trim() === dto.eventName.toLowerCase().trim() &&
        r.eventDate === dto.eventDate &&
        ['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'changes_requested', 'counteroffer_received', 'planning', 'plan_submitted', 'plan_revision_requested', 'confirmed'].includes(r.status)
    );

    if (isDuplicate) {
      throw new ConflictException(
        `A pending or active event request for "${dto.eventName}" on ${dto.eventDate} already exists.`
      );
    }

    const requestId = this.db.generateId('req');
    const request = {
      requestId,
      clientId: clientProfile.clientId,
      organizerId: organizerProfile.organizerId,
      eventName: dto.eventName.trim(),
      eventType: dto.eventType?.trim() || 'General',
      venue: dto.venue?.trim() || '',
      eventDate: dto.eventDate,
      eventTime: dto.eventTime?.trim() || '00:00',
      city: dto.city?.trim() || '',
      dateFlexibility: dto.dateFlexibility || 'exact',
      budget: Number(dto.budget),
      capacity: Number(dto.capacity),
      requirements: dto.requirements || '',
      notes: dto.notes || '',
      policySnapshot: policy,
      clientPolicyAcceptedAt: new Date(),
      clientPolicyAcceptedBy: userId || clientProfile.userId,
      status: 'submitted' as const,
      agreementStatus: 'not_sent' as const,
      paymentStatus: 'unpaid' as const,
      currentProposalVersion: 0,
      proposals: [],
      clarifications: [],
      auditHistory: [
        {
          id: this.db.generateId('aud'),
          action: 'Request Submitted',
          performedBy: userId || clientProfile.userId,
          role: role,
          timestamp: new Date(),
          details: {
            budget: dto.budget,
            capacity: dto.capacity,
            eventDate: dto.eventDate,
            eventType: dto.eventType,
            city: dto.city,
          },
        },
      ],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.eventRequests.push(request);

    // Notify organizer
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: organizerProfile.userId,
      eventId: undefined,
      registrationId: undefined,
      paymentId: undefined,
      message: `New event request: "${dto.eventName}" from client ${clientId}`,
      type: 'event_request',
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });

    return { success: true, message: 'Event request submitted successfully', data: request };
  }

  findAll(role: UserRole, userId?: string): any[] {
    this.checkAndExpireProposals(this.db.eventRequests);

    let requests = [...this.db.eventRequests];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      const clientId = client ? client.clientId : userId;
      requests = requests.filter(r => r.clientId === clientId || (r as any).clientId === userId);
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const organizerId = organizer ? organizer.organizerId : userId;
      requests = requests.filter(
        r => r.organizerId === organizerId || (r as any).organizerId === userId || (r as any).organizer === userId || (r as any).organizer === organizerId
      );
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return requests.map(request => {
      const clientProfile = this.db.clients.find(client => client.clientId === request.clientId);
      const clientUser = clientProfile && this.db.findUserById(clientProfile.userId);
      const organizerProfile = this.db.organizers.find(organizer => organizer.organizerId === request.organizerId);
      const organizerUser = organizerProfile && this.db.findUserById(organizerProfile.userId);
      return {
        ...request,
        clientUserId: clientUser?.userId,
        organizerUserId: organizerUser?.userId,
        clientDetails: clientUser ? {
          userId: clientUser.userId, name: clientUser.name, email: clientUser.email,
          phoneNo: clientUser.phoneNo, companyName: clientProfile?.companyName,
        } : undefined,
        organizerDetails: organizerUser ? {
          userId: organizerUser.userId, name: organizerUser.name, businessName: organizerProfile?.businessName,
        } : undefined,
      };
    });
  }

  findOne(requestId: string, role: UserRole, userId?: string): any {
    this.checkAndExpireProposals(this.db.eventRequests);

    const request = this.db.eventRequests.find(r => r.requestId === requestId || (r as any).id === requestId);
    if (!request) throw new NotFoundException(`Event request ${requestId} not found`);

    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId || c.clientId === userId);
      const clientId = client ? client.clientId : userId;
      if (request.clientId !== clientId && (request as any).clientId !== userId) {
        throw new ForbiddenException('Access denied to this request');
      }
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(o => o.userId === userId || o.organizerId === userId);
      const organizerId = organizer ? organizer.organizerId : userId;
      if (
        request.organizerId !== organizerId &&
        (request as any).organizerId !== userId &&
        (request as any).organizer !== userId &&
        (request as any).organizer !== organizerId
      ) {
        throw new ForbiddenException('Access denied to this request');
      }
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  private findMutableRequest(requestId: string, role: UserRole, userId?: string): any {
    const request = this.findOne(requestId, role, userId);
    if (['cancelled', 'completed', 'rejected', 'withdrawn', 'expired'].includes(request.status)) {
      throw new BadRequestException(`Cannot change a request that is already ${request.status}`);
    }
    return request;
  }

  /**
   * Organizer starts review of a submitted request
   */
  startReview(requestId: string, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can start request reviews');
    }

    if (!['submitted', 'pending', 'under_review'].includes(request.status)) {
      throw new BadRequestException(`Cannot review a request in ${request.status} status`);
    }

    if (request.status !== 'under_review') {
      const previousStatus = request.status;
      request.status = 'under_review';
      request.updatedAt = new Date();
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: 'Review Started',
        performedBy: userId || 'organizer',
        role,
        timestamp: new Date(),
        details: { previousStatus },
      });
    }

    return { success: true, message: 'Request is now under review', data: request };
  }

  acceptRequest(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can accept event requests');
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const user = this.db.users.find(u => u.userId === userId);
      const org = this.db.organizers.find(o => o.organizerId === request.organizerId || o.userId === userId);
      if ((user && user.status !== 'active') || (org && (org as any).verificationStatus && (org as any).verificationStatus !== 'Approved')) {
        throw new ForbiddenException('Only approved organizers can accept event bookings or requests');
      }
    }
    if (!['submitted', 'pending', 'under_review', 'info_requested'].includes(request.status)) {
      throw new BadRequestException(`Cannot accept a request in ${request.status} status`);
    }
    const availability = this.checkDateAvailability(request.organizerId, request.eventDate, request.requestId);
    if (!availability.available) throw new ConflictException(availability.reason);
    const policy = request.policySnapshot || getEventPolicy();
    assertEventPolicyAccepted(acknowledgement || {}, policy);

    request.policySnapshot = policy;
    request.organizerPolicyAcceptedAt = new Date();
    request.organizerPolicyAcceptedBy = userId;
    request.status = 'planning';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Event Request Accepted; Planning Started',
      performedBy: userId || 'organizer',
      role,
      timestamp: new Date(),
    });
    this.notifyRequestClient(request, `Your event request "${request.eventName}" was accepted. The organizer can now prepare your event plan.`, 'request_accepted');
    return { success: true, message: 'Request accepted; event planning can begin', data: request };
  }

  /**
   * Organizer requests missing info from client
   */
  requestMissingInfo(requestId: string, dto: RequestMissingInfoDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can request missing information');
    }

    if (!['submitted', 'pending', 'under_review', 'info_requested'].includes(request.status)) {
      throw new BadRequestException(`Cannot request information while the request is ${request.status}`);
    }

    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException('Message is required when requesting information');
    }

    request.clarifications = request.clarifications || [];
    request.clarifications.push({
      id: this.db.generateId('clr'),
      senderId: userId || 'organizer',
      senderRole: 'organizer',
      senderName: 'Organizer',
      message: dto.message.trim(),
      timestamp: new Date(),
    });

    request.status = 'info_requested';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Missing Information Requested',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { query: dto.message.trim() },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Organizer requested additional information for "${request.eventName}": "${dto.message.slice(0, 60)}..."`,
        type: 'info_requested',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Information requested from client', data: request };
  }

  /**
   * Client provides missing information
   */
  provideMissingInfo(requestId: string, dto: ProvideMissingInfoDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only client can respond to missing information requests');
    }
    if (request.status !== 'info_requested') {
      throw new BadRequestException('This request is not waiting for clarification');
    }

    if (!dto.response || !dto.response.trim()) {
      throw new BadRequestException('Response is required');
    }

    request.clarifications = request.clarifications || [];
    request.clarifications.push({
      id: this.db.generateId('clr'),
      senderId: userId || 'client',
      senderRole: 'client',
      senderName: 'Client',
      message: dto.response.trim(),
      timestamp: new Date(),
    });

    request.status = 'under_review';
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Information Provided by Client',
      performedBy: userId || 'client',
      role: role,
      timestamp: new Date(),
      details: { response: dto.response.trim() },
    });

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (organizer) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: organizer.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Client provided information for "${request.eventName}"`,
        type: 'info_provided',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Information sent to organizer', data: request };
  }

  /**
   * Organizer sends proposal
   */
  sendProposal(requestId: string, dto: SendProposalDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can send proposals');
    }

    const hasAcceptedProposal = Array.isArray(request.proposals) && request.proposals.length > 0;
    const canReviseAcceptedProposal = hasAcceptedProposal &&
      ['under_review', 'proposal_sent', 'awaiting_client'].includes(request.status);
    if (!['planning', 'plan_revision_requested', 'submitted', 'pending', 'under_review'].includes(request.status) && !canReviseAcceptedProposal) {
      throw new BadRequestException('A proposal can only be sent after the organizer accepts the request');
    }

    if (['submitted', 'pending', 'under_review'].includes(request.status)) {
      if (!request.policySnapshot) {
        request.policySnapshot = getEventPolicy();
      }
      if (!request.organizerPolicyAcceptedAt) {
        request.organizerPolicyAcceptedAt = new Date();
        request.organizerPolicyAcceptedBy = userId;
      }
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Proposal amount must be greater than zero');
    }

    if (dto.depositRequired < 0 || dto.depositRequired > dto.amount) {
      throw new BadRequestException('Deposit required must be between 0 and total amount');
    }

    if (this.isPastDate(dto.validUntil)) {
      throw new BadRequestException('Proposal expiration date must be in the future');
    }

    const proposedDate = dto.proposedDate || request.eventDate;
    if (this.isPastDate(proposedDate)) {
      throw new BadRequestException('Proposed event date must be in the future');
    }

    // Check date availability
    const avail = this.checkDateAvailability(request.organizerId, proposedDate, request.requestId);
    if (!avail.available) {
      throw new ConflictException(`Cannot propose date ${proposedDate}: ${avail.reason}`);
    }

    request.proposals = request.proposals || [];
    // If there were any existing pending proposals, mark them superseded
    request.proposals.forEach((p: any) => {
      if (p.status === 'pending_client') p.status = 'revision_requested';
    });

    const newVersion = (request.proposals.length || 0) + 1;
    const proposal = {
      version: newVersion,
      amount: Number(dto.amount),
      depositRequired: Number(dto.depositRequired),
      proposedDate,
      validUntil: dto.validUntil,
      terms: dto.terms || 'Standard service agreement terms apply.',
      notes: dto.notes || '',
      eventPlan: dto.eventPlan || '',
      timeline: dto.timeline || '',
      organizerFee: dto.organizerFee !== undefined ? Number(dto.organizerFee) : undefined,
      itemizedCosts: dto.itemizedCosts || '',
      taxes: dto.taxes !== undefined ? Number(dto.taxes) : undefined,
      includedServices: dto.includedServices || '',
      excludedServices: dto.excludedServices || '',
      attendeeCapacity: dto.attendeeCapacity !== undefined ? Number(dto.attendeeCapacity) : undefined,
      constraints: dto.constraints || '',
      paymentSchedule: dto.paymentSchedule || '',
      cancellationTerms: dto.cancellationTerms || '',
      conditions: dto.conditions || '',
      status: 'pending_client' as const,
      sentAt: new Date(),
    };

    request.proposals.push(proposal);
    request.currentProposalVersion = newVersion;
    request.status = 'proposal_sent';
    request.agreementStatus = 'not_sent';
    request.paymentStatus = 'unpaid';
    request.updatedAt = new Date();

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: `Proposal Sent (v${newVersion})`,
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: {
        version: newVersion,
        amount: dto.amount,
        depositRequired: dto.depositRequired,
        validUntil: dto.validUntil,
        proposedDate,
      },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `New proposal received for "${request.eventName}" (v${newVersion}: ₹${dto.amount.toLocaleString()})`,
        type: 'proposal_sent',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: `Proposal v${newVersion} sent successfully`, data: request };
  }

  /**
   * Organizer revises existing proposal
   */
  reviseProposal(requestId: string, dto: ReviseProposalDto, role: UserRole, userId?: string): any {
    return this.sendProposal(requestId, dto, role, userId);
  }

  /**
   * Organizer rejects request with mandatory reason
   */
  rejectRequest(requestId: string, dto: RejectRequestDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can reject event requests');
    }

    if (request.status === 'confirmed') {
      throw new BadRequestException('Cannot reject an already confirmed request. Please cancel the booking instead.');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason is mandatory when declining/rejecting a request');
    }

    const reasonType = dto.reasonType || 'permanent';
    if (reasonType !== 'permanent') {
      const policy = request.policySnapshot || getEventPolicy();
      assertEventPolicyAccepted(dto, policy);
      if (reasonType === 'budget' || reasonType === 'both') {
        if (!dto.proposedBudget || dto.proposedBudget <= request.budget) {
          throw new BadRequestException('A requested budget increase must be greater than the current budget');
        }
      }
      if (reasonType === 'date' || reasonType === 'both') {
        if (!dto.proposedDate || this.isPastDate(dto.proposedDate)) {
          throw new BadRequestException('A future proposed date is required');
        }
        const availability = this.checkDateAvailability(request.organizerId, dto.proposedDate, request.requestId);
        if (!availability.available) throw new ConflictException(availability.reason);
      }
      request.negotiations = request.negotiations || [];
      request.policySnapshot = policy;
      request.organizerPolicyAcceptedAt = new Date();
      request.organizerPolicyAcceptedBy = userId;
      request.negotiations.push({
        id: this.db.generateId('neg'),
        action: 'changes_requested',
        performedBy: userId || 'organizer',
        role,
        reason: dto.reason.trim(),
        ...(dto.proposedBudget ? { budget: Number(dto.proposedBudget) } : {}),
        ...(dto.proposedDate ? { eventDate: dto.proposedDate } : {}),
        timestamp: new Date(),
      });
      request.status = 'changes_requested';
      request.updatedAt = new Date();
      this.addAudit(request, 'Changes Requested by Organizer', userId, role, {
        reasonType,
        reason: dto.reason.trim(),
        proposedBudget: dto.proposedBudget,
        proposedDate: dto.proposedDate,
      });
      this.notifyRequestClient(
        request,
        `The organizer requested changes to "${request.eventName}": ${dto.reason.trim()}`,
        'request_changes',
      );
      return { success: true, message: 'Requested changes sent to client', data: request };
    }

    request.status = 'rejected';
    request.rejectionReason = dto.reason.trim();
    if (dto.comments && dto.comments.trim()) {
      request.rejectionComments = dto.comments.trim();
    }
    request.updatedAt = new Date();

    // Mark any active proposal as rejected
    if (Array.isArray(request.proposals)) {
      request.proposals.forEach((p: any) => {
        if (p.status === 'pending_client') p.status = 'rejected';
      });
    }

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Request Rejected',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { reason: dto.reason.trim(), comments: dto.comments?.trim() },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: `Your event request "${request.eventName}" was declined: ${dto.reason.trim()}`,
        type: 'request_rejected',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Request rejected with reason recorded', data: request };
  }

  /**
   * Client responds to proposal (accept, request_revision, reject, withdraw)
   */
  clientResponse(requestId: string, dto: ClientResponseDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can respond to proposals');
    }

    if (request.status === 'confirmed' || request.status === 'rejected' || request.status === 'withdrawn') {
      throw new BadRequestException(`Cannot respond to a request that is already ${request.status}`);
    }

    const proposals = request.proposals || [];
    const activeProposal = proposals[proposals.length - 1];

    if (dto.decision === 'withdraw') {
      request.status = 'withdrawn';
      request.withdrawalReason = dto.notes || 'Withdrawn by client';
      request.updatedAt = new Date();
      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: 'Request Withdrawn by Client',
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
      return { success: true, message: 'Event request withdrawn', data: request };
    }

    if (['accept_changes', 'reject_changes', 'counteroffer'].includes(dto.decision)) {
      if (!['changes_requested', 'counteroffer_received'].includes(request.status)) {
        throw new BadRequestException('There are no organizer-requested changes to respond to');
      }
      const latestChange = [...(request.negotiations || [])].reverse().find(n => n.action === 'changes_requested');
      if (dto.decision === 'accept_changes') {
        if (latestChange?.eventDate) {
          const availability = this.checkDateAvailability(request.organizerId, latestChange.eventDate, request.requestId);
          if (!availability.available) throw new ConflictException(availability.reason);
          request.eventDate = latestChange.eventDate;
        }
        if (latestChange?.budget) request.budget = latestChange.budget;
        request.status = 'planning';
        request.updatedAt = new Date();
        this.addAudit(request, 'Client Accepted Requested Changes', userId, role, { notes: dto.notes });
      } else if (dto.decision === 'reject_changes') {
        request.status = 'under_review';
        request.updatedAt = new Date();
        request.negotiations = request.negotiations || [];
        request.negotiations.push({
          id: this.db.generateId('neg'),
          action: 'changes_rejected',
          performedBy: userId || 'client',
          role,
          reason: dto.notes?.trim() || 'Client rejected the requested changes',
          timestamp: new Date(),
        });
        this.addAudit(request, 'Client Rejected Requested Changes', userId, role, { notes: dto.notes });
      } else {
        if (
          !dto.counterofferBudget &&
          !dto.counterofferDate &&
          !dto.counterofferEventName &&
          !dto.counterofferEventType &&
          dto.counterofferCapacity === undefined &&
          !dto.counterofferVenue &&
          !dto.counterofferRequirements
        ) {
          throw new BadRequestException('A counteroffer must include at least one changed event detail');
        }
        if (dto.counterofferBudget && dto.counterofferBudget <= 0) {
          throw new BadRequestException('Counteroffer budget must be greater than zero');
        }
        if (dto.counterofferDate) {
          if (this.isPastDate(dto.counterofferDate)) throw new BadRequestException('Counteroffer date must be in the future');
          const availability = this.checkDateAvailability(request.organizerId, dto.counterofferDate, request.requestId);
          if (!availability.available) throw new ConflictException(availability.reason);
        }
        request.negotiations = request.negotiations || [];
        request.negotiations.push({
          id: this.db.generateId('neg'),
          action: 'counteroffer',
          performedBy: userId || 'client',
          role,
          reason: dto.notes?.trim() || '',
          ...(dto.counterofferBudget ? { budget: Number(dto.counterofferBudget) } : {}),
          ...(dto.counterofferDate ? { eventDate: dto.counterofferDate } : {}),
          ...(dto.counterofferEventName ? { eventName: dto.counterofferEventName.trim() } : {}),
          ...(dto.counterofferEventType ? { eventType: dto.counterofferEventType.trim() } : {}),
          ...(dto.counterofferCapacity !== undefined ? { capacity: Number(dto.counterofferCapacity) } : {}),
          ...(dto.counterofferVenue !== undefined ? { venue: dto.counterofferVenue.trim() } : {}),
          ...(dto.counterofferRequirements !== undefined ? { requirements: dto.counterofferRequirements.trim() } : {}),
          timestamp: new Date(),
        });
        request.status = 'counteroffer_received';
        request.updatedAt = new Date();
        this.addAudit(request, 'Counteroffer Sent by Client', userId, role, {
          budget: dto.counterofferBudget,
          eventDate: dto.counterofferDate,
          eventName: dto.counterofferEventName,
          eventType: dto.counterofferEventType,
          capacity: dto.counterofferCapacity,
          venue: dto.counterofferVenue,
          requirements: dto.counterofferRequirements,
          notes: dto.notes,
        });
      }
      if (dto.decision === 'accept_changes') {
        this.notifyRequestOrganizer(request, `Client accepted the requested changes for "${request.eventName}".`, 'changes_accepted');
      } else {
        this.notifyRequestOrganizer(request, `Client responded to changes for "${request.eventName}": ${dto.decision.replace('_', ' ')}.`, `changes_${dto.decision}`);
      }
      return { success: true, message: `Response "${dto.decision}" recorded`, data: request };
    }

    if (!activeProposal) {
      throw new BadRequestException('No active proposal found on this request to respond to');
    }

    if (request.status !== 'proposal_sent' || activeProposal.status !== 'pending_client') {
      throw new BadRequestException('This proposal is no longer awaiting a client decision');
    }

    if (dto.decision === 'request_revision' && !dto.notes?.trim()) {
      throw new BadRequestException('A reason is required when requesting a revised proposal');
    }

    // Check expiry
    if (activeProposal.validUntil) {
      const validUntilDate = new Date(activeProposal.validUntil + 'T23:59:59');
      if (validUntilDate < new Date()) {
        activeProposal.status = 'expired';
        request.status = 'expired';
        request.updatedAt = new Date();
        throw new BadRequestException('This proposal has expired. Please request a revised proposal.');
      }
    }

    activeProposal.clientResponseAt = new Date();
    activeProposal.clientNotes = dto.notes?.trim() || '';

    if (dto.decision === 'accept') {
      activeProposal.status = 'accepted';
      if (activeProposal.proposedDate) request.eventDate = activeProposal.proposedDate;
      request.status = 'awaiting_client';
      request.agreementStatus = 'pending_signature';
      request.paymentStatus = 'deposit_pending';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Proposal Accepted (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    } else if (dto.decision === 'request_revision') {
      activeProposal.status = 'revision_requested';
      request.status = 'under_review';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Revision Requested by Client (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    } else if (dto.decision === 'reject') {
      activeProposal.status = 'rejected';
      request.status = 'rejected';
      request.rejectionReason = dto.notes || 'Proposal rejected by client';
      request.updatedAt = new Date();

      request.auditHistory = request.auditHistory || [];
      request.auditHistory.push({
        id: this.db.generateId('aud'),
        action: `Proposal Rejected by Client (v${activeProposal.version})`,
        performedBy: userId || 'client',
        role: role,
        timestamp: new Date(),
        details: { notes: dto.notes },
      });
    }

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === request.organizerId);
    if (organizer) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: organizer.userId,
        eventId: undefined,
        registrationId: undefined,
        paymentId: undefined,
        message: dto.decision === 'request_revision'
          ? `Client requested a revised plan for "${request.eventName}": ${activeProposal.clientNotes}`
          : `Client responded to proposal for "${request.eventName}": ${dto.decision.toUpperCase()}`,
        type: `proposal_${dto.decision}`,
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: `Response "${dto.decision}" recorded`, data: request };
  }

  acceptCounteroffer(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can accept client counteroffers');
    }
    if (request.status !== 'counteroffer_received') {
      throw new BadRequestException('There is no pending client counteroffer');
    }
    const counteroffer = [...(request.negotiations || [])].reverse().find(n => n.action === 'counteroffer');
    if (!counteroffer) throw new BadRequestException('Counteroffer details are missing');
    const policy = request.policySnapshot || getEventPolicy();
    assertEventPolicyAccepted(acknowledgement || {}, policy);
    if (counteroffer.eventDate) {
      const availability = this.checkDateAvailability(request.organizerId, counteroffer.eventDate, request.requestId);
      if (!availability.available) throw new ConflictException(availability.reason);
      request.eventDate = counteroffer.eventDate;
    }
    if (counteroffer.budget) request.budget = counteroffer.budget;
    if (counteroffer.eventName) request.eventName = counteroffer.eventName;
    if (counteroffer.eventType) request.eventType = counteroffer.eventType;
    if (counteroffer.capacity !== undefined) request.capacity = counteroffer.capacity;
    if (counteroffer.venue !== undefined) request.venue = counteroffer.venue;
    if (counteroffer.requirements !== undefined) request.requirements = counteroffer.requirements;
    request.policySnapshot = policy;
    request.organizerPolicyAcceptedAt = new Date();
    request.organizerPolicyAcceptedBy = userId;
    request.status = 'planning';
    request.updatedAt = new Date();
    this.addAudit(request, 'Organizer Accepted Client Counteroffer', userId, role, {
      budget: counteroffer.budget,
      eventDate: counteroffer.eventDate,
      eventName: counteroffer.eventName,
      eventType: counteroffer.eventType,
      capacity: counteroffer.capacity,
      venue: counteroffer.venue,
      requirements: counteroffer.requirements,
    });
    this.notifyRequestClient(request, `The organizer accepted your counteroffer for "${request.eventName}". Planning can begin.`, 'counteroffer_accepted');
    return { success: true, message: 'Counteroffer accepted; event planning can begin', data: request };
  }

  /**
   * Update Agreement Status (agreed, pending_signature, declined)
   */
  updateAgreementStatus(requestId: string, dto: UpdateAgreementStatusDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only the client can acknowledge or decline the agreement');
    }
    if (!['agreed', 'declined'].includes(dto.agreementStatus)) {
      throw new BadRequestException('Agreement status can only be changed through the client acknowledgement action');
    }
    if (!['pending_signature', 'declined'].includes(request.agreementStatus)) {
      throw new BadRequestException('There is no agreement awaiting the client signature');
    }
    if (request.status !== 'awaiting_client') {
      throw new BadRequestException('The request must be awaiting client agreement');
    }
    const latestProposal = request.proposals?.[request.proposals.length - 1];
    const approvedPlan = this.db.eventPlans.some(plan =>
      plan.requestId === request.requestId && plan.approvalStatus === 'approved',
    );
    if (latestProposal?.status !== 'accepted' && !approvedPlan) {
      throw new BadRequestException('Accept a proposal or approve the final event plan before signing');
    }
    request.agreementStatus = dto.agreementStatus;
    request.updatedAt = new Date();
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: dto.agreementStatus === 'agreed' ? 'Client Acknowledged Agreement Terms' : 'Client Declined Agreement Terms',
      performedBy: userId || 'user',
      role: role,
      timestamp: new Date(),
    });
    if (dto.agreementStatus === 'agreed') {
      this.notifyRequestOrganizer(request, `The client acknowledged the agreement terms for "${request.eventName}".`, 'agreement_acknowledged');
    } else {
      this.notifyRequestOrganizer(request, `The client declined the agreement for "${request.eventName}".`, 'agreement_declined');
    }

    return { success: true, message: `Agreement status updated to ${dto.agreementStatus}`, data: request };
  }

  /**
   * Update Payment Status (unpaid, deposit_pending, deposit_paid, fully_paid)
   */
  updatePaymentStatus(requestId: string, _dto: UpdatePaymentStatusDto, role: UserRole, userId?: string): any {
    this.findOne(requestId, role, userId);
    throw new ForbiddenException('Payment status is managed only by verified payment processing; manual status changes are not allowed');
  }

  /**
   * Confirm booking: STRICTLY requires agreementStatus === 'agreed' AND paymentStatus satisfied
   */
  confirmBooking(requestId: string, _dto: ConfirmBookingDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only organizers can confirm event bookings');
    }

    if (request.status === 'confirmed') {
      return { success: true, message: 'Booking is already confirmed', data: request };
    }

    if (request.status === 'rejected' || request.status === 'withdrawn') {
      throw new BadRequestException(`Cannot confirm a request that has been ${request.status}`);
    }
    if (request.status !== 'awaiting_client') {
      throw new BadRequestException('The client must accept the final plan before booking confirmation');
    }

    const approvedPlan = this.db.eventPlans.find(
      plan => plan.requestId === request.requestId && plan.approvalStatus === 'approved',
    );
    if (!approvedPlan) {
      throw new BadRequestException('The client must approve the final event plan before an event can be scheduled');
    }

    // Check agreement condition
    const isAgreed = request.agreementStatus === 'agreed';
    if (!isAgreed) {
      throw new BadRequestException(
        'Cannot confirm booking: Signed agreement is required before confirmation. (Agreement status: ' +
          request.agreementStatus +
          ')'
      );
    }

    // Check payment / deposit condition
    const activeProposal = request.proposals?.[request.proposals.length - 1];
    const depositRequired = activeProposal?.status === 'accepted' ? Number(activeProposal.depositRequired) : undefined;
    const isDepositSatisfied = depositRequired === 0 ||
      request.paymentStatus === 'deposit_paid' || request.paymentStatus === 'fully_paid';

    if (!isDepositSatisfied) {
      throw new BadRequestException(
        'Cannot confirm booking: Required deposit/payment must be satisfied before confirmation. (Payment status: ' +
          request.paymentStatus +
          ')'
      );
    }

    // Check date availability one more time to prevent double-booking
    const latestProposal = request.proposals?.[request.proposals.length - 1];
    const eventDate = latestProposal?.status === 'accepted'
      ? latestProposal.proposedDate || request.eventDate
      : request.eventDate;

    const avail = this.checkDateAvailability(request.organizerId, eventDate, request.requestId);
    if (!avail.available) {
      throw new ConflictException(`Cannot confirm booking for date ${eventDate}: ${avail.reason}`);
    }

    // Create Event in db.events
    const eventId = this.db.generateId('evt');
    const newEvent = {
      eventId,
      organizerId: request.organizerId,
      clientId: request.clientId,
      name: request.eventName,
      category: request.eventType || 'Event',
      date: eventDate,
      time: request.eventTime || '10:00',
      location: request.venue || '',
      capacity: request.capacity,
      ticketPrice: 0,
      status: 'ongoing' as const,
      description: request.requirements,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.events.push(newEvent);
    approvedPlan.eventId = eventId;

    request.status = 'confirmed';
    request.eventId = eventId;
    request.updatedAt = new Date();

    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      id: this.db.generateId('aud'),
      action: 'Booking Confirmed & Event Created',
      performedBy: userId || 'organizer',
      role: role,
      timestamp: new Date(),
      details: { eventId, eventDate, budget: request.budget },
    });

    // Notify client
    const client = this.db.clients.find(c => c.clientId === request.clientId);
    const clientUser = client ? this.db.findUserById(client.userId) : null;
    if (clientUser) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: clientUser.userId,
        eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `Your event booking for "${request.eventName}" has been confirmed!`,
        type: 'booking_confirmed',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      message: `Booking confirmed successfully and event ${eventId} created!`,
      data: request,
      eventId,
    };
  }

  /**
   * Client pays deposit via demo payment provider
   */
  payDeposit(requestId: string, _dto: PayDepositDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the client can pay the required deposit');
    }
    if (request.paymentStatus === 'deposit_paid' || request.paymentStatus === 'fully_paid') {
      return { success: true, message: 'Deposit has already been paid for this event request', data: request };
    }

    const activeProposal = request.proposals?.[request.proposals.length - 1];
    const depositRequired = activeProposal?.depositRequired !== undefined
      ? Number(activeProposal.depositRequired)
      : Math.round((Number(request.budget) || 25000) * 0.3);

    const now = new Date();
    const paymentId = this.db.generateId('pay-deposit');
    const payment = {
      paymentId,
      eventId: request.eventId,
      requestId: request.requestId,
      clientId: request.clientId,
      organizerId: request.organizerId,
      amount: depositRequired,
      status: 'completed' as const,
      paymentDate: now.toISOString().slice(0, 10),
      paymentMethod: 'DEMO_PROVIDER' as const,
      createdAt: now,
      updatedAt: now,
    };
    this.db.eventWorkflowPayments.push(payment);

    request.paymentStatus = 'deposit_paid';
    request.updatedAt = now;

    this.addAudit(request, 'Deposit Payment Verified via Demo Provider', userId, role, {
      paymentId,
      amount: depositRequired,
      method: 'DEMO_PROVIDER',
    });

    if (request.agreementStatus === 'agreed' && request.status !== 'confirmed') {
      try {
        this.confirmBooking(requestId, {}, UserRole.EVENT_ORGANIZER, request.organizerId);
      } catch (err) {
        // Can be confirmed by organizer action
      }
    }

    const totalAmount = Number(activeProposal?.amount || request.budget || depositRequired);
    const outstandingBalance = Math.max(0, totalAmount - depositRequired);
    const bookingId = request.eventId ? `BKG-${request.eventId.toUpperCase()}` : `BKG-${request.requestId.toUpperCase()}`;

    return {
      success: true,
      simulated: true,
      message: 'Demo deposit payment verified successfully',
      data: {
        bookingId,
        paymentId,
        amountPaid: depositRequired,
        outstandingBalance,
        totalAmount,
        paymentStatus: request.paymentStatus,
        bookingStatus: request.status,
        eventId: request.eventId,
        receipt: {
          receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
          bookingId,
          date: now.toISOString(),
          paymentMethod: 'DEMO PAYMENT PROVIDER · SIMULATED TRANSACTION',
          amountPaid: depositRequired,
          outstandingBalance,
        },
      },
    };
  }

  /**
   * Request modification for a confirmed event
   */
  requestModification(requestId: string, dto: RequestEventModificationDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    if (!['confirmed', 'planning', 'ongoing'].includes(request.status) && !request.eventId) {
      throw new BadRequestException('Modifications can only be requested for confirmed bookings');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('A reason is mandatory when requesting an event update');
    }

    const requesterRole = role === UserRole.CLIENT ? 'client' : 'organizer';
    const oldCapacity = Number(request.capacity) || 1;
    const newCapacity = dto.capacity !== undefined ? Number(dto.capacity) : oldCapacity;
    const oldBudget = Number(request.budget) || 0;

    let recalculatedCost = dto.budget !== undefined ? Number(dto.budget) : oldBudget;
    if (newCapacity !== oldCapacity && oldCapacity > 0 && oldBudget > 0) {
      recalculatedCost = Math.round((oldBudget / oldCapacity) * newCapacity);
    }

    const modId = this.db.generateId('mod');
    const now = new Date();
    const modification = {
      id: modId,
      requesterRole: requesterRole as 'client' | 'organizer',
      requesterName: requesterRole === 'client' ? 'Client' : 'Organizer',
      requesterId: userId,
      timestamp: now,
      oldValues: {
        date: request.eventDate,
        venue: request.venue,
        capacity: request.capacity,
        budget: request.budget,
        requirements: request.requirements,
      },
      newValues: {
        date: dto.date || request.eventDate,
        venue: dto.venue !== undefined ? dto.venue : request.venue,
        capacity: newCapacity,
        budget: recalculatedCost,
        requirements: dto.requirements !== undefined ? dto.requirements : request.requirements,
      },
      recalculatedCost,
      reason: dto.reason.trim(),
      status: 'pending_approval' as const,
    };

    request.eventModifications = request.eventModifications || [];
    request.eventModifications.push(modification);
    request.updatedAt = now;

    this.addAudit(request, `Event Update Requested by ${requesterRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
      modId,
      changes: modification.newValues,
      reason: dto.reason,
    });

    return {
      success: true,
      message: 'Event modification request submitted and awaiting approval',
      data: modification,
    };
  }

  /**
   * Approve or reject a confirmed event modification
   */
  respondToModification(requestId: string, modId: string, dto: RespondToEventModificationDto, role: UserRole, userId?: string): any {
    const request = this.findMutableRequest(requestId, role, userId);
    const mod = (request.eventModifications || []).find((m: any) => m.id === modId);
    if (!mod) {
      throw new NotFoundException(`Modification request ${modId} not found`);
    }
    if (mod.status !== 'pending_approval') {
      throw new BadRequestException(`Modification request is already ${mod.status}`);
    }

    const responderRole = role === UserRole.CLIENT ? 'client' : 'organizer';
    if (mod.requesterRole === responderRole) {
      throw new ForbiddenException('You cannot approve or reject your own modification request');
    }

    const now = new Date();
    if (dto.action === 'approve') {
      mod.status = 'approved';
      mod.approvedAt = now;
      mod.approvedBy = userId;

      if (mod.newValues.date) request.eventDate = mod.newValues.date;
      if (mod.newValues.venue !== undefined) request.venue = mod.newValues.venue;
      if (mod.newValues.capacity !== undefined) request.capacity = mod.newValues.capacity;
      if (mod.newValues.requirements !== undefined) request.requirements = mod.newValues.requirements;
      if (mod.recalculatedCost) request.budget = mod.recalculatedCost;

      if (request.eventId) {
        const event = this.db.events.find(e => e.eventId === request.eventId);
        if (event) {
          if (mod.newValues.date) event.date = mod.newValues.date;
          if (mod.newValues.venue !== undefined) event.location = mod.newValues.venue;
          if (mod.newValues.capacity !== undefined) event.capacity = mod.newValues.capacity;
          if (mod.newValues.requirements !== undefined) event.description = mod.newValues.requirements;
          event.updatedAt = now;
        }
      }

      request.updatedAt = now;
      this.addAudit(request, `Event Modification Approved by ${responderRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
        modId,
        approvedValues: mod.newValues,
      });
    } else {
      mod.status = 'rejected';
      mod.rejectionReason = dto.reason?.trim() || 'Modification declined by other party';
      request.updatedAt = now;

      this.addAudit(request, `Event Modification Rejected by ${responderRole === 'client' ? 'Client' : 'Organizer'}`, userId, role, {
        modId,
        reason: mod.rejectionReason,
      });
    }

    return {
      success: true,
      message: `Modification ${dto.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: request,
    };
  }

  /**
   * Generic status updater (backward compatibility)
   */
  updateStatus(requestId: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId?: string): any {
    if (dto.status === 'under_review') {
      return this.startReview(requestId, role, userId);
    }
    throw new BadRequestException('Use the dedicated request workflow action for this status transition');
  }
}
