import { EventPolicyAcknowledgementDto } from '../../../common/event-policy';
export declare class CancelClientEventDto extends EventPolicyAcknowledgementDto {
    reason: string;
    expectedPaidAmount: number;
}
export declare class CreateEventDto {
    status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    description?: string;
    city?: string;
    name: string;
    category: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    ticketPrice: number;
    organizerId?: string;
    clientId?: string;
    description?: string;
    status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    registrationDeadline?: string;
    cancellationDeadline?: string;
    eligibility?: string;
    waitlistEnabled?: boolean;
}
export declare class UpdateEventDto {
    description?: string;
    city?: string;
    name?: string;
    category?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    ticketPrice?: number;
    status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
    registrationDeadline?: string;
    cancellationDeadline?: string;
    eligibility?: string;
    waitlistEnabled?: boolean;
}
export declare class EventResponseDto {
    eventId: string;
    organizerId: string;
    clientId?: string;
    name: string;
    category: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    ticketPrice: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=event.dto.d.ts.map