export declare class CreateEventDto {
    name: string;
    category: string;
    date: string;
    time: string;
    location: string;
    capacity: number;
    ticketPrice: number;
    organizerId?: string;
    clientId?: string;
}
export declare class UpdateEventDto {
    name?: string;
    category?: string;
    date?: string;
    time?: string;
    location?: string;
    capacity?: number;
    ticketPrice?: number;
    status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
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