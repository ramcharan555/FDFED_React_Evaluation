export declare class CreateEventPlanDto {
    requestId?: string;
    eventId?: string;
    clientId?: string;
    organizerId?: string;
    title: string;
    description: string;
    budget: number;
    capacity: number;
    schedule?: string;
    services?: string;
    arrangements?: string;
    budgetBreakdown?: string;
}
export declare class UpdateEventPlanApprovalDto {
    approvalStatus: 'approved' | 'rejected' | 'revision_requested';
    reason?: string;
}
//# sourceMappingURL=event-plan.dto.d.ts.map