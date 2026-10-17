import { UserRole } from '../../common/constants';
import { EventPolicyAcknowledgementDto } from '../../common/event-policy';
import { CreateEventRequestDto, UpdateEventRequestStatusDto, RequestMissingInfoDto, ProvideMissingInfoDto, SendProposalDto, ReviseProposalDto, RejectRequestDto, ClientResponseDto, UpdateAgreementStatusDto, UpdatePaymentStatusDto, ConfirmBookingDto } from './dto/event-request.dto';
export declare class EventRequestsService {
    private db;
    constructor();
    /** Reject invalid dates and dates that are not strictly in the future. */
    private isPastDate;
    /** Keep the legacy availability endpoint, but only validate future dates. */
    checkDateAvailability(organizerId: string, dateStr: string): {
        available: boolean;
        reason?: string;
        pastDate?: boolean;
        conflictEvent?: any;
    };
    /**
     * Auto-expire proposals that have passed their validUntil date
     */
    private checkAndExpireProposals;
    private addAudit;
    private notifyRequestClient;
    private notifyRequestOrganizer;
    findOrganizers(role: UserRole): any[];
    create(dto: CreateEventRequestDto, role: UserRole, userId?: string): any;
    findAll(role: UserRole, userId?: string): any[];
    findOne(requestId: string, role: UserRole, userId?: string): any;
    private findMutableRequest;
    /**
     * Organizer starts review of a submitted request
     */
    startReview(requestId: string, role: UserRole, userId?: string): any;
    acceptRequest(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any;
    /**
     * Organizer requests missing info from client
     */
    requestMissingInfo(requestId: string, dto: RequestMissingInfoDto, role: UserRole, userId?: string): any;
    /**
     * Client provides missing information
     */
    provideMissingInfo(requestId: string, dto: ProvideMissingInfoDto, role: UserRole, userId?: string): any;
    /**
     * Organizer sends proposal
     */
    sendProposal(requestId: string, dto: SendProposalDto, role: UserRole, userId?: string): any;
    /**
     * Organizer revises existing proposal
     */
    reviseProposal(requestId: string, dto: ReviseProposalDto, role: UserRole, userId?: string): any;
    /**
     * Organizer rejects request with mandatory reason
     */
    rejectRequest(requestId: string, dto: RejectRequestDto, role: UserRole, userId?: string): any;
    /**
     * Client responds to proposal (accept, request_revision, reject, withdraw)
     */
    clientResponse(requestId: string, dto: ClientResponseDto, role: UserRole, userId?: string): any;
    acceptCounteroffer(requestId: string, role: UserRole, userId?: string, acknowledgement?: EventPolicyAcknowledgementDto): any;
    /**
     * Update Agreement Status (agreed, pending_signature, declined)
     */
    updateAgreementStatus(requestId: string, dto: UpdateAgreementStatusDto, role: UserRole, userId?: string): any;
    /**
     * Update Payment Status (unpaid, deposit_pending, deposit_paid, fully_paid)
     */
    updatePaymentStatus(requestId: string, dto: UpdatePaymentStatusDto, role: UserRole, userId?: string): any;
    /**
     * Confirm booking: STRICTLY requires agreementStatus === 'agreed' AND paymentStatus satisfied
     */
    confirmBooking(requestId: string, dto: ConfirmBookingDto, role: UserRole, userId?: string): any;
    /**
     * Generic status updater (backward compatibility)
     */
    updateStatus(requestId: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=event-requests.service.d.ts.map