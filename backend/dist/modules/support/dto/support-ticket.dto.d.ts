export declare class CreateSupportTicketDto {
    requestType: string;
    concern: string;
    description: string;
    attachmentIds?: string[];
}
export declare class UpdateSupportTicketStatusDto {
    status: 'open' | 'in_progress' | 'resolved';
    response?: string;
}
export declare class CreateSupportFollowUpDto {
    message: string;
}
//# sourceMappingURL=support-ticket.dto.d.ts.map