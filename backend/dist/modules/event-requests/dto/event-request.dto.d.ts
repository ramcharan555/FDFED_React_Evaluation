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
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}
//# sourceMappingURL=event-request.dto.d.ts.map