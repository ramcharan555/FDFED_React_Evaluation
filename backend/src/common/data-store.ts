/**
 * In-memory data store for the application
 * Simulates a database without actual persistence
 * Includes all entities from the ER diagram
 */

import { UserRole, EmployeeType } from './constants';
import * as fs from 'fs';
import * as path from 'path';
import type { EventPolicy } from './event-policy';

const DATA_COLLECTIONS = [
  'users',
  'superAdmins',
  'clients',
  'organizers',
  'staffProfiles',
  'attendees',
  'events',
  'eventRequests',
  'eventPlans',
  'eventWorkflowPayments',
  'eventWorkflowRefunds',
  'eventCompletionReports',
  'clientOrganizerReviews',
  'registrations',
  'payments',
  'refunds',
  'eventChanges',
  'attendance',
  'staffAssignments',
  'eventReports',
  'staffReports',
  'financeReportSubmissions',
  'supportExecutiveReports',
  'eventReviews',
  'staffReviews',
  'notifications',
  'activityLogs',
  'supportTickets',
  'supportAttachments',
  'organizerApplications',
] as const;

type DataCollection = (typeof DATA_COLLECTIONS)[number];

const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'assignedAt',
  'dateTime',
  'timestamp',
  'requestedAt',
  'processedAt',
  'cancelledAt',
  'reservationExpiresAt',
  'offerExpiresAt',
  'resolutionEmailSentAt',
  'reviewedAt',
  'declineViewedAt',
  'submittedAt',
  'sentAt',
  'clientPolicyAcceptedAt',
  'organizerPolicyAcceptedAt',
]);

// ==================== USER ENTITIES ====================

export interface User {
  userId: string;
  name: string;
  email: string;
  password: string;
  userRole: UserRole;
  employeeType?: EmployeeType | string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  address?: string;
  phoneNo?: string;
  bio?: string;
  preferences?: { emailNotifications: boolean };
  profile?: Record<string, unknown>;
  demoScenario?: 'event-request-workflow-v1';
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ROLE-SPECIFIC ENTITIES ====================

export interface SuperAdmin {
  superAdminId: string;
  userId: string;
  email: string;
  phoneNo?: string;
  createdAt: Date;
}

export interface Client {
  clientId: string;
  userId: string;
  companyName?: string;
  demoScenario?: 'event-request-workflow-v1';
  createdAt: Date;
}

export interface EventOrganizer {
  organizerId: string;
  userId: string;
  businessName?: string;
  rating: number;
  verificationStatus?: OrganizerApplicationStatus;
  createdAt: Date;
}

export type OrganizerApplicationStatus =
  | 'Pending Verification'
  | 'Under Review'
  | 'Additional Information Required'
  | 'Approved'
  | 'Rejected'
  | 'Suspended';

export type OrganizerType =
  | 'Registered Company / Event Agency'
  | 'Independent Event Organizer';

export interface OrganizerApplicationDecision {
  decisionId: string;
  status: OrganizerApplicationStatus;
  reason?: string;
  comments?: string;
  additionalInfoRequest?: string;
  reviewerId: string;
  reviewerName?: string;
  createdAt: Date;
  emailSent?: boolean;
  emailNote?: string;
}

export interface OrganizerApplication {
  applicationId: string;
  referenceNumber: string;
  userId?: string;
  organizerType: OrganizerType;
  status: OrganizerApplicationStatus;
  fullName: string;
  email: string;
  mobileNumber: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  companyDetails?: {
    legalCompanyName: string;
    businessStructure: string;
    registrationNumber?: string;
    gstin?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    authorizedRepresentativeName: string;
    representativeDesignation: string;
    websiteUrl?: string;
    registrationCertificateDoc?: { name: string; size: number; type: string; data?: string };
    proofOfAuthorizationDoc?: { name: string; size: number; type: string; data?: string };
  };
  independentDetails?: {
    fullName: string;
    professionalName: string;
    email: string;
    mobileNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    yearsOfExperience: number;
    areasOfSpecialization: string[];
    portfolioDetails: string;
    portfolioUrl?: string;
    supportingEvidenceDoc?: { name: string; size: number; type: string; data?: string };
  };
  declarationAccepted: boolean;
  submittedAt: Date;
  updatedAt: Date;
  decisionHistory: OrganizerApplicationDecision[];
  emailNotificationLog: Array<{
    sentAt: Date;
    to: string;
    subject: string;
    status: 'sent' | 'not_configured';
    message: string;
  }>;
}

export interface EventStaff {
  staffId: string;
  userId: string;
  availableDates: string[];
  rating: number;
  status: 'available' | 'unavailable' | 'busy';
  createdAt: Date;
}

export interface Attendee {
  attendeeId: string;
  userId: string;
  createdAt: Date;
}

// ==================== EVENT ENTITIES ====================

export interface Event {
  eventId: string;
  organizerId: string;
  clientId?: string;
  superAdminId?: string;
  name: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  ticketPrice: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  city?: string;
  registrationDeadline?: string;
  cancellationDeadline?: string;
  eligibility?: string;
  waitlistEnabled?: boolean;
  preparationTasks?: EventPreparationTask[];
  /** Development-only display count used by the isolated organizer demo scenario. */
  demoRegistrationCount?: number;
  /** Development-only actionable reasons attached to the same event record. */
  attentionReasons?: string[];
  cancellationReason?: string;
  demoScenario?: 'organizer-dashboard-v3' | 'event-request-workflow-v1';
  policySnapshot?: EventPolicy;
  cancellation?: EventCancellation;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPreparationTask {
  taskId: string;
  title: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  updatedAt: Date;
}

export interface ProposalVersion {
  version: number;
  amount: number;
  depositRequired: number;
  proposedDate: string;
  validUntil: string;
  terms?: string;
  notes?: string;
  eventPlan?: string;
  timeline?: string;
  organizerFee?: number;
  itemizedCosts?: string;
  taxes?: number;
  includedServices?: string;
  excludedServices?: string;
  attendeeCapacity?: number;
  constraints?: string;
  paymentSchedule?: string;
  cancellationTerms?: string;
  conditions?: string;
  status: 'pending_client' | 'accepted' | 'revision_requested' | 'rejected' | 'expired';
  sentAt: Date;
  clientResponseAt?: Date;
  clientNotes?: string;
}

export interface RequestClarification {
  id: string;
  senderId: string;
  senderRole: string;
  senderName?: string;
  message: string;
  timestamp: Date;
}

export interface RequestAuditEntry {
  id: string;
  action: string;
  performedBy: string;
  role: string;
  timestamp: Date;
  details?: any;
}

export interface EventRequest {
  requestId: string;
  clientId: string;
  organizerId: string;
  eventName: string;
  eventType?: string;
  eventDate: string;
  eventTime?: string;
  city?: string;
  dateFlexibility?: 'exact' | 'flexible';
  budget: number;
  capacity: number;
  requirements: string;
  notes?: string;
  status: 'submitted' | 'pending' | 'under_review' | 'info_requested' | 'proposal_sent' | 'awaiting_client' | 'changes_requested' | 'counteroffer_received' | 'planning' | 'plan_submitted' | 'plan_revision_requested' | 'confirmed' | 'approved' | 'completed' | 'rejected' | 'cancelled' | 'withdrawn' | 'expired';
  agreementStatus: 'not_sent' | 'pending_signature' | 'agreed' | 'declined';
  paymentStatus: 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'fully_paid' | 'failed' | 'refunded';
  demoScenario?: 'event-request-workflow-v1';
  rejectionReason?: string;
  rejectionComments?: string;
  withdrawalReason?: string;
  policySnapshot?: EventPolicy;
  clientPolicyAcceptedAt?: Date;
  clientPolicyAcceptedBy?: string;
  organizerPolicyAcceptedAt?: Date;
  organizerPolicyAcceptedBy?: string;
  cancellation?: EventCancellation;
  currentProposalVersion?: number;
  proposals?: ProposalVersion[];
  negotiations?: Array<{
    id: string;
    action: string;
    performedBy: string;
    role: string;
    reason?: string;
    budget?: number;
    eventDate?: string;
    eventName?: string;
    eventType?: string;
    capacity?: number;
    venue?: string;
    requirements?: string;
    timestamp: Date;
  }>;
  activeEventPlanId?: string;
  planRevisionReason?: string;
  pendingPlanDocument?: {
    originalName: string;
    fileName: string;
    size: number;
  };
  venue?: string;
  clarifications?: RequestClarification[];
  auditHistory?: RequestAuditEntry[];
  eventModifications?: Array<{
    id: string;
    requesterRole: 'client' | 'organizer';
    requesterName?: string;
    requesterId?: string;
    timestamp: Date;
    oldValues: {
      date?: string;
      venue?: string;
      capacity?: number;
      budget?: number;
      requirements?: string;
    };
    newValues: {
      date?: string;
      venue?: string;
      capacity?: number;
      budget?: number;
      requirements?: string;
    };
    recalculatedCost?: number;
    reason?: string;
    status: 'pending_approval' | 'approved' | 'rejected';
    approvedAt?: Date;
    approvedBy?: string;
    rejectionReason?: string;
  }>;
  eventId?: string;
  version?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPlan {
  eventPlanId: string;
  requestId?: string;
  eventId?: string;
  clientId: string;
  organizerId: string;
  title: string;
  description: string;
  budget: number;
  capacity: number;
  schedule?: string;
  services?: string;
  arrangements?: string;
  budgetBreakdown?: string;
  documentName?: string;
  documentFileName?: string;
  documentSize?: number;
  revision?: number;
  revisionReason?: string;
  status: 'draft' | 'submitted' | 'revised' | 'approved' | 'rejected';
  approvalStatus: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  demoScenario?: 'event-request-workflow-v1';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventWorkflowPayment {
  paymentId: string;
  eventId: string;
  requestId: string;
  clientId: string;
  organizerId: string;
  amount: number;
  status: 'completed';
  paymentDate: string;
  paymentMethod: 'DEMO_PROVIDER';
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCancellation {
  reason: string;
  cancelledBy: string;
  cancelledAt: Date;
  policyVersion: string;
  paidAmount: number;
  cancellationFeePercent: number;
  cancellationFee: number;
  refundAmount: number;
  refundStatus: 'pending' | 'not_applicable';
  refundId?: string;
  cancellationDeadline: string;
}

export interface EventWorkflowRefund {
  refundId: string;
  paymentId: string;
  eventId: string;
  requestId?: string;
  clientId: string;
  organizerId: string;
  paidAmount: number;
  cancellationFee: number;
  amount: number;
  reason: string;
  status: 'pending';
  requestedAt: Date;
}

export interface EventCompletionReport {
  reportId: string;
  eventId: string;
  requestId: string;
  clientId: string;
  organizerId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  servicesProvided: string;
  expenses: string;
  completionNotes: string;
  photos: Array<{
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
  submittedAt: Date;
}

export interface ClientOrganizerReview {
  reviewId: string;
  eventId: string;
  requestId?: string;
  clientId: string;
  organizerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// ==================== REGISTRATION & PAYMENT ====================

export interface Registration {
  registrationId: string;
  attendeeId: string;
  eventId: string;
  registrationDate: string;
  status: 'pending_payment' | 'registered' | 'waitlisted' | 'cancelled' | 'rejected' | 'no-show' | 'attended';
  reviewStatus?: 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: Date;
  declineViewedAt?: Date;
  additionalInfo?: string;
  ticketType: string;
  qrCode?: string;
  verificationId?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  offerExpiresAt?: Date;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  paymentId: string;
  registrationId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  refundId: string;
  paymentId: string;
  registrationId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'not_applicable';
  reason: string;
  requestedAt: Date;
  processedAt?: Date;
  reviews?: Array<{ actorUserId: string; note: string; at: string }>;
}

export interface EventChange {
  changeId: string;
  eventId: string;
  type: 'cancelled' | 'postponed' | 'date_changed' | 'time_changed' | 'venue_changed' | 'status_changed' | 'preparation_updated' | 'details_updated';
  summary: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date;
}

// ==================== ATTENDANCE & ASSIGNMENTS ====================

export interface Attendance {
  attendanceId: string;
  attendeeId: string;
  eventId: string;
  staffId: string;
  checkInTime: string;
  status: 'checked-in' | 'checked-out' | 'no-show';
  qrCode?: string;
  verificationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffAssignment {
  assignmentId: string;
  eventId: string;
  organizerId: string;
  staffId: string;
  role?: string;
  fee?: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  assignedAt: Date;
  updatedAt: Date;
}

// ==================== REPORTS & REVIEWS ====================

export interface EventReport {
  eventReportId: string;
  organizerId: string;
  eventId: string;
  clientId?: string;
  submittedByStaffId?: string;
  reportTitle: string;
  reportDetails: string;
  submissionDate: string;
  documentName?: string;
  documentFileName?: string;
  documentMimeType?: string;
  documentSize?: number;
  status: 'draft' | 'submitted' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffReport {
  staffReportId: string;
  staffId: string;
  organizerId: string;
  eventId: string;
  reportText: string;
  status: 'draft' | 'submitted' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportExecutiveReport {
  reportId: string;
  submittedBy: string;
  sourceReference?: string;
  title: string;
  category: string;
  scope: string;
  period: string;
  summary: string;
  status: 'draft' | 'submitted' | 'reviewed';
  documentName?: string;
  documentFileName?: string;
  documentMimeType?: string;
  documentSize?: number;
  reviewFeedback?: string;
  reviewedBy?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventReview {
  reviewId: string;
  reviewerId: string; // attendeeId or clientId
  eventId: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: Date;
}

export interface StaffReview {
  reviewId: string;
  reviewerId: string; // organizerId
  staffId: string;
  eventId: string;
  rating: number;
  comment: string;
  reviewDate: string;
  createdAt: Date;
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  notificationId: string;
  userId: string;
  supportTicketId?: string;
  supportReportId?: string;
  eventId?: string;
  registrationId?: string;
  paymentId?: string;
  message: string;
  type: string;
  read: boolean;
  dateTime: Date;
  createdAt: Date;
}

// ==================== ACTIVITY LOGGING ====================

export interface ActivityLog {
  id: string;
  action: string;
  resource: string;
  role: string;
  actorUserId?: string;
  timestamp: Date;
  status: string;
  details?: any;
}

export interface SupportAttachment {
  attachmentId: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  filePath: string;
  createdAt: Date;
}

export interface SupportTicket {
  ticketId: string;
  userId: string;
  eventId?: string;
  requestType: string;
  concern: string;
  description: string;
  response?: string;
  messages?: Array<{
    sender: 'requester' | 'support';
    message: string;
    createdAt: Date;
    senderId?: string;
    senderName?: string;
  }>;
  attachments: Omit<SupportAttachment, 'userId' | 'filePath' | 'createdAt'>[];
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  resolutionEmailSentAt?: Date;
}

// ==================== DATA STORE CLASS ====================

export class DataStore {
  private static instance: DataStore;

  // User entities
  users: User[] = [];
  superAdmins: SuperAdmin[] = [];
  clients: Client[] = [];
  organizers: EventOrganizer[] = [];
  staffProfiles: EventStaff[] = [];
  attendees: Attendee[] = [];

  // Event entities
  events: Event[] = [];
  eventRequests: EventRequest[] = [];
  eventPlans: EventPlan[] = [];
  eventWorkflowPayments: EventWorkflowPayment[] = [];
  eventWorkflowRefunds: EventWorkflowRefund[] = [];
  eventCompletionReports: EventCompletionReport[] = [];
  clientOrganizerReviews: ClientOrganizerReview[] = [];

  // Registration & Payment
  registrations: Registration[] = [];
  payments: Payment[] = [];
  refunds: Refund[] = [];
  eventChanges: EventChange[] = [];

  // Attendance & Assignments
  attendance: Attendance[] = [];
  staffAssignments: StaffAssignment[] = [];

  // Reports & Reviews
  eventReports: EventReport[] = [];
  staffReports: StaffReport[] = [];
  financeReportSubmissions: Array<{
    id: string; userId: string; userName: string; title: string; summary: string;
    reportType: string; filters: Record<string, unknown>; metrics: Record<string, number>;
    rows: Record<string, unknown>[]; status: 'Submitted' | 'Reviewed';
    feedback: string; createdAt: Date; reviewedAt?: Date;
  }> = [];
  supportExecutiveReports: SupportExecutiveReport[] = [];
  eventReviews: EventReview[] = [];
  staffReviews: StaffReview[] = [];

  // Notifications
  notifications: Notification[] = [];

  // Activity logs
  activityLogs: ActivityLog[] = [];

  // Customer support
  supportTickets: SupportTicket[] = [];
  supportAttachments: SupportAttachment[] = [];

  // Organizer Applications & Verification
  organizerApplications: OrganizerApplication[] = [];

  private constructor() {
    this.initializeSeedData();
    this.restoreFromDisk();
  }

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private get persistencePath(): string {
    return process.env.EVENTFLOW_DATA_FILE || path.join(process.cwd(), 'data', 'eventflow-store.json');
  }

  private restoreFromDisk(): void {
    if (!fs.existsSync(this.persistencePath)) {
      this.persist();
      return;
    }

    const demoSeeds = {
      events: this.events.filter(event => event.eventId.startsWith('evt-demo-')),
      organizerEvents: this.events.filter(event => event.demoScenario === 'organizer-dashboard-v3'),
      organizerRequests: this.eventRequests.filter(request => request.requestId.startsWith('req-orgdash-')),
      organizerTickets: this.supportTickets.filter(ticket => ticket.ticketId === 'SUP-ORG-DEMO-001'),
      clientOrganizerReviews: this.clientOrganizerReviews,
      supportExecutiveReports: this.supportExecutiveReports,
      registrations: this.registrations.filter(registration => registration.registrationId.startsWith('reg-demo-')),
      payments: this.payments.filter(payment => payment.paymentId.startsWith('pay-demo-')),
      refunds: this.refunds.filter(refund => refund.refundId.startsWith('ref-demo-')),
      attendance: this.attendance.filter(record => record.attendanceId.startsWith('atnd-demo-')),
      notifications: this.notifications.filter(notification => notification.notificationId.startsWith('notif-demo-')),
      activityLogs: this.activityLogs.filter(log => log.id.startsWith('log-demo-')),
    };
    const parsed = JSON.parse(fs.readFileSync(this.persistencePath, 'utf8'), (key, value) => {
      if (DATE_FIELDS.has(key) && typeof value === 'string') {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new Error(`Invalid persisted date in field "${key}"`);
        return date;
      }
      return value;
    }) as Record<string, unknown>;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Invalid EventFlow data file: ${this.persistencePath}`);
    }

    for (const collection of DATA_COLLECTIONS) {
      const rows = parsed[collection];
      if (rows !== undefined && !Array.isArray(rows)) {
        throw new Error(`Invalid "${collection}" collection in ${this.persistencePath}`);
      }
      if (Array.isArray(rows)) Object.assign(this, { [collection]: rows });
    }
    if (process.env.NODE_ENV === 'production') {
      const demoRequests = this.eventRequests.filter(request =>
        request.demoScenario === 'event-request-workflow-v1' || request.requestId.startsWith('req-demo-flow-'),
      );
      const demoRequestIds = new Set(demoRequests.map(request => request.requestId));
      const demoClientIds = new Set(this.clients
        .filter(client => client.demoScenario === 'event-request-workflow-v1' || client.clientId.startsWith('cli-reqdemo-'))
        .map(client => client.clientId));
      const demoUserIds = new Set(this.clients
        .filter(client => demoClientIds.has(client.clientId))
        .map(client => client.userId));
      const originalCounts = [this.eventRequests.length, this.eventPlans.length, this.events.length, this.clients.length, this.users.length];
      this.eventRequests = this.eventRequests.filter(request => !demoRequestIds.has(request.requestId));
      this.eventPlans = this.eventPlans.filter(plan =>
        plan.demoScenario !== 'event-request-workflow-v1' && !demoRequestIds.has(plan.requestId || ''),
      );
      this.events = this.events.filter(event =>
        event.demoScenario !== 'event-request-workflow-v1' && !event.eventId.startsWith('evt-demo-flow-'),
      );
      this.clients = this.clients.filter(client => !demoClientIds.has(client.clientId));
      this.users = this.users.filter(user =>
        !demoUserIds.has(user.userId) &&
        user.demoScenario !== 'event-request-workflow-v1' &&
        !user.userId.startsWith('usr-reqdemo-client-'),
      );
      if ([this.eventRequests.length, this.eventPlans.length, this.events.length, this.clients.length, this.users.length]
        .some((count, index) => count !== originalCounts[index])) this.persist();
    }

    let reportSampleUpdated = false;
    for (const report of this.supportExecutiveReports) {
      if (report.sourceReference === 'legacy:RVR-002' && !report.documentFileName &&
        report.title === 'Duplicate Account Detection & Resolution Summary — Q2 2026') {
        const previousTitle = report.title;
        report.title = 'Account Access & Verification Summary — Q2 2026';
        if (report.summary === previousTitle) report.summary = report.title;
        reportSampleUpdated = true;
      }
    }
    if (reportSampleUpdated) this.persist();

    if (Number(parsed.supportReportSeedVersion || 0) < 1) {
      const existingIds = new Set(this.supportExecutiveReports.map(report => report.reportId));
      for (const report of demoSeeds.supportExecutiveReports) {
        if (!existingIds.has(report.reportId) && this.users.some(user => user.userId === report.submittedBy)) {
          this.supportExecutiveReports.push(report);
        }
      }
      this.persist();
    }

    if (Number(parsed.organizerReviewSeedVersion || 0) < 1) {
      for (const review of demoSeeds.clientOrganizerReviews) {
        if (
          this.events.some(event => event.eventId === review.eventId && event.organizerId === review.organizerId) &&
          this.clients.some(client => client.clientId === review.clientId) &&
          this.organizers.some(organizer => organizer.organizerId === review.organizerId) &&
          !this.clientOrganizerReviews.some(existing => existing.reviewId === review.reviewId || (existing.eventId === review.eventId && existing.clientId === review.clientId))
        ) this.clientOrganizerReviews.push(review);
      }
      this.persist();
    }

    if (Number(parsed.demoSeedVersion || 0) < 2) {
      const mergeSeedRows = <T>(existing: T[], seeds: T[], key: keyof T): T[] => {
        const existingIds = new Set(existing.map(row => row[key]));
        return [...existing, ...seeds.filter(row => !existingIds.has(row[key]))];
      };
      this.events = mergeSeedRows(this.events, demoSeeds.events, 'eventId');
      this.registrations = mergeSeedRows(this.registrations, demoSeeds.registrations, 'registrationId');
      this.payments = mergeSeedRows(this.payments, demoSeeds.payments, 'paymentId');
      this.refunds = mergeSeedRows(this.refunds, demoSeeds.refunds, 'refundId');
      this.attendance = mergeSeedRows(this.attendance, demoSeeds.attendance, 'attendanceId');
      this.notifications = mergeSeedRows(this.notifications, demoSeeds.notifications, 'notificationId');
      this.activityLogs = mergeSeedRows(this.activityLogs, demoSeeds.activityLogs, 'id');
      const legacyDemoTickets = new Set(['reg-001', 'reg-att-001-checked-in', 'reg-att-201', 'reg-att-203-seat']);
      for (const registration of this.registrations) {
        if (
          (registration.registrationId.startsWith('reg-demo-') || legacyDemoTickets.has(registration.registrationId)) &&
          ['registered', 'attended'].includes(registration.status) &&
          registration.verificationId
        ) {
          registration.qrCode = registration.verificationId;
        }
      }
      this.persist();
    }
    if (Number(parsed.organizerDashboardSeedVersion || 0) < 4 && demoSeeds.organizerEvents.length) {
      const eventIds = new Set(demoSeeds.organizerEvents.map(event => event.eventId));
      this.events = [...this.events.filter(event => !eventIds.has(event.eventId)), ...demoSeeds.organizerEvents];
      this.eventRequests = [...this.eventRequests.filter(request => !request.requestId.startsWith('req-orgdash-')), ...demoSeeds.organizerRequests];
      this.supportTickets = [...this.supportTickets.filter(ticket => ticket.ticketId !== 'SUP-ORG-DEMO-001'), ...demoSeeds.organizerTickets];
      this.persist();
    }
    // Demo records deliberately move with the current date so development dashboards
    // do not slowly turn all seeded upcoming events into historical records.
    if (process.env.NODE_ENV !== 'production') {
      this.applyOrganizerDashboardDemoScenario();
      this.applyEventRequestDemoScenario();
      this.persist();
    }
  }

  persist(): void {
    const directory = path.dirname(this.persistencePath);
    fs.mkdirSync(directory, { recursive: true });
    const snapshot: Partial<Record<DataCollection, unknown>> = {};
    for (const collection of DATA_COLLECTIONS) snapshot[collection] = this[collection];
    Object.assign(snapshot, { demoSeedVersion: 2, organizerDashboardSeedVersion: 4, organizerReviewSeedVersion: 1, supportReportSeedVersion: 1 });

    const temporaryPath = `${this.persistencePath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(snapshot, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporaryPath, this.persistencePath);
  }

  private initializeSeedData(): void {
    // ==================== DEMO USERS ====================
    this.users = [
      {
        userId: 'usr-admin-001',
        name: 'Alex Johnson',
        email: 'superadmin@example.com',
        password: 'Admin@123',
        userRole: UserRole.SUPER_ADMIN,
        status: 'active',
        phoneNo: '9876543210',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        userId: 'usr-client-001',
        name: 'Michael Torres',
        email: 'client@example.com',
        password: 'Client@123',
        userRole: UserRole.CLIENT,
        status: 'active',
        phoneNo: '8765432109',
        address: '123 Tech Park, Bangalore',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      },
      {
        userId: 'usr-org-001',
        name: 'Sarah Chen',
        email: 'organizer@example.com',
        password: 'Organizer@123',
        userRole: UserRole.EVENT_ORGANIZER,
        status: 'active',
        phoneNo: '6543210987',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        userId: 'usr-emp-001',
        name: 'Marcus Vance',
        email: 'employee@example.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_EXECUTIVE,
        status: 'active',
        phoneNo: '9876543220',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        userId: 'usr-emp-001b',
        name: 'Marcus Vance',
        email: 'employee@eventflow.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_EXECUTIVE,
        status: 'active',
        phoneNo: '9876543220',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        userId: 'usr-emp-001c',
        name: 'Marcus Vance',
        email: 'marcus.ops@eventflow.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_FINANCE,
        status: 'active',
        phoneNo: '9876543220',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        userId: 'usr-emp-002',
        name: 'Elena Rostova',
        email: 'elena.coordinator@eventflow.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_EXECUTIVE,
        status: 'active',
        phoneNo: '9876543221',
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-12'),
      },
      {
        userId: 'usr-emp-003',
        name: 'Arjun Kapoor',
        email: 'arjun.events@eventflow.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_EXECUTIVE,
        status: 'active',
        phoneNo: '9876543222',
        createdAt: new Date('2024-03-08'),
        updatedAt: new Date('2024-03-08'),
      },
      {
        userId: 'usr-emp-004',
        name: 'Maya Lin',
        email: 'maya.ops@eventflow.com',
        password: 'Employee@123',
        userRole: UserRole.EVENT_STAFF,
        employeeType: EmployeeType.SUPPORT_FINANCE,
        status: 'active',
        phoneNo: '9876543223',
        createdAt: new Date('2024-03-22'),
        updatedAt: new Date('2024-03-22'),
      },
            {
        userId: 'usr-staff-001',
        name: 'James Wilson',
        email: 'staff@example.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678902',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        userId: 'usr-staff-002',
        name: 'David Kim',
        email: 'david@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678903',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      },
      {
        userId: 'usr-staff-003',
        name: 'Nina Lopez',
        email: 'nina@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678904',
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-03-20'),
      },
      {
        userId: 'usr-staff-004',
        name: 'Ananya Verma',
        email: 'ananya@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678905',
        createdAt: new Date('2024-04-10'),
        updatedAt: new Date('2024-04-10'),
      },
      {
        userId: 'usr-staff-005',
        name: 'Marcus Brody',
        email: 'marcus@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678906',
        createdAt: new Date('2024-04-18'),
        updatedAt: new Date('2024-04-18'),
      },
      {
        userId: 'usr-staff-006',
        name: 'Sophie Dubois',
        email: 'sophie@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678907',
        createdAt: new Date('2024-05-02'),
        updatedAt: new Date('2024-05-02'),
      },
      {
        userId: 'usr-staff-007',
        name: 'Rahul Sengupta',
        email: 'rahul.s@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678908',
        createdAt: new Date('2024-05-15'),
        updatedAt: new Date('2024-05-15'),
      },
      {
        userId: 'usr-staff-008',
        name: 'Elena Rostova',
        email: 'elena@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'inactive',
        phoneNo: '7345678909',
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-01'),
      },
      {
        userId: 'usr-staff-009',
        name: 'Karthik Nair',
        email: 'karthik.n@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'active',
        phoneNo: '7345678910',
        createdAt: new Date('2024-06-12'),
        updatedAt: new Date('2024-06-12'),
      },
      {
        userId: 'usr-staff-010',
        name: 'Zoe Martinez',
        email: 'zoe@eventflow.com',
        password: 'Staff@123',
        userRole: UserRole.EVENT_STAFF,
        status: 'inactive',
        phoneNo: '7345678911',
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-01'),
      },
      {
        userId: 'usr-attendee-001',
        name: 'Priya Patel',
        email: 'attendee@example.com',
        password: 'Attendee@123',
        userRole: UserRole.ATTENDEE,
        status: 'active',
        phoneNo: '8678901235',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
      {
        userId: 'usr-attendee-002',
        name: 'Rohan Mehta',
        email: 'rohan.attendee@example.com',
        password: 'Attendee@123',
        userRole: UserRole.ATTENDEE,
        status: 'active',
        phoneNo: '8678901236',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
      },
    ];

    // ==================== ROLE-SPECIFIC PROFILES ====================
    this.superAdmins = [
      {
        superAdminId: 'sa-001',
        userId: 'usr-admin-001',
        email: 'superadmin@example.com',
        phoneNo: '9876543210',
        createdAt: new Date('2024-01-01'),
      },
    ];

    this.clients = [
      {
        clientId: 'cli-001',
        userId: 'usr-client-001',
        companyName: 'Torres Tech Solutions',
        createdAt: new Date('2024-01-05'),
      },
    ];

    this.organizers = [
      {
        organizerId: 'org-001',
        userId: 'usr-org-001',
        businessName: 'Chen Elite Events',
        rating: 4.9,
        createdAt: new Date('2024-01-10'),
      },
      {
        organizerId: 'org-002',
        userId: 'usr-emp-001',
        businessName: 'Vance Operations & Conference Management',
        rating: 4.9,
        createdAt: new Date('2024-01-18'),
      },
      {
        organizerId: 'org-003',
        userId: 'usr-emp-002',
        businessName: 'Rostova Gala & Wedding Coordinators',
        rating: 4.8,
        createdAt: new Date('2024-02-12'),
      },
      {
        organizerId: 'org-004',
        userId: 'usr-emp-003',
        businessName: 'Kapoor Festival & Stage Productions',
        rating: 4.9,
        createdAt: new Date('2024-03-08'),
      },
      {
        organizerId: 'org-005',
        userId: 'usr-emp-004',
        businessName: 'Maya Event Logistics',
        rating: 4.7,
        createdAt: new Date('2024-03-22'),
      },
    ];

        this.staffProfiles = [
      {
        staffId: 'staff-emp-001',
        userId: 'usr-emp-001',
        availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-01-18'),
      },
      {
        staffId: 'staff-emp-001b',
        userId: 'usr-emp-001b',
        availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-01-18'),
      },
      {
        staffId: 'staff-emp-001c',
        userId: 'usr-emp-001c',
        availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-01-18'),
      },
      {
        staffId: 'staff-emp-002',
        userId: 'usr-emp-002',
        availableDates: ['2026-06-15', '2026-07-20'],
        rating: 4.8,
        status: 'available',
        createdAt: new Date('2024-02-12'),
      },
      {
        staffId: 'staff-emp-003',
        userId: 'usr-emp-003',
        availableDates: ['2026-06-15', '2026-07-20'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-03-08'),
      },
      {
        staffId: 'staff-emp-004',
        userId: 'usr-emp-004',
        availableDates: ['2026-06-15', '2026-07-20'],
        rating: 4.7,
        status: 'available',
        createdAt: new Date('2024-03-22'),
      },
      {
        staffId: 'staff-001',
        userId: 'usr-staff-001',
        availableDates: ['2026-06-15', '2026-07-20', '2026-08-01'],
        rating: 4.8,
        status: 'available',
        createdAt: new Date('2024-01-15'),
      },
      {
        staffId: 'staff-002',
        userId: 'usr-staff-002',
        availableDates: ['2026-06-15', '2026-07-10'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-03-01'),
      },
      {
        staffId: 'staff-003',
        userId: 'usr-staff-003',
        availableDates: ['2026-06-20', '2026-08-05'],
        rating: 4.7,
        status: 'available',
        createdAt: new Date('2024-03-20'),
      },
      {
        staffId: 'staff-004',
        userId: 'usr-staff-004',
        availableDates: ['2026-06-15', '2026-07-25'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-04-10'),
      },
      {
        staffId: 'staff-005',
        userId: 'usr-staff-005',
        availableDates: ['2026-07-01', '2026-08-15'],
        rating: 4.6,
        status: 'available',
        createdAt: new Date('2024-04-18'),
      },
      {
        staffId: 'staff-006',
        userId: 'usr-staff-006',
        availableDates: ['2026-06-15', '2026-07-20'],
        rating: 4.8,
        status: 'available',
        createdAt: new Date('2024-05-02'),
      },
      {
        staffId: 'staff-007',
        userId: 'usr-staff-007',
        availableDates: ['2026-06-15', '2026-08-10'],
        rating: 4.7,
        status: 'available',
        createdAt: new Date('2024-05-15'),
      },
      {
        staffId: 'staff-008',
        userId: 'usr-staff-008',
        availableDates: [],
        rating: 4.5,
        status: 'unavailable',
        createdAt: new Date('2024-06-01'),
      },
      {
        staffId: 'staff-009',
        userId: 'usr-staff-009',
        availableDates: ['2026-06-15', '2026-07-15', '2026-08-20'],
        rating: 4.9,
        status: 'available',
        createdAt: new Date('2024-06-12'),
      },
      {
        staffId: 'staff-010',
        userId: 'usr-staff-010',
        availableDates: [],
        rating: 4.4,
        status: 'unavailable',
        createdAt: new Date('2024-07-01'),
      },
    ];

    this.attendees = [
      {
        attendeeId: 'att-001',
        userId: 'usr-attendee-001',
        createdAt: new Date('2024-02-01'),
      },
      {
        attendeeId: 'att-002',
        userId: 'usr-attendee-002',
        createdAt: new Date('2024-02-01'),
      },
    ];

    // ==================== EVENTS (Managed by Sarah Chen) ====================
    this.events = [
      {
        eventId: 'evt-emp-101',
        organizerId: 'org-002',
        clientId: 'cli-001',
        name: 'Global AI & Cloud Summit 2026',
        category: 'Technology',
        date: '2026-06-15',
        time: '09:00 AM',
        location: 'Grand Convention Center, Hall A, Bangalore',
        capacity: 600,
        ticketPrice: 1500,
        status: 'completed',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        description: 'Flagship enterprise summit on Generative AI, Cloud Infrastructure, and Agentic Workflows managed by Marcus Vance.',
        city: 'Bangalore',
      },
      {
        eventId: 'evt-emp-102',
        organizerId: 'org-002',
        clientId: 'cli-001',
        name: 'FinTech Leaders Executive Conclave',
        category: 'Finance',
        date: '2026-06-22',
        time: '05:30 PM',
        location: 'The Leela Palace Ballroom, Mumbai',
        capacity: 250,
        ticketPrice: 2500,
        status: 'completed',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
        description: 'Exclusive executive dinner and keynote sessions for digital banking and FinTech innovators.',
        city: 'Mumbai',
      },
      {
        eventId: 'evt-emp-103',
        organizerId: 'org-002',
        name: 'Cybersecurity & Zero Trust Workshop',
        category: 'Technology',
        date: '2026-07-05',
        time: '10:00 AM',
        location: 'Cyber Towers — Tech Room 3, Hyderabad',
        capacity: 80,
        ticketPrice: 800,
        status: 'published',
        createdAt: new Date('2024-02-18'),
        updatedAt: new Date('2024-02-18'),
        description: 'Hands-on live simulation on threat modeling, Zero Trust architecture, and cloud security.',
        city: 'Hyderabad',
      },
      {
        eventId: 'evt-emp-104',
        organizerId: 'org-002',
        name: 'National Web3 & AI Hackathon 2026',
        category: 'Technology',
        date: '2026-07-18',
        time: '08:00 AM',
        location: 'Innovation Arena, HITEC City, Chennai',
        capacity: 400,
        ticketPrice: 0,
        status: 'published',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
        description: '36-hour national developer hackathon with ?50K in prize bounties for open source AI agents.',
        city: 'Chennai',
      },
      {
        eventId: 'evt-001',
        organizerId: 'org-001',
        clientId: 'cli-001',
        name: 'Global AI Summit 2024',
        category: 'Technology',
        date: '2024-06-15',
        time: '09:00 AM',
        location: 'Grand Ballroom, Chennai',
        capacity: 500,
        ticketPrice: 1500,
        status: 'published',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        description: 'Join Sarah Chen for the biggest AI summit of the year. Featuring speakers from Google, Meta, and OpenAI.',
        city: 'Chennai',
      },
      {
        eventId: 'evt-002',
        organizerId: 'org-001',
        name: 'Yoga & Wellness Retreat 2024',
        category: 'Health',
        date: '2024-07-20',
        time: '07:00 AM',
        location: 'Zen Gardens, Bangalore',
        capacity: 100,
        ticketPrice: 500,
        status: 'published',
        createdAt: new Date('2024-01-21'),
        updatedAt: new Date('2024-01-21'),
        description: 'A relaxing weekend retreat focusing on mental health and physical well-being.',
        city: 'Bangalore',
      },
      {
        eventId: 'evt-003',
        organizerId: 'org-001',
        name: 'Future of Fintech',
        category: 'Finance',
        date: '2026-08-10',
        time: '10:00 AM',
        location: 'ITC Gardenia, Bangalore',
        capacity: 250,
        ticketPrice: 1200,
        status: 'draft',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
        description: 'Exploring the intersection of technology and finance in the modern era.',
        city: 'Bangalore',
      },
      {
        eventId: 'evt-att-201', organizerId: 'org-001', name: 'India Product Design Conference 2027', category: 'Design',
        date: '2027-02-18', time: '09:30 AM', location: 'BIEC Conference Hall, Bangalore', capacity: 300, ticketPrice: 1200,
        status: 'published', description: 'A practical conference for product designers, researchers, and design engineers.', city: 'Bangalore',
        registrationDeadline: '2027-02-15', cancellationDeadline: '2027-02-10', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-01'), updatedAt: new Date('2026-10-05'),
      },
      {
        eventId: 'evt-att-202', organizerId: 'org-001', name: 'Cloud Native Engineering Workshop', category: 'Technology',
        date: '2027-03-06', time: '10:00 AM', location: 'Tidel Park Learning Centre, Chennai', capacity: 80, ticketPrice: 750,
        status: 'published', description: 'Hands-on Kubernetes, observability, and production reliability workshop.', city: 'Chennai',
        registrationDeadline: '2027-03-03', cancellationDeadline: '2027-02-27', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-10'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-att-203', organizerId: 'org-001', name: 'Community Tech Meetup & Demo Night', category: 'Networking',
        date: '2027-03-20', time: '05:30 PM', location: 'Innovation Hub, Hyderabad', capacity: 1, ticketPrice: 0,
        status: 'published', description: 'An evening of community demos, lightning talks, and peer networking.', city: 'Hyderabad',
        registrationDeadline: '2027-03-19', cancellationDeadline: '2027-03-18', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-15'), updatedAt: new Date('2026-10-12'),
      },
      {
        eventId: 'evt-att-204', organizerId: 'org-001', name: 'Autumn Creator Expo 2026', category: 'Creative',
        date: '2026-11-28', time: '11:00 AM', location: 'Pragati Maidan, New Delhi', capacity: 450, ticketPrice: 900,
        status: 'cancelled', description: 'A creator showcase cancelled by the organizer due to venue maintenance.', city: 'Delhi NCR',
        registrationDeadline: '2026-11-24', cancellationDeadline: '2026-11-20', eligibility: 'Open to all active attendees', waitlistEnabled: false,
        createdAt: new Date('2026-08-20'), updatedAt: new Date('2026-10-08'),
      },
      {
        eventId: 'evt-att-205', organizerId: 'org-001', name: 'Open Source Community Day 2027', category: 'Technology',
        date: '2027-04-10', time: '09:00 AM', location: 'Nehru Centre, Mumbai', capacity: 500, ticketPrice: 0,
        status: 'published', description: 'A free community event with maintainers, contributors, and beginner-friendly workshops.', city: 'Mumbai',
        registrationDeadline: '2027-04-08', cancellationDeadline: '2027-04-06', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-12'),
      },
      {
        eventId: 'evt-demo-301', organizerId: 'org-001', clientId: 'cli-001', name: 'AI Product & Cloud Summit', category: 'Technology',
        date: '2026-11-12', time: '09:00 AM', location: 'Bangalore International Centre, Bangalore', capacity: 500, ticketPrice: 1800,
        status: 'published', description: 'Product and engineering leaders explore practical AI, cloud platforms, and responsible deployment.', city: 'Bangalore',
        registrationDeadline: '2026-11-09', cancellationDeadline: '2026-11-05', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-20'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-302', organizerId: 'org-002', name: 'Indie Game Showcase', category: 'Entertainment',
        date: '2026-11-21', time: '11:00 AM', location: 'The Box Studio, Chennai', capacity: 180, ticketPrice: 0,
        status: 'published', description: 'A free showcase of independent games, playable prototypes, and talks from local studios.', city: 'Chennai',
        registrationDeadline: '2026-11-20', cancellationDeadline: '2026-11-19', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-22'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-303', organizerId: 'org-001', name: 'Sustainable Food & Farm Festival', category: 'Food & Drink',
        date: '2026-12-05', time: '10:00 AM', location: 'Hitex Exhibition Grounds, Hyderabad', capacity: 250, ticketPrice: 450,
        status: 'published', description: 'Meet regional growers and chefs for tastings, demonstrations, and conversations about sustainable food.', city: 'Hyderabad',
        registrationDeadline: '2026-12-02', cancellationDeadline: '2026-11-28', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-24'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-304', organizerId: 'org-001', name: 'Mumbai Street Photography Walk', category: 'Arts & Culture',
        date: '2026-12-19', time: '07:00 AM', location: 'Kala Ghoda Arts District, Mumbai', capacity: 1, ticketPrice: 0,
        status: 'published', description: 'A small-group photo walk with a local photographer, composition tips, and a post-walk review.', city: 'Mumbai',
        registrationDeadline: '2026-12-17', cancellationDeadline: '2026-12-15', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-26'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-305', organizerId: 'org-002', clientId: 'cli-001', name: 'Startup Finance & Funding Forum', category: 'Finance',
        date: '2027-01-16', time: '09:30 AM', location: 'The Lalit, New Delhi', capacity: 200, ticketPrice: 950,
        status: 'published', description: 'Founders and investors discuss fundraising, cash-flow planning, and sustainable growth.', city: 'New Delhi',
        registrationDeadline: '2027-01-13', cancellationDeadline: '2027-01-09', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-09-28'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-306', organizerId: 'org-001', name: 'Coastal Wellness & Yoga Weekend', category: 'Health & Wellness',
        date: '2027-01-30', time: '07:30 AM', location: 'Ashvem Beach Retreat, Goa', capacity: 75, ticketPrice: 1200,
        status: 'published', description: 'A guided weekend of yoga, breathwork, and restorative sessions by the coast.', city: 'Goa',
        registrationDeadline: '2027-01-25', cancellationDeadline: '2027-01-20', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-01'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-307', organizerId: 'org-001', name: 'Design Systems Exchange', category: 'Design',
        date: '2027-02-14', time: '10:00 AM', location: 'Bangalore International Centre, Bangalore', capacity: 140, ticketPrice: 600,
        status: 'published', description: 'Design and frontend teams share approaches to accessible, scalable design systems.', city: 'Bangalore',
        registrationDeadline: '2027-02-11', cancellationDeadline: '2027-02-07', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-02'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-308', organizerId: 'org-002', name: 'Open Data for Good Hackathon', category: 'Technology',
        date: '2027-03-06', time: '08:30 AM', location: 'Pune Knowledge Cluster, Pune', capacity: 100, ticketPrice: 0,
        status: 'published', description: 'A weekend build event using public datasets to prototype useful civic and community tools.', city: 'Pune',
        registrationDeadline: '2027-03-03', cancellationDeadline: '2027-02-28', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-03'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-309', organizerId: 'org-001', name: 'Kochi Coastal Music Festival', category: 'Music',
        date: '2027-03-27', time: '04:00 PM', location: 'Bolgatty Palace Grounds, Kochi', capacity: 1000, ticketPrice: 1500,
        status: 'published', description: 'An outdoor festival featuring independent artists, regional music, and local food vendors.', city: 'Kochi',
        registrationDeadline: '2027-03-22', cancellationDeadline: '2027-03-15', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-04'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-310', organizerId: 'org-002', clientId: 'cli-001', name: 'Future of Learning Expo', category: 'Education',
        date: '2027-04-17', time: '09:00 AM', location: 'Hitex Exhibition Grounds, Hyderabad', capacity: 400, ticketPrice: 0,
        status: 'published', description: 'Educators and learning teams explore accessible technology, new teaching models, and skills development.', city: 'Hyderabad',
        registrationDeadline: '2027-04-14', cancellationDeadline: '2027-04-10', eligibility: 'Open to all active attendees', waitlistEnabled: true,
        createdAt: new Date('2026-10-05'), updatedAt: new Date('2026-10-10'),
      },
      {
        eventId: 'evt-demo-311', organizerId: 'org-001', name: 'Mumbai Winter Makers Market', category: 'Arts & Culture',
        date: '2026-01-18', time: '11:00 AM', location: 'Jio World Drive, Mumbai', capacity: 90, ticketPrice: 300,
        status: 'completed', description: 'A community market for independent makers, print artists, and small design studios.', city: 'Mumbai',
        createdAt: new Date('2025-11-10'), updatedAt: new Date('2026-01-20'),
      },
      {
        eventId: 'evt-demo-312', organizerId: 'org-002', clientId: 'cli-001', name: 'Product Leadership Roundtable', category: 'Business',
        date: '2026-05-23', time: '02:00 PM', location: 'The Residency Towers, Chennai', capacity: 45, ticketPrice: 2200,
        status: 'completed', description: 'A peer roundtable for product leaders on portfolio strategy, team growth, and customer discovery.', city: 'Chennai',
        createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-05-25'),
      },
    ];

    this.eventChanges = [
      { changeId: 'chg-att-001', eventId: 'evt-att-201', type: 'venue_changed', summary: 'Venue updated to BIEC Conference Hall, Bangalore', previousValue: 'Design Centre Auditorium, Bangalore', newValue: 'BIEC Conference Hall, Bangalore', createdAt: new Date('2026-10-05T09:30:00Z') },
      { changeId: 'chg-att-002', eventId: 'evt-att-204', type: 'cancelled', summary: 'Event cancelled because the venue is unavailable', createdAt: new Date('2026-10-08T11:00:00Z') },
    ];

    // ==================== EVENT REQUESTS (Michael Torres -> Sarah Chen) ====================
    this.eventRequests = [
      {
        requestId: 'req-emp-101',
        clientId: 'cli-001',
        organizerId: 'org-002',
        eventName: 'Torres Tech Q3 Product Launch',
        eventDate: '2026-06-01',
        budget: 35000,
        capacity: 350,
        requirements: 'Global launch for next-gen enterprise suite. Require 4K live streaming, stage AV, VIP catering, and 5 photographers.',
        status: 'submitted',
        agreementStatus: 'not_sent',
        paymentStatus: 'unpaid',
        proposals: [],
        clarifications: [],
        auditHistory: [
          { id: 'aud-001', action: 'Request Submitted', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-20') },
        ],
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-03-20'),
      },
      {
        requestId: 'req-emp-102',
        clientId: 'cli-001',
        organizerId: 'org-002',
        eventName: 'Annual Leadership Strategy Retreat',
        eventDate: '2026-06-15',
        budget: 18000,
        capacity: 120,
        requirements: 'Annual executive team retreat with breakout workshop sessions, keynote speaker, and outdoor networking dinner.',
        status: 'confirmed',
        agreementStatus: 'agreed',
        paymentStatus: 'deposit_paid',
        proposals: [
          {
            version: 1,
            amount: 18000,
            depositRequired: 5000,
            proposedDate: '2026-06-15',
            validUntil: '2026-06-01',
            terms: 'Full retreat coordination and catering included.',
            status: 'accepted',
            sentAt: new Date('2024-03-15'),
            clientResponseAt: new Date('2024-03-16'),
          },
        ],
        clarifications: [],
        auditHistory: [
          { id: 'aud-002', action: 'Request Submitted', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-15') },
          { id: 'aud-003', action: 'Proposal Sent (v1)', performedBy: 'org-002', role: 'event_organizer', timestamp: new Date('2024-03-15') },
          { id: 'aud-004', action: 'Proposal Accepted by Client', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-16') },
          { id: 'aud-005', action: 'Agreement Signed', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-17') },
          { id: 'aud-006', action: 'Deposit Payment Confirmed', performedBy: 'org-002', role: 'event_organizer', timestamp: new Date('2024-03-18') },
          { id: 'aud-007', action: 'Booking Confirmed', performedBy: 'org-002', role: 'event_organizer', timestamp: new Date('2024-03-18') },
        ],
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-18'),
      },
      {
        requestId: 'req-001',
        clientId: 'cli-001',
        organizerId: 'org-001',
        eventName: 'Tech Product Launch',
        eventDate: '2026-09-05',
        budget: 75000,
        capacity: 300,
        requirements: 'Need premium stage setup, 4K streaming, and high-end catering for 300 guests.',
        status: 'under_review',
        agreementStatus: 'not_sent',
        paymentStatus: 'unpaid',
        proposals: [],
        clarifications: [
          { id: 'clr-001', senderId: 'usr-org-001', senderRole: 'organizer', senderName: 'Sarah Chen', message: 'Do you require special staging for physical hardware demos?', timestamp: new Date('2024-03-02') },
          { id: 'clr-002', senderId: 'usr-client-001', senderRole: 'client', senderName: 'Michael Torres', message: 'Yes, we will have two demo pedestals with direct power.', timestamp: new Date('2024-03-03') },
        ],
        auditHistory: [
          { id: 'aud-008', action: 'Request Submitted', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-01') },
          { id: 'aud-009', action: 'Review Started', performedBy: 'usr-org-001', role: 'event_organizer', timestamp: new Date('2024-03-02') },
          { id: 'aud-010', action: 'Clarification Requested', performedBy: 'usr-org-001', role: 'event_organizer', timestamp: new Date('2024-03-02') },
          { id: 'aud-011', action: 'Clarification Provided', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-03-03') },
        ],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-03'),
      },
      {
        requestId: 'req-002',
        clientId: 'cli-001',
        organizerId: 'org-001',
        eventName: 'Corporate Anniversary',
        eventDate: '2026-10-15',
        budget: 50000,
        capacity: 200,
        requirements: 'Elegant gala dinner with live jazz band and awards ceremony.',
        status: 'confirmed',
        agreementStatus: 'agreed',
        paymentStatus: 'deposit_paid',
        proposals: [
          {
            version: 1,
            amount: 50000,
            depositRequired: 15000,
            proposedDate: '2026-10-15',
            validUntil: '2026-09-01',
            terms: 'Includes live music coordination, 5-course dinner, awards stage, and lighting.',
            status: 'accepted',
            sentAt: new Date('2024-02-10'),
            clientResponseAt: new Date('2024-02-11'),
          },
        ],
        clarifications: [],
        auditHistory: [
          { id: 'aud-012', action: 'Request Submitted', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-02-10') },
          { id: 'aud-013', action: 'Proposal Sent (v1)', performedBy: 'usr-org-001', role: 'event_organizer', timestamp: new Date('2024-02-10') },
          { id: 'aud-014', action: 'Proposal Accepted by Client', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-02-11') },
          { id: 'aud-015', action: 'Agreement Signed', performedBy: 'usr-client-001', role: 'client', timestamp: new Date('2024-02-12') },
          { id: 'aud-016', action: 'Deposit Payment Confirmed', performedBy: 'usr-org-001', role: 'event_organizer', timestamp: new Date('2024-02-12') },
          { id: 'aud-017', action: 'Booking Confirmed', performedBy: 'usr-org-001', role: 'event_organizer', timestamp: new Date('2024-02-12') },
        ],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-12'),
      },
    ];

    // ==================== EVENT PLANS ====================
    this.eventPlans = [
      {
        eventPlanId: 'plan-001',
        eventId: 'evt-001',
        clientId: 'cli-001',
        organizerId: 'org-001',
        title: 'Global AI Summit - Detailed Execution Plan',
        description: 'Comprehensive logistics, speaker lineup, and marketing strategy.',
        budget: 100000,
        capacity: 500,
        status: 'approved',
        approvalStatus: 'approved',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-27'),
      },
    ];

    // ==================== REGISTRATIONS (Priya Patel -> Global AI Summit) ====================
    this.registrations = [
      {
        registrationId: 'reg-001',
        attendeeId: 'att-001',
        eventId: 'evt-001',
        registrationDate: '2024-06-01',
        status: 'attended',
        ticketType: 'VIP Pass',
        qrCode: 'V-PRIYA-001',
        verificationId: 'V-PRIYA-001',
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        registrationId: 'reg-att-001-checked-in',
        attendeeId: 'att-002',
        eventId: 'evt-001',
        registrationDate: '2024-06-02',
        status: 'attended',
        ticketType: 'General Admission',
        qrCode: 'V-ROHAN-001',
        verificationId: 'V-ROHAN-001',
        createdAt: new Date('2024-06-02'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        registrationId: 'reg-att-002-no-show',
        attendeeId: 'att-001',
        eventId: 'evt-002',
        registrationDate: '2024-07-01',
        status: 'no-show',
        ticketType: 'Retreat Pass',
        verificationId: 'V-ATT-002-NOSHOW',
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-21'),
      },
      {
        registrationId: 'reg-att-201', attendeeId: 'att-001', eventId: 'evt-att-201', registrationDate: '2026-09-20',
        status: 'registered', ticketType: 'General Admission', qrCode: 'V-ATT-201-PRIYA', verificationId: 'V-ATT-201-PRIYA',
        createdAt: new Date('2026-09-20T08:30:00Z'), updatedAt: new Date('2026-09-20T08:32:00Z'),
      },
      {
        registrationId: 'reg-att-202', attendeeId: 'att-001', eventId: 'evt-att-202', registrationDate: '2026-10-12',
        status: 'pending_payment', ticketType: 'Workshop Pass', reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date('2026-10-12T10:00:00Z'), updatedAt: new Date('2026-10-12T10:00:00Z'),
      },
      {
        registrationId: 'reg-att-203', attendeeId: 'att-001', eventId: 'evt-att-203', registrationDate: '2026-10-13',
        status: 'waitlisted', ticketType: 'Community Pass',
        createdAt: new Date('2026-10-13T09:00:00Z'), updatedAt: new Date('2026-10-14T07:00:00Z'),
      },
      {
        registrationId: 'reg-att-203-seat', attendeeId: 'att-002', eventId: 'evt-att-203', registrationDate: '2026-10-11',
        status: 'registered', ticketType: 'Community Pass', qrCode: 'V-ATT-203-SEAT', verificationId: 'V-ATT-203-SEAT',
        createdAt: new Date('2026-10-11T08:00:00Z'), updatedAt: new Date('2026-10-11T08:00:00Z'),
      },
      {
        registrationId: 'reg-att-204', attendeeId: 'att-001', eventId: 'evt-att-204', registrationDate: '2026-09-02',
        status: 'cancelled', ticketType: 'General Admission', cancellationReason: 'Event cancelled by organizer', cancelledAt: new Date('2026-10-08T11:00:00Z'),
        createdAt: new Date('2026-09-02T12:00:00Z'), updatedAt: new Date('2026-10-08T11:00:00Z'),
      },
      {
        registrationId: 'reg-demo-301', attendeeId: 'att-001', eventId: 'evt-demo-301', registrationDate: '2026-10-02',
        status: 'registered', ticketType: 'General Admission', qrCode: 'DEMO-TICKET-301-PRIYA', verificationId: 'DEMO-TICKET-301-PRIYA',
        createdAt: new Date('2026-10-02T08:30:00Z'), updatedAt: new Date('2026-10-02T08:31:00Z'),
      },
      {
        registrationId: 'reg-demo-302', attendeeId: 'att-002', eventId: 'evt-demo-302', registrationDate: '2026-10-03',
        status: 'registered', ticketType: 'Community Pass', qrCode: 'DEMO-TICKET-302-ROHAN', verificationId: 'DEMO-TICKET-302-ROHAN',
        createdAt: new Date('2026-10-03T09:15:00Z'), updatedAt: new Date('2026-10-03T09:15:00Z'),
      },
      {
        registrationId: 'reg-demo-303', attendeeId: 'att-001', eventId: 'evt-demo-303', registrationDate: '2026-10-10',
        status: 'pending_payment', ticketType: 'Festival Pass', reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date('2026-10-10T11:00:00Z'), updatedAt: new Date('2026-10-10T11:00:00Z'),
      },
      {
        registrationId: 'reg-demo-304-seat', attendeeId: 'att-002', eventId: 'evt-demo-304', registrationDate: '2026-10-04',
        status: 'registered', ticketType: 'Photo Walk Pass', qrCode: 'DEMO-TICKET-304-ROHAN', verificationId: 'DEMO-TICKET-304-ROHAN',
        createdAt: new Date('2026-10-04T07:00:00Z'), updatedAt: new Date('2026-10-04T07:00:00Z'),
      },
      {
        registrationId: 'reg-demo-304-wait', attendeeId: 'att-001', eventId: 'evt-demo-304', registrationDate: '2026-10-05',
        status: 'waitlisted', ticketType: 'Photo Walk Pass',
        createdAt: new Date('2026-10-05T08:00:00Z'), updatedAt: new Date('2026-10-05T08:00:00Z'),
      },
      {
        registrationId: 'reg-demo-305', attendeeId: 'att-001', eventId: 'evt-demo-305', registrationDate: '2026-10-06',
        status: 'cancelled', ticketType: 'Forum Admission', cancellationReason: 'Changed travel plans', cancelledAt: new Date('2026-10-08T12:00:00Z'),
        createdAt: new Date('2026-10-06T10:00:00Z'), updatedAt: new Date('2026-10-08T12:00:00Z'),
      },
      {
        registrationId: 'reg-demo-306', attendeeId: 'att-001', eventId: 'evt-demo-306', registrationDate: '2026-10-07',
        status: 'registered', ticketType: 'Weekend Pass', qrCode: 'DEMO-TICKET-306-PRIYA', verificationId: 'DEMO-TICKET-306-PRIYA',
        createdAt: new Date('2026-10-07T06:45:00Z'), updatedAt: new Date('2026-10-07T06:46:00Z'),
      },
      {
        registrationId: 'reg-demo-307', attendeeId: 'att-002', eventId: 'evt-demo-307', registrationDate: '2026-10-08',
        status: 'registered', ticketType: 'Standard Pass', qrCode: 'DEMO-TICKET-307-ROHAN', verificationId: 'DEMO-TICKET-307-ROHAN',
        createdAt: new Date('2026-10-08T09:30:00Z'), updatedAt: new Date('2026-10-08T09:30:00Z'),
      },
      {
        registrationId: 'reg-demo-308', attendeeId: 'att-001', eventId: 'evt-demo-308', registrationDate: '2026-10-09',
        status: 'registered', ticketType: 'Hackathon Pass', qrCode: 'DEMO-TICKET-308-PRIYA', verificationId: 'DEMO-TICKET-308-PRIYA',
        createdAt: new Date('2026-10-09T10:30:00Z'), updatedAt: new Date('2026-10-09T10:30:00Z'),
      },
      {
        registrationId: 'reg-demo-309', attendeeId: 'att-002', eventId: 'evt-demo-309', registrationDate: '2026-10-10',
        status: 'registered', ticketType: 'Festival Entry', qrCode: 'DEMO-TICKET-309-ROHAN', verificationId: 'DEMO-TICKET-309-ROHAN',
        createdAt: new Date('2026-10-10T12:15:00Z'), updatedAt: new Date('2026-10-10T12:15:00Z'),
      },
      {
        registrationId: 'reg-demo-310', attendeeId: 'att-001', eventId: 'evt-demo-310', registrationDate: '2026-10-11',
        status: 'registered', ticketType: 'Expo Pass', qrCode: 'DEMO-TICKET-310-PRIYA', verificationId: 'DEMO-TICKET-310-PRIYA',
        createdAt: new Date('2026-10-11T07:40:00Z'), updatedAt: new Date('2026-10-11T07:40:00Z'),
      },
      {
        registrationId: 'reg-demo-311', attendeeId: 'att-002', eventId: 'evt-demo-311', registrationDate: '2026-01-05',
        status: 'attended', ticketType: 'Makers Market Admission', qrCode: 'DEMO-TICKET-311-ROHAN', verificationId: 'DEMO-TICKET-311-ROHAN',
        createdAt: new Date('2026-01-05T08:00:00Z'), updatedAt: new Date('2026-01-18T11:05:00Z'),
      },
      {
        registrationId: 'reg-demo-312', attendeeId: 'att-001', eventId: 'evt-demo-312', registrationDate: '2026-05-01',
        status: 'no-show', ticketType: 'Leadership Forum Pass',
        createdAt: new Date('2026-05-01T10:00:00Z'), updatedAt: new Date('2026-05-24T09:00:00Z'),
      },
    ];

    // ==================== PAYMENTS ====================
    this.payments = [
      {
        paymentId: 'pay-001',
        registrationId: 'reg-001',
        amount: 1500,
        status: 'completed',
        paymentDate: '2024-02-10',
        paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
      },
      {
        paymentId: 'pay-att-no-show', registrationId: 'reg-att-002-no-show', amount: 500, status: 'completed', paymentDate: '2024-07-01', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2024-07-01T10:00:00Z'), updatedAt: new Date('2024-07-01T10:00:00Z'),
      },
      {
        paymentId: 'pay-att-001-checked-in', registrationId: 'reg-att-001-checked-in', amount: 1500, status: 'completed', paymentDate: '2024-06-02', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2024-06-02T10:00:00Z'), updatedAt: new Date('2024-06-02T10:00:00Z'),
      },
      {
        paymentId: 'pay-att-201', registrationId: 'reg-att-201', amount: 1200, status: 'completed', paymentDate: '2026-09-20', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-09-20T08:31:00Z'), updatedAt: new Date('2026-09-20T08:31:00Z'),
      },
      {
        paymentId: 'pay-att-204', registrationId: 'reg-att-204', amount: 900, status: 'refunded', paymentDate: '2026-09-02', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-09-02T12:02:00Z'), updatedAt: new Date('2026-10-09T10:00:00Z'),
      },
      {
        paymentId: 'pay-demo-301', registrationId: 'reg-demo-301', amount: 1800, status: 'completed', paymentDate: '2026-10-02', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-02T08:31:00Z'), updatedAt: new Date('2026-10-02T08:31:00Z'),
      },
      {
        paymentId: 'pay-demo-303', registrationId: 'reg-demo-303', amount: 450, status: 'pending', paymentDate: '2026-10-10', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-10T11:00:00Z'), updatedAt: new Date('2026-10-10T11:00:00Z'),
      },
      {
        paymentId: 'pay-demo-305', registrationId: 'reg-demo-305', amount: 950, status: 'refunded', paymentDate: '2026-10-06', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-06T10:02:00Z'), updatedAt: new Date('2026-10-09T10:00:00Z'),
      },
      {
        paymentId: 'pay-demo-306', registrationId: 'reg-demo-306', amount: 1200, status: 'completed', paymentDate: '2026-10-07', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-07T06:46:00Z'), updatedAt: new Date('2026-10-07T06:46:00Z'),
      },
      {
        paymentId: 'pay-demo-307', registrationId: 'reg-demo-307', amount: 600, status: 'completed', paymentDate: '2026-10-08', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-08T09:30:00Z'), updatedAt: new Date('2026-10-08T09:30:00Z'),
      },
      {
        paymentId: 'pay-demo-309', registrationId: 'reg-demo-309', amount: 1500, status: 'completed', paymentDate: '2026-10-10', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-10-10T12:15:00Z'), updatedAt: new Date('2026-10-10T12:15:00Z'),
      },
      {
        paymentId: 'pay-demo-311', registrationId: 'reg-demo-311', amount: 300, status: 'completed', paymentDate: '2026-01-05', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-01-05T08:01:00Z'), updatedAt: new Date('2026-01-05T08:01:00Z'),
      },
      {
        paymentId: 'pay-demo-312', registrationId: 'reg-demo-312', amount: 2200, status: 'completed', paymentDate: '2026-05-01', paymentMethod: 'DEMO_PROVIDER',
        createdAt: new Date('2026-05-01T10:02:00Z'), updatedAt: new Date('2026-05-01T10:02:00Z'),
      },
    ];

    this.refunds = [
      { refundId: 'ref-att-204', paymentId: 'pay-att-204', registrationId: 'reg-att-204', amount: 900, status: 'completed', reason: 'Event cancelled by organizer', requestedAt: new Date('2026-10-08T11:00:00Z'), processedAt: new Date('2026-10-09T10:00:00Z') },
      { refundId: 'ref-demo-305', paymentId: 'pay-demo-305', registrationId: 'reg-demo-305', amount: 950, status: 'completed', reason: 'Attendee cancellation within the refund window', requestedAt: new Date('2026-10-08T12:00:00Z'), processedAt: new Date('2026-10-09T10:00:00Z') },
    ];

    // ==================== STAFF ASSIGNMENTS (Sarah Chen -> James Wilson) ====================
    this.staffAssignments = [
      {
        assignmentId: 'asgn-emp-101',
        eventId: 'evt-emp-101',
        organizerId: 'org-002',
        staffId: 'staff-001',
        status: 'accepted',
        assignedAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      },
      {
        assignmentId: 'asgn-emp-102',
        eventId: 'evt-emp-102',
        organizerId: 'org-002',
        staffId: 'staff-003',
        status: 'accepted',
        assignedAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
      },
      {
        assignmentId: 'asgn-emp-103',
        eventId: 'evt-emp-101',
        organizerId: 'org-002',
        staffId: 'staff-002',
        status: 'pending',
        assignedAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
      },
      {
        assignmentId: 'asgn-001',
        eventId: 'evt-001',
        organizerId: 'org-001',
        staffId: 'staff-001',
        status: 'accepted',
        assignedAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-02'),
      },
      {
        assignmentId: 'asgn-002',
        eventId: 'evt-002',
        organizerId: 'org-001',
        staffId: 'staff-001',
        status: 'pending',
        assignedAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
      },
    ];

    // ==================== SAMPLE SUPPORT EXECUTIVE REPORTS ====================
    this.supportExecutiveReports = [
      {
        reportId: 'SER-demo-001', submittedBy: 'usr-emp-001', sourceReference: 'demo:support-report-001',
        title: 'Weekly Customer Support Summary (Sample)', category: 'Support & Issue Summary',
        scope: 'Platform Wide', period: '12–16 October 2026', status: 'submitted',
        summary: 'Handled 42 customer requests: 36 resolved and 6 in progress. Common topics included ticket downloads, payment confirmations, and event schedule changes. Average first response was 24 minutes. Follow up on the remaining payment confirmations before the next weekly review.',
        createdAt: new Date('2026-10-16T09:00:00Z'), submittedAt: new Date('2026-10-16T09:30:00Z'), updatedAt: new Date('2026-10-16T09:30:00Z'),
      },
      {
        reportId: 'SER-demo-002', submittedBy: 'usr-emp-002', sourceReference: 'demo:support-report-002',
        title: 'Registration Verification Audit (Sample)', category: 'Registration & User Management',
        scope: 'October Event Registrations', period: '1–15 October 2026', status: 'submitted',
        summary: 'Reviewed 128 event registrations. Approved 122 complete submissions; 6 remain pending supporting documents. All approved attendees received confirmation messages. Recommend clearer upload instructions to reduce incomplete submissions.',
        createdAt: new Date('2026-10-15T10:00:00Z'), submittedAt: new Date('2026-10-15T10:30:00Z'), updatedAt: new Date('2026-10-15T10:30:00Z'),
      },
      {
        reportId: 'SER-demo-003', submittedBy: 'usr-emp-003', sourceReference: 'demo:support-report-003',
        title: 'AI Product & Cloud Summit Readiness (Sample)', category: 'Event Operations Report',
        scope: 'AI Product & Cloud Summit', period: 'October 2026', status: 'submitted',
        summary: 'Completed 8 of 10 readiness checks, covering registration links, attendee communications, capacity settings, and venue directions. Final venue signage and accessibility confirmations are pending. Recommend completing both checks before sending the attendee reminder.',
        createdAt: new Date('2026-10-14T08:00:00Z'), submittedAt: new Date('2026-10-14T08:30:00Z'), updatedAt: new Date('2026-10-14T08:30:00Z'),
      },
      {
        reportId: 'SER-demo-004', submittedBy: 'usr-emp-001', sourceReference: 'demo:support-report-004',
        title: 'Customer Request Resolution Review (Sample)', category: 'Support & Issue Summary',
        scope: 'Customer Requests', period: '5–9 October 2026', status: 'reviewed',
        summary: 'Resolved 35 customer requests, including 14 booking questions, 12 payment queries, and 9 event information requests. Two repeat questions were added to the help guide. No unresolved requests remained at the end of the reporting period.',
        reviewFeedback: 'Reviewed. Include a comparison of response and resolution times in the next report.', reviewedBy: 'usr-admin-001',
        createdAt: new Date('2026-10-09T09:00:00Z'), submittedAt: new Date('2026-10-09T09:30:00Z'),
        reviewedAt: new Date('2026-10-12T10:00:00Z'), updatedAt: new Date('2026-10-12T10:00:00Z'),
      },
      {
        reportId: 'SER-demo-005', submittedBy: 'usr-emp-002', sourceReference: 'demo:support-report-005',
        title: 'Account Access & Verification Summary (Sample)', category: 'Registration & User Management',
        scope: 'Customer Accounts', period: 'September 2026', status: 'reviewed',
        summary: 'Completed 58 account verification requests and resolved 17 sign-in or password recovery queries. All account access requests were closed after customer confirmation. Recommend improving the verification email instructions and password recovery help text.',
        reviewFeedback: 'Approved. Share the proposed help text updates for the next release.', reviewedBy: 'usr-admin-001',
        createdAt: new Date('2026-10-01T08:00:00Z'), submittedAt: new Date('2026-10-01T08:30:00Z'),
        reviewedAt: new Date('2026-10-02T09:00:00Z'), updatedAt: new Date('2026-10-02T09:00:00Z'),
      },
      {
        reportId: 'SER-demo-006', submittedBy: 'usr-emp-003', sourceReference: 'demo:support-report-006',
        title: 'Food & Farm Festival Operations Update (Sample)', category: 'Event Operations Report',
        scope: 'Sustainable Food & Farm Festival', period: '1–10 October 2026', status: 'submitted',
        summary: 'Verified event details, booking limits, attendee instructions, and venue contact information. Resolved 7 event information requests and corrected 2 schedule entries. The organizer has been asked to confirm the final arrival instructions before publication.',
        createdAt: new Date('2026-10-10T11:00:00Z'), submittedAt: new Date('2026-10-10T11:30:00Z'), updatedAt: new Date('2026-10-10T11:30:00Z'),
      },
    ];

    // ==================== NOTIFICATIONS ====================
    this.notifications = [
      {
        notificationId: 'notif-001',
        userId: 'usr-org-001', // Sarah Chen
        message: 'New event request from Michael Torres for "Tech Product Launch".',
        type: 'request',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      },
      {
        notificationId: 'notif-002',
        userId: 'usr-staff-001', // James Wilson
        message: 'You have been assigned to "Yoga & Wellness Retreat" by Sarah Chen.',
        type: 'assignment',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      },
      {
        notificationId: 'notif-003',
        userId: 'usr-client-001', // Michael Torres
        message: 'Your event request for "Corporate Anniversary" has been approved by Sarah Chen.',
        type: 'approval',
        read: true,
        dateTime: new Date('2024-02-12'),
        createdAt: new Date('2024-02-12'),
      },
      {
        notificationId: 'notif-att-201', userId: 'usr-attendee-001', eventId: 'evt-att-201', registrationId: 'reg-att-201',
        message: 'Registration confirmed for India Product Design Conference 2027.', type: 'registration_confirmed', read: true,
        dateTime: new Date('2026-09-20T08:32:00Z'), createdAt: new Date('2026-09-20T08:32:00Z'),
      },
      {
        notificationId: 'notif-att-202', userId: 'usr-attendee-001', eventId: 'evt-att-202', registrationId: 'reg-att-202',
        message: 'Complete payment for Cloud Native Engineering Workshop to keep your place.', type: 'pending_payment', read: false,
        dateTime: new Date('2026-10-12T10:00:00Z'), createdAt: new Date('2026-10-12T10:00:00Z'),
      },
      {
        notificationId: 'notif-att-203', userId: 'usr-attendee-001', eventId: 'evt-att-203', registrationId: 'reg-att-203',
        message: 'A Community Tech Meetup place is available. Accept your waitlist offer before it expires.', type: 'waitlist_offer', read: false,
        dateTime: new Date('2026-10-14T07:00:00Z'), createdAt: new Date('2026-10-14T07:00:00Z'),
      },
      {
        notificationId: 'notif-att-204', userId: 'usr-attendee-001', eventId: 'evt-att-204', registrationId: 'reg-att-204', paymentId: 'pay-att-204',
        message: 'Autumn Creator Expo was cancelled. Your refund of ₹900 is complete.', type: 'refund_completed', read: false,
        dateTime: new Date('2026-10-09T10:00:00Z'), createdAt: new Date('2026-10-09T10:00:00Z'),
      },
      {
        notificationId: 'notif-att-205', userId: 'usr-attendee-001', eventId: 'evt-att-201', registrationId: 'reg-att-201',
        message: 'India Product Design Conference venue changed to BIEC Conference Hall, Bangalore.', type: 'event_changed', read: false,
        dateTime: new Date('2026-10-05T09:30:00Z'), createdAt: new Date('2026-10-05T09:30:00Z'),
      },
      {
        notificationId: 'notif-demo-303', userId: 'usr-attendee-001', eventId: 'evt-demo-303', registrationId: 'reg-demo-303',
        message: 'Complete your simulated payment for Sustainable Food & Farm Festival to keep your reservation.', type: 'pending_payment', read: false,
        dateTime: new Date('2026-10-10T11:00:00Z'), createdAt: new Date('2026-10-10T11:00:00Z'),
      },
      {
        notificationId: 'notif-demo-304', userId: 'usr-attendee-001', eventId: 'evt-demo-304', registrationId: 'reg-demo-304-wait',
        message: 'Mumbai Street Photography Walk is full. You are on the waitlist.', type: 'waitlisted', read: false,
        dateTime: new Date('2026-10-05T08:00:00Z'), createdAt: new Date('2026-10-05T08:00:00Z'),
      },
      {
        notificationId: 'notif-demo-305', userId: 'usr-attendee-001', eventId: 'evt-demo-305', registrationId: 'reg-demo-305', paymentId: 'pay-demo-305',
        message: 'Your Startup Finance & Funding Forum registration was cancelled and its simulated refund completed.', type: 'refund_completed', read: false,
        dateTime: new Date('2026-10-09T10:00:00Z'), createdAt: new Date('2026-10-09T10:00:00Z'),
      },
    ];

    // ==================== ATTENDANCE ====================
    this.attendance = [
      {
        attendanceId: 'atnd-001',
        attendeeId: 'att-001',
        eventId: 'evt-001',
        staffId: 'staff-001',
        checkInTime: '09:15 AM',
        status: 'checked-in',
        qrCode: 'V-PRIYA-001',
        verificationId: 'V-PRIYA-001',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        attendanceId: 'atnd-002',
        attendeeId: 'att-002',
        eventId: 'evt-001',
        staffId: 'staff-001',
        checkInTime: '09:30 AM',
        status: 'checked-in',
        qrCode: 'V-ROHAN-001',
        verificationId: 'V-ROHAN-001',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        attendanceId: 'atnd-demo-311',
        attendeeId: 'att-002',
        eventId: 'evt-demo-311',
        staffId: 'staff-001',
        checkInTime: '11:05 AM',
        status: 'checked-in',
        qrCode: 'DEMO-TICKET-311-ROHAN',
        verificationId: 'DEMO-TICKET-311-ROHAN',
        createdAt: new Date('2026-01-18T11:05:00Z'),
        updatedAt: new Date('2026-01-18T11:05:00Z'),
      },
      {
        attendanceId: 'atnd-demo-312',
        attendeeId: 'att-001',
        eventId: 'evt-demo-312',
        staffId: 'staff-001',
        checkInTime: '',
        status: 'no-show',
        createdAt: new Date('2026-05-24T09:00:00Z'),
        updatedAt: new Date('2026-05-24T09:00:00Z'),
      },
    ];

    this.activityLogs = [
      { id: 'log-demo-301', action: 'registration_confirmed', resource: 'registration', role: UserRole.ATTENDEE, timestamp: new Date('2026-10-11T07:40:00Z'), status: 'success', details: { registrationId: 'reg-demo-310', eventId: 'evt-demo-310', attendeeId: 'att-001' } },
      { id: 'log-demo-302', action: 'registration_confirmed', resource: 'registration', role: UserRole.ATTENDEE, timestamp: new Date('2026-10-10T12:15:00Z'), status: 'success', details: { registrationId: 'reg-demo-309', eventId: 'evt-demo-309', attendeeId: 'att-002' } },
      { id: 'log-demo-303', action: 'registration_pending_payment', resource: 'registration', role: UserRole.ATTENDEE, timestamp: new Date('2026-10-10T11:00:00Z'), status: 'pending', details: { registrationId: 'reg-demo-303', eventId: 'evt-demo-303', attendeeId: 'att-001' } },
      { id: 'log-demo-304', action: 'waitlist_joined', resource: 'registration', role: UserRole.ATTENDEE, timestamp: new Date('2026-10-05T08:00:00Z'), status: 'success', details: { registrationId: 'reg-demo-304-wait', eventId: 'evt-demo-304', attendeeId: 'att-001' } },
      { id: 'log-demo-305', action: 'registration_cancelled_refunded', resource: 'registration', role: UserRole.ATTENDEE, timestamp: new Date('2026-10-09T10:00:00Z'), status: 'success', details: { registrationId: 'reg-demo-305', eventId: 'evt-demo-305', attendeeId: 'att-001', refundId: 'ref-demo-305' } },
      { id: 'log-demo-306', action: 'attendee_checked_in', resource: 'attendance', role: UserRole.EVENT_STAFF, timestamp: new Date('2026-01-18T11:05:00Z'), status: 'success', details: { registrationId: 'reg-demo-311', eventId: 'evt-demo-311', attendeeId: 'att-002' } },
      { id: 'log-demo-307', action: 'attendee_no_show', resource: 'attendance', role: UserRole.EVENT_STAFF, timestamp: new Date('2026-05-24T09:00:00Z'), status: 'success', details: { registrationId: 'reg-demo-312', eventId: 'evt-demo-312', attendeeId: 'att-001' } },
    ];

    // ==================== REPORTS ====================

    this.eventReports = [
      {
        eventReportId: 'rpt-evt-001',
        organizerId: 'org-001',
        eventId: 'evt-001',
        clientId: 'cli-001',
        reportTitle: 'Tech Conference 2024 - Final Report',
        reportDetails: 'Event was successful with 450 attendees. All sponsors satisfied.',
        submissionDate: '2024-06-20',
        status: 'submitted',
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20'),
      },
    ];

    this.staffReports = [
      {
        staffReportId: 'rpt-staff-001',
        staffId: 'staff-001',
        organizerId: 'org-001',
        eventId: 'evt-001',
        reportText: 'Event ran smoothly. Check-in process was efficient. Attendees were satisfied.',
        status: 'submitted',
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20'),
      },
    ];

    // ==================== REVIEWS ====================

    this.eventReviews = [
      {
        reviewId: 'rev-evt-001',
        reviewerId: 'att-001',
        eventId: 'evt-001',
        rating: 5,
        comment: 'Excellent event! Great speakers and networking opportunities.',
        date: '2024-06-21',
        createdAt: new Date('2024-06-21'),
      },
      {
        reviewId: 'rev-evt-002',
        reviewerId: 'att-002',
        eventId: 'evt-001',
        rating: 4,
        comment: 'Good event overall. Could improve on timing.',
        date: '2024-06-21',
        createdAt: new Date('2024-06-21'),
      },
    ];

    this.clientOrganizerReviews = [
      {
        reviewId: 'rev-org-demo-001', eventId: 'evt-001', clientId: 'cli-001', organizerId: 'org-001', rating: 5,
        comment: 'Sarah and her team delivered a polished summit. Communication was clear, the speakers and schedule were well coordinated, and our guests had a great experience.',
        createdAt: new Date('2024-06-20'),
      },
      {
        reviewId: 'rev-org-demo-002', eventId: 'evt-002', clientId: 'cli-001', organizerId: 'org-001', rating: 5,
        comment: 'The wellness retreat was thoughtfully organized and ran smoothly. The venue, session timing, and on-site coordination made the day relaxing for everyone.',
        createdAt: new Date('2024-07-23'),
      },
    ];

    this.staffReviews = [
      {
        reviewId: 'rev-staff-001',
        reviewerId: 'org-001',
        staffId: 'staff-001',
        eventId: 'evt-001',
        rating: 5,
        comment: 'Frank did an excellent job. Very professional and efficient.',
        reviewDate: '2024-06-22',
        createdAt: new Date('2024-06-22'),
      },
    ];

    const resolvedOn = new Date('2026-10-01T10:00:00.000Z');
    const resolvedTicket = (
      ticketId: string,
      userId: string,
      requestType: string,
      concern: string,
      description: string,
      daysAgo: number,
    ): SupportTicket => {
      const resolvedAt = new Date(resolvedOn);
      resolvedAt.setUTCDate(resolvedAt.getUTCDate() - daysAgo);
      return {
        ticketId,
        userId,
        requestType,
        concern,
        description,
        attachments: [],
        status: 'resolved',
        createdAt: new Date(resolvedAt.getTime() - 60 * 60 * 1000),
        updatedAt: resolvedAt,
        resolutionEmailSentAt: resolvedAt,
      };
    };

    this.supportTickets = [
      resolvedTicket(
        'SUP-2026-00001',
        'usr-attendee-001',
        'Ticket & Registration Issues',
        'Ticket not received after registration',
        'I completed my event registration, but the ticket did not appear in My Tickets.',
        12,
      ),
      resolvedTicket(
        'SUP-2026-00002',
        'usr-attendee-001',
        'Account Related Problems',
        'Profile details not saving',
        'I updated my profile details, but my changes were not being saved.',
        5,
      ),
      resolvedTicket(
        'SUP-2026-00003',
        'usr-client-001',
        'Organizer & Client Support',
        'Unable to download event reports',
        'I cannot download the event reports from my client dashboard.',
        9,
      ),
      resolvedTicket(
        'SUP-2026-00004',
        'usr-org-001',
        'Organizer & Client Support',
        'Event capacity not updating',
        'The event capacity shown in the organizer dashboard does not match the current registrations.',
        7,
      ),
      resolvedTicket(
        'SUP-2026-00005',
        'usr-staff-001',
        'Event Staff & Check-in Support',
        'Check-in not updating',
        'Attendee check-ins are not updating in the attendance list after scanning.',
        4,
      ),
    ];
    this.applyOrganizerDashboardDemoScenario();
    this.applyEventRequestDemoScenario();
  }

  private applyOrganizerDashboardDemoScenario(): void {
    if (process.env.NODE_ENV === 'production') return;
    const day = (offset: number): string => {
      const value = new Date();
      value.setHours(12, 0, 0, 0);
      value.setDate(value.getDate() + offset);
      return value.toISOString().slice(0, 10);
    };
    const now = new Date();
    const scenarios: Array<Partial<Event> & Pick<Event, 'eventId' | 'name' | 'category' | 'date' | 'time' | 'location' | 'capacity' | 'ticketPrice' | 'status'>> = [
      { eventId: 'evt-001', name: 'India AI Leadership Summit', category: 'Technology', date: day(-65), time: '09:00', location: 'Chennai Trade Centre, Chennai', capacity: 500, demoRegistrationCount: 462, ticketPrice: 1500, status: 'completed' },
      { eventId: 'evt-002', name: 'Wellness & Mindfulness Retreat', category: 'Health & Wellness', date: day(-38), time: '07:00', location: 'Nandi Hills Retreat, Bengaluru', capacity: 120, demoRegistrationCount: 108, ticketPrice: 750, status: 'completed' },
      { eventId: 'evt-003', name: 'Future of FinTech Forum', category: 'Finance', date: day(0), time: '10:00', location: 'Venue confirmation pending', capacity: 250, demoRegistrationCount: 0, ticketPrice: 1200, status: 'ongoing', attentionReasons: ['Confirm the final venue operations plan.'], preparationTasks: [{ taskId: 'prep-demo-003', title: 'Confirm the final venue', deadline: day(-1), status: 'in_progress', updatedAt: now }] },
      { eventId: 'evt-att-201', name: 'Product Design Conference India', category: 'Design', date: day(7), time: '09:30', location: 'BIEC Conference Hall, Bengaluru', capacity: 300, demoRegistrationCount: 286, ticketPrice: 1200, status: 'published', attentionReasons: ['Capacity is above 95%; review waitlist and seating.'] },
      { eventId: 'evt-att-202', name: 'Cloud Native Engineering Workshop', category: 'Technology', date: day(0), time: '10:00', location: 'Tidel Park Learning Centre, Chennai', capacity: 80, demoRegistrationCount: 68, ticketPrice: 750, status: 'ongoing' },
      { eventId: 'evt-att-203', name: 'Community Demo Night', category: 'Networking', date: day(3), time: '17:30', location: 'Innovation Hub, Hyderabad', capacity: 140, demoRegistrationCount: 137, ticketPrice: 0, status: 'published', attentionReasons: ['Assign two additional check-in staff before doors open.'], preparationTasks: [{ taskId: 'prep-demo-203', title: 'Assign two additional check-in staff', deadline: day(-1), status: 'pending', updatedAt: now }] },
      { eventId: 'evt-att-204', name: 'Autumn Creator Expo', category: 'Creative', date: day(12), time: '11:00', location: 'Pragati Maidan, New Delhi', capacity: 450, demoRegistrationCount: 214, ticketPrice: 900, status: 'cancelled', cancellationReason: 'Venue closed for emergency maintenance.' },
      { eventId: 'evt-demo-301', name: 'AI Product & Cloud Summit', category: 'Technology', date: day(14), time: '09:00', location: 'Bangalore International Centre, Bengaluru', capacity: 500, demoRegistrationCount: 411, ticketPrice: 1800, status: 'published' },
      { eventId: 'evt-demo-306', name: 'Coastal Wellness Weekend', category: 'Health & Wellness', date: day(55), time: '07:30', location: 'Ashvem Beach Retreat, Goa', capacity: 75, demoRegistrationCount: 54, ticketPrice: 1200, status: 'published' },
      { eventId: 'evt-demo-307', name: 'Design Systems Exchange', category: 'Design', date: day(0), time: '11:30', location: 'Bangalore International Centre, Bengaluru', capacity: 140, demoRegistrationCount: 96, ticketPrice: 600, status: 'ongoing', attentionReasons: ['Complete the remaining agenda handoff.'], preparationTasks: [{ taskId: 'prep-demo-307', title: 'Complete the agenda handoff', deadline: day(-2), status: 'pending', updatedAt: now }] },
      { eventId: 'evt-demo-309', name: 'Kochi Coastal Music Festival', category: 'Music', date: day(-10), time: '16:00', location: 'Bolgatty Palace Grounds, Kochi', capacity: 1000, demoRegistrationCount: 914, ticketPrice: 1500, status: 'completed' },
      { eventId: 'evt-demo-311', name: 'Winter Makers Market', category: 'Arts & Culture', date: day(-120), time: '11:00', location: 'Jio World Drive, Mumbai', capacity: 90, demoRegistrationCount: 84, ticketPrice: 300, status: 'completed' },
      { eventId: 'evt-orgdash-016', name: 'Retail Innovation Expo', category: 'Business', date: day(0), time: '09:30', location: 'World Trade Centre, Pune', capacity: 320, demoRegistrationCount: 244, ticketPrice: 950, status: 'ongoing' },
      { eventId: 'evt-orgdash-017', name: 'Women in Engineering Conference', category: 'Conference', date: day(85), time: '09:00', location: 'The Leela Ambience, Gurugram', capacity: 420, demoRegistrationCount: 267, ticketPrice: 1100, status: 'published' },
      { eventId: 'evt-orgdash-018', name: 'Monsoon Startup Mixer', category: 'Networking', date: day(-18), time: '18:30', location: 'WeWork Galaxy, Bengaluru', capacity: 180, demoRegistrationCount: 121, ticketPrice: 0, status: 'completed', cancellationReason: undefined },
    ];
    const activeScenarioIds = new Set(scenarios.map(event => event.eventId));
    const retiredScenarioIds = new Set(['evt-att-205', 'evt-demo-303', 'evt-demo-304']);
    this.events = this.events.filter(event => !retiredScenarioIds.has(event.eventId)
      && (event.demoScenario !== 'organizer-dashboard-v3' || activeScenarioIds.has(event.eventId)));
    const existingById = new Map(this.events.map(event => [event.eventId, event]));
    for (const scenario of scenarios) {
      const existing = existingById.get(scenario.eventId);
      const base: Event = existing || {
        eventId: scenario.eventId, organizerId: 'org-001', name: scenario.name, category: scenario.category,
        date: scenario.date, time: scenario.time, location: scenario.location, capacity: scenario.capacity,
        ticketPrice: scenario.ticketPrice, status: scenario.status, createdAt: now, updatedAt: now,
      };
      Object.assign(base, scenario, { organizerId: 'org-001', demoScenario: 'organizer-dashboard-v3', updatedAt: now });
      if (!existing) this.events.push(base);
    }
    const preparationRequest: EventRequest = { requestId: 'req-orgdash-prep', clientId: 'cli-001', organizerId: 'org-001',
      eventName: 'Annual Partner Awards', eventDate: day(-2), budget: 180000, capacity: 240,
      requirements: 'Awards stage, dinner service, lighting, and guest transport.', status: 'planning',
      agreementStatus: 'agreed', paymentStatus: 'deposit_paid', proposals: [], clarifications: [], auditHistory: [],
      createdAt: new Date(now.getTime() - 20 * 86_400_000), updatedAt: new Date(now.getTime() - 5 * 86_400_000) };
    const existingRequest = this.eventRequests.find(request => request.requestId === preparationRequest.requestId);
    if (existingRequest) Object.assign(existingRequest, preparationRequest); else this.eventRequests.push(preparationRequest);
    const actionableRequests: EventRequest[] = [
      ['req-orgdash-action-001', 'Executive Product Launch', 9, 'submitted'],
      ['req-orgdash-action-002', 'Regional Partner Conference', 16, 'pending'],
      ['req-orgdash-action-003', 'Healthcare Innovation Roundtable', 24, 'under_review'],
      ['req-orgdash-action-004', 'Annual Customer Awards', 31, 'changes_requested'],
      ['req-orgdash-action-005', 'Sustainable Retail Forum', 38, 'counteroffer_received'],
      ['req-orgdash-action-006', 'Leadership Strategy Retreat', 46, 'submitted'],
      ['req-orgdash-action-007', 'Creator Economy Networking Night', 53, 'pending'],
    ].map(([requestId, eventName, offset, status], index) => ({
      requestId: String(requestId), clientId: 'cli-001', organizerId: 'org-001', eventName: String(eventName),
      eventDate: day(Number(offset)), budget: 75_000 + index * 15_000, capacity: 80 + index * 20,
      requirements: `Review the client brief and confirm availability for ${eventName}.`, status: status as EventRequest['status'],
      agreementStatus: 'not_sent', paymentStatus: 'unpaid', proposals: [], clarifications: [], auditHistory: [],
      createdAt: new Date(now.getTime() - (index + 1) * 86_400_000), updatedAt: now,
    }));
    const actionableIds = new Set(actionableRequests.map(request => request.requestId));
    this.eventRequests = this.eventRequests.filter(request => !request.requestId.startsWith('req-orgdash-action-') || actionableIds.has(request.requestId));
    for (const request of actionableRequests) {
      const existing = this.eventRequests.find(item => item.requestId === request.requestId);
      if (existing) Object.assign(existing, request); else this.eventRequests.push(request);
    }
    const operationalIssue: SupportTicket = { ticketId: 'SUP-ORG-DEMO-001', userId: 'usr-org-001', eventId: 'evt-att-203', requestType: 'Event Related Issues',
      concern: 'Power backup confirmation overdue', description: 'The venue has not confirmed generator capacity for Community Demo Night.',
      attachments: [], status: 'open', createdAt: new Date(now.getTime() - 3 * 86_400_000), updatedAt: now };
    const existingIssue = this.supportTickets.find(ticket => ticket.ticketId === operationalIssue.ticketId);
    if (existingIssue) Object.assign(existingIssue, operationalIssue); else this.supportTickets.push(operationalIssue);
  }

  private applyEventRequestDemoScenario(): void {
    if (process.env.NODE_ENV === 'production') return;
    const now = new Date();
    const day = (offset: number): string => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offset);
      return date.toISOString().slice(0, 10);
    };
    const demoClients = [
      { clientId: 'cli-reqdemo-001', userId: 'usr-reqdemo-client-001', name: 'Aisha Rao', email: 'aisha.demo@example.test', phoneNo: '9000001001', companyName: 'Northstar Technology' },
      { clientId: 'cli-reqdemo-002', userId: 'usr-reqdemo-client-002', name: 'Daniel Kim', email: 'daniel.demo@example.test', phoneNo: '9000001002', companyName: 'Mosaic Health Group' },
      { clientId: 'cli-reqdemo-003', userId: 'usr-reqdemo-client-003', name: 'Leena Iyer', email: 'leena.demo@example.test', phoneNo: '9000001003', companyName: 'Greenline Foundation' },
    ];
    for (const demoClient of demoClients) {
      if (!this.users.some(user => user.userId === demoClient.userId)) {
        this.users.push({
          userId: demoClient.userId, name: demoClient.name, email: demoClient.email,
          password: 'Demo-only-not-for-production', userRole: UserRole.CLIENT, status: 'active',
          phoneNo: demoClient.phoneNo, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now,
        });
      } else {
        this.users.find(user => user.userId === demoClient.userId)!.demoScenario = 'event-request-workflow-v1';
      }
      if (!this.clients.some(client => client.clientId === demoClient.clientId)) {
        this.clients.push({
          clientId: demoClient.clientId, userId: demoClient.userId,
          companyName: demoClient.companyName, demoScenario: 'event-request-workflow-v1', createdAt: now,
        });
      } else {
        this.clients.find(client => client.clientId === demoClient.clientId)!.demoScenario = 'event-request-workflow-v1';
      }
    }

    const makeRequest = (
      sequence: number,
      status: EventRequest['status'],
      clientId: string,
      organizerId: string,
      title: string,
      eventType: string,
      dateOffset: number,
      budget: number,
      capacity: number,
      extra: Partial<EventRequest> = {},
    ): EventRequest => {
      const createdAt = new Date(now.getTime() - (sequence + 1) * 86_400_000);
      return {
        requestId: `req-demo-flow-${String(sequence).padStart(3, '0')}`,
        clientId, organizerId, eventName: title, eventType, eventDate: day(dateOffset),
        eventTime: sequence % 2 ? '18:30' : '09:00', city: ['Bengaluru', 'Mumbai', 'Chennai', 'Hyderabad'][sequence % 4],
        dateFlexibility: sequence % 3 === 0 ? 'flexible' : 'exact',
        venue: `Demo venue ${sequence}`, budget, capacity,
        requirements: `Demo request ${sequence}: ${eventType.toLowerCase()} with catering, accessibility, and production coordination.`,
        status, agreementStatus: 'not_sent', paymentStatus: 'unpaid',
        proposals: [], clarifications: [], negotiations: [],
        auditHistory: [{
          id: `aud-demo-flow-${String(sequence).padStart(3, '0')}-created`,
          action: 'Request Submitted', performedBy: clientId, role: 'client', timestamp: createdAt,
          details: { demoScenario: 'event-request-workflow-v1' },
        }],
        createdAt, updatedAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        demoScenario: 'event-request-workflow-v1',
        ...extra,
      };
    };
    const proposal = (version: number, request: EventRequest, status: ProposalVersion['status'], offset: number, clientNotes?: string): ProposalVersion => ({
      version, amount: request.budget + version * 5_000, depositRequired: Math.round((request.budget + version * 5_000) * 0.25),
      proposedDate: request.eventDate, validUntil: day(offset), terms: `Demo proposal v${version}: venue, catering, production, and on-site coordination.`,
      status, sentAt: new Date(request.createdAt.getTime() + 86_400_000),
      ...(clientNotes ? { clientNotes } : {}),
    });

    const requests: EventRequest[] = [
      makeRequest(1, 'submitted', 'cli-reqdemo-001', 'org-001', 'Northstar Product Reveal', 'Product Launch', 45, 180000, 260),
      makeRequest(2, 'under_review', 'cli-001', 'org-001', 'Torres Leadership Forum', 'Conference', 70, 240000, 180),
      makeRequest(3, 'info_requested', 'cli-reqdemo-002', 'org-001', 'Mosaic Care Summit', 'Healthcare', 85, 95000, 120, {
        clarifications: [
          { id: 'clr-demo-flow-003-1', senderId: 'usr-org-001', senderRole: 'organizer', senderName: 'Sarah Chen', message: 'Please confirm the accessibility and dietary requirements.', timestamp: new Date(now.getTime() - 2 * 86_400_000) },
        ],
      }),
      makeRequest(4, 'proposal_sent', 'cli-reqdemo-003', 'org-001', 'Greenline Fundraising Gala', 'Fundraiser', 100, 320000, 350),
      makeRequest(5, 'awaiting_client', 'cli-001', 'org-001', 'Torres Partner Reception', 'Networking', 115, 125000, 90, {
        agreementStatus: 'pending_signature', paymentStatus: 'deposit_pending',
      }),
      makeRequest(6, 'proposal_sent', 'cli-reqdemo-001', 'org-001', 'Northstar Design Exchange', 'Workshop', 130, 76000, 72),
      makeRequest(7, 'changes_requested', 'cli-reqdemo-002', 'org-001', 'Mosaic Research Roundtable', 'Roundtable', 145, 110000, 80, {
        negotiations: [{ id: 'neg-demo-flow-007', action: 'changes_requested', performedBy: 'usr-org-001', role: 'event_organizer', reason: 'The requested date needs a larger venue.', eventDate: day(150), timestamp: now }],
      }),
      makeRequest(8, 'counteroffer_received', 'cli-reqdemo-003', 'org-001', 'Greenline Community Day', 'Community', 160, 88000, 200, {
        negotiations: [{ id: 'neg-demo-flow-008', action: 'counteroffer', performedBy: 'usr-reqdemo-client-003', role: 'client', reason: 'Please adjust the date and guest count.', budget: 98000, eventDate: day(165), capacity: 240, timestamp: now }],
      }),
      makeRequest(9, 'planning', 'cli-001', 'org-001', 'Torres Executive Retreat', 'Retreat', 175, 210000, 65),
      makeRequest(10, 'plan_submitted', 'cli-reqdemo-001', 'org-001', 'Northstar Annual Conference', 'Conference', 190, 420000, 500, {
        activeEventPlanId: 'plan-demo-flow-010',
      }),
      makeRequest(11, 'confirmed', 'cli-reqdemo-002', 'org-001', 'Mosaic Innovation Congress', 'Conference', 205, 510000, 420, {
        agreementStatus: 'agreed', paymentStatus: 'deposit_paid', eventId: 'evt-demo-flow-011',
        activeEventPlanId: 'plan-demo-flow-011', currentProposalVersion: 1,
      }),
      makeRequest(12, 'rejected', 'cli-reqdemo-003', 'org-001', 'Greenline Arts Benefit', 'Fundraiser', 220, 150000, 140, {
        rejectionReason: 'The requested venue is unavailable for the event date.',
      }),
      makeRequest(13, 'withdrawn', 'cli-001', 'org-001', 'Torres Team Celebration', 'Celebration', 235, 65000, 55, {
        withdrawalReason: 'The client postponed the event indefinitely.',
      }),
      makeRequest(14, 'expired', 'cli-reqdemo-001', 'org-001', 'Northstar Investor Briefing', 'Corporate', -5, 195000, 100, {
        proposals: [{ version: 1, amount: 195000, depositRequired: 48750, proposedDate: day(-5), validUntil: day(-12), terms: 'Expired demo proposal.', status: 'expired', sentAt: new Date(now.getTime() - 20 * 86_400_000) }],
      }),
      makeRequest(15, 'under_review', 'cli-reqdemo-002', 'org-001', 'Mosaic Clinical Workshop', 'Workshop', -3, 72000, 45, {
        updatedAt: new Date(now.getTime() - 18 * 86_400_000),
      }),
      makeRequest(16, 'awaiting_client', 'cli-reqdemo-003', 'org-001', 'Greenline Volunteer Dinner', 'Dinner', 250, 54000, 60, {
        agreementStatus: 'agreed', paymentStatus: 'unpaid',
      }),
      makeRequest(17, 'awaiting_client', 'cli-reqdemo-001', 'org-001', 'Northstar Partner Workshop', 'Workshop', 265, 132000, 110, {
        agreementStatus: 'agreed', paymentStatus: 'failed',
      }),
      makeRequest(18, 'cancelled', 'cli-001', 'org-002', 'Torres Regional Showcase', 'Product Launch', 280, 275000, 240, {
        agreementStatus: 'agreed', paymentStatus: 'refunded', eventId: 'evt-demo-flow-018',
        cancellation: {
          reason: 'The client cancelled after the venue became unavailable.',
          cancelledBy: 'usr-client-001', cancelledAt: now, policyVersion: 'demo-policy-v1',
          paidAmount: 0, cancellationFeePercent: 10, cancellationFee: 0, refundAmount: 0,
          refundStatus: 'not_applicable', cancellationDeadline: day(266),
        },
      }),
      makeRequest(19, 'completed', 'cli-reqdemo-003', 'org-003', 'Greenline Climate Forum', 'Conference', -45, 360000, 310, {
        agreementStatus: 'agreed', paymentStatus: 'fully_paid', eventId: 'evt-demo-flow-019',
        activeEventPlanId: 'plan-demo-flow-019',
      }),
      makeRequest(20, 'proposal_sent', 'cli-reqdemo-002', 'org-004', 'Mosaic Care Leadership Day', 'Healthcare', 300, 175000, 160),
    ];
    const pendingProposal = (sequence: number, validUntil: number, status: ProposalVersion['status'] = 'pending_client'): ProposalVersion => {
      const request = requests[sequence - 1];
      return proposal(1, request, status, validUntil);
    };
    requests[3].proposals = [pendingProposal(4, 14)];
    requests[4].proposals = [pendingProposal(5, 20, 'accepted')];
    requests[5].proposals = [
      proposal(1, requests[5], 'revision_requested', 10, 'Please include a lower-cost catering option.'),
      proposal(2, requests[5], 'pending_client', 28),
    ];
    requests[9].auditHistory?.push({
      id: 'aud-demo-flow-010-plan', action: 'Event Plan Submitted', performedBy: 'usr-org-001',
      role: 'event_organizer', timestamp: now,
    });
    requests[10].proposals = [pendingProposal(11, 60, 'accepted')];
    requests[10].auditHistory?.push({
      id: 'aud-demo-flow-011-confirmed', action: 'Booking Confirmed after signed agreement and verified deposit',
      performedBy: 'usr-org-001', role: 'event_organizer', timestamp: now,
    });
    requests[15].proposals = [pendingProposal(16, 45, 'accepted')];
    requests[16].proposals = [pendingProposal(17, 50, 'accepted')];
    requests[17].auditHistory?.push({
      id: 'aud-demo-flow-018-cancelled', action: 'Booking Cancelled', performedBy: 'usr-client-001',
      role: 'client', timestamp: now,
    });
    requests[18].proposals = [pendingProposal(19, -30, 'accepted')];

    const eventScenarios: Event[] = [
      { eventId: 'evt-demo-flow-011', organizerId: 'org-001', clientId: 'cli-reqdemo-002', name: requests[10].eventName,
        category: requests[10].eventType || 'Conference', date: requests[10].eventDate, time: requests[10].eventTime || '09:00',
        location: requests[10].venue || '', capacity: requests[10].capacity, ticketPrice: 0, status: 'ongoing',
        description: requests[10].requirements, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
      { eventId: 'evt-demo-flow-018', organizerId: 'org-002', clientId: 'cli-001', name: requests[17].eventName,
        category: requests[17].eventType || 'Product Launch', date: requests[17].eventDate, time: requests[17].eventTime || '09:00',
        location: requests[17].venue || '', capacity: requests[17].capacity, ticketPrice: 0, status: 'cancelled',
        cancellationReason: requests[17].cancellation?.reason, description: requests[17].requirements,
        demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
      { eventId: 'evt-demo-flow-019', organizerId: 'org-003', clientId: 'cli-reqdemo-003', name: requests[18].eventName,
        category: requests[18].eventType || 'Conference', date: requests[18].eventDate, time: requests[18].eventTime || '09:00',
        location: requests[18].venue || '', capacity: requests[18].capacity, ticketPrice: 0, status: 'completed',
        description: requests[18].requirements, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
    ];
    const plans: EventPlan[] = [
      { eventPlanId: 'plan-demo-flow-010', requestId: requests[9].requestId, clientId: requests[9].clientId,
        organizerId: requests[9].organizerId, title: 'Demo conference plan', description: 'Plan awaiting client review.',
        budget: requests[9].budget, capacity: requests[9].capacity, status: 'submitted', approvalStatus: 'pending',
        revision: 1, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
      { eventPlanId: 'plan-demo-flow-011', requestId: requests[10].requestId, eventId: 'evt-demo-flow-011',
        clientId: requests[10].clientId, organizerId: requests[10].organizerId,
        title: 'Demo approved event plan', description: 'Approved plan for the confirmed demo booking.',
        budget: requests[10].budget, capacity: requests[10].capacity, status: 'approved', approvalStatus: 'approved',
        revision: 1, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
      { eventPlanId: 'plan-demo-flow-019', requestId: requests[18].requestId, eventId: 'evt-demo-flow-019',
        clientId: requests[18].clientId, organizerId: requests[18].organizerId,
        title: 'Demo completed event plan', description: 'Approved plan for a completed demo event.',
        budget: requests[18].budget, capacity: requests[18].capacity, status: 'approved', approvalStatus: 'approved',
        revision: 1, demoScenario: 'event-request-workflow-v1', createdAt: now, updatedAt: now },
    ];
    for (const event of eventScenarios) {
      if (!this.events.some(existing => existing.eventId === event.eventId)) this.events.push(event);
    }
    for (const plan of plans) {
      if (!this.eventPlans.some(existing => existing.eventPlanId === plan.eventPlanId)) this.eventPlans.push(plan);
    }
    for (const request of requests) {
      if (!this.eventRequests.some(existing => existing.requestId === request.requestId)) this.eventRequests.push(request);
    }
  }

  // ==================== UTILITY METHODS ====================

  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  clearAllData(): void {
    this.users = [];
    this.superAdmins = [];
    this.clients = [];
    this.organizers = [];
    this.staffProfiles = [];
    this.attendees = [];
    this.events = [];
    this.eventRequests = [];
    this.eventPlans = [];
    this.eventWorkflowPayments = [];
    this.eventWorkflowRefunds = [];
    this.eventCompletionReports = [];
    this.clientOrganizerReviews = [];
    this.registrations = [];
    this.payments = [];
    this.refunds = [];
    this.eventChanges = [];
    this.attendance = [];
    this.staffAssignments = [];
    this.eventReports = [];
    this.staffReports = [];
    this.supportExecutiveReports = [];
    this.eventReviews = [];
    this.staffReviews = [];
    this.notifications = [];
    this.activityLogs = [];
    this.supportTickets = [];
    this.supportAttachments = [];
    this.organizerApplications = [];
    this.initializeSeedData();
  }

  generateApplicationRefNumber(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORG-APP-2026-${random}`;
  }

  // User lookup utilities
  findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return this.users.find(u => u.email.trim().toLowerCase() === normalized);
  }

  findUserById(userId: string): User | undefined {
    return this.users.find(u => u.userId === userId);
  }
}
