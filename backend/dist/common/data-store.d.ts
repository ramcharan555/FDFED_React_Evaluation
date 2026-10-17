/**
 * In-memory data store for the application
 * Simulates a database without actual persistence
 * Includes all entities from the ER diagram
 */
import { UserRole, EmployeeType } from './constants';
import type { EventPolicy } from './event-policy';
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
    preferences?: {
        emailNotifications: boolean;
    };
    profile?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
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
    createdAt: Date;
}
export interface EventOrganizer {
    organizerId: string;
    userId: string;
    businessName?: string;
    rating: number;
    createdAt: Date;
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
    policySnapshot?: EventPolicy;
    cancellation?: EventCancellation;
    createdAt: Date;
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
    paymentStatus: 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
    rejectionReason?: string;
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
    reviews?: Array<{
        actorUserId: string;
        note: string;
        at: string;
    }>;
}
export interface EventChange {
    changeId: string;
    eventId: string;
    type: 'cancelled' | 'postponed' | 'date_changed' | 'time_changed' | 'venue_changed';
    summary: string;
    previousValue?: string;
    newValue?: string;
    createdAt: Date;
}
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
    reviewerId: string;
    eventId: string;
    rating: number;
    comment: string;
    date: string;
    createdAt: Date;
}
export interface StaffReview {
    reviewId: string;
    reviewerId: string;
    staffId: string;
    eventId: string;
    rating: number;
    comment: string;
    reviewDate: string;
    createdAt: Date;
}
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
export declare class DataStore {
    private static instance;
    users: User[];
    superAdmins: SuperAdmin[];
    clients: Client[];
    organizers: EventOrganizer[];
    staffProfiles: EventStaff[];
    attendees: Attendee[];
    events: Event[];
    eventRequests: EventRequest[];
    eventPlans: EventPlan[];
    eventWorkflowPayments: EventWorkflowPayment[];
    eventWorkflowRefunds: EventWorkflowRefund[];
    eventCompletionReports: EventCompletionReport[];
    clientOrganizerReviews: ClientOrganizerReview[];
    registrations: Registration[];
    payments: Payment[];
    refunds: Refund[];
    eventChanges: EventChange[];
    attendance: Attendance[];
    staffAssignments: StaffAssignment[];
    eventReports: EventReport[];
    staffReports: StaffReport[];
    financeReportSubmissions: Array<{
        id: string;
        userId: string;
        userName: string;
        title: string;
        summary: string;
        reportType: string;
        filters: Record<string, unknown>;
        metrics: Record<string, number>;
        rows: Record<string, unknown>[];
        status: 'Submitted' | 'Reviewed';
        feedback: string;
        createdAt: Date;
        reviewedAt?: Date;
    }>;
    supportExecutiveReports: SupportExecutiveReport[];
    eventReviews: EventReview[];
    staffReviews: StaffReview[];
    notifications: Notification[];
    activityLogs: ActivityLog[];
    supportTickets: SupportTicket[];
    supportAttachments: SupportAttachment[];
    private constructor();
    static getInstance(): DataStore;
    private get persistencePath();
    private restoreFromDisk;
    persist(): void;
    private initializeSeedData;
    generateId(prefix: string): string;
    clearAllData(): void;
    findUserByEmail(email: string): User | undefined;
    findUserById(userId: string): User | undefined;
}
//# sourceMappingURL=data-store.d.ts.map