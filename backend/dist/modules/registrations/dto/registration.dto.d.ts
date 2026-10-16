export declare class CreateRegistrationDto {
    attendeeId: string;
    eventId: string;
    ticketType: string;
    additionalInfo?: string;
    joinWaitlist?: boolean;
}
export declare class CancelRegistrationDto {
    reason: string;
}
export declare class UpdateRegistrationDetailsDto {
    additionalInfo?: string;
}
export declare class ReviewRegistrationDto {
    decision: 'approved' | 'rejected';
    reason?: string;
}
//# sourceMappingURL=registration.dto.d.ts.map