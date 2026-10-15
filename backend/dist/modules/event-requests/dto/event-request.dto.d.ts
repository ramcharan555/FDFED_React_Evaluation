export declare class CreateEventRequestDto {
    clientId: string;
    organizerId: string;
    eventName: string;
    eventDate: string;
    budget: number;
    capacity: number;
    requirements?: string;
}
export declare class UpdateEventRequestStatusDto {
    status: 'submitted' | 'pending' | 'under_review' | 'info_requested' | 'proposal_sent' | 'awaiting_client' | 'confirmed' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn' | 'expired';
}
export declare class RequestMissingInfoDto {
    message: string;
}
export declare class ProvideMissingInfoDto {
    response: string;
}
export declare class SendProposalDto {
    amount: number;
    depositRequired: number;
    proposedDate?: string;
    validUntil: string;
    terms?: string;
    notes?: string;
}
export declare class ReviseProposalDto extends SendProposalDto {
    revisionReason?: string;
}
export declare class RejectRequestDto {
    reason: string;
}
export declare class ClientResponseDto {
    decision: 'accept' | 'request_revision' | 'reject' | 'withdraw';
    notes?: string;
}
export declare class UpdateAgreementStatusDto {
    agreementStatus: 'not_sent' | 'pending_signature' | 'agreed' | 'declined';
}
export declare class UpdatePaymentStatusDto {
    paymentStatus: 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
}
export declare class ConfirmBookingDto {
    agreementConfirmed?: boolean;
    depositConfirmed?: boolean;
}
//# sourceMappingURL=event-request.dto.d.ts.map