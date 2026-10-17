import { CancelClientEventDto, CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
export declare class EventsService {
    private dataStore;
    constructor();
    private isActiveReservation;
    create(createEventDto: CreateEventDto, role: UserRole, organizerId?: string): any;
    private mapEventToFrontend;
    findAll(role: UserRole, search?: string, status?: string): any[];
    findAllPublic(search?: string): any[];
    findAllAdmin(role: UserRole, search?: string, status?: string): any[];
    findOne(eventId: string, role: UserRole, userId?: string): any;
    update(eventId: string, updateEventDto: UpdateEventDto, role: UserRole, userId?: string): any;
    private ownClientEvent;
    clientCancellationPreview(eventId: string, role: UserRole, userId?: string): {
        eventId: string;
        canCancel: boolean;
        unavailableReason: string;
        cancellationDeadline: string | null;
        minimumNoticeDays: number;
        paidAmount: number;
        cancellationFeePercent: number;
        cancellationFee: number;
        refundAmount: number;
        policy: import("../../common/event-policy").EventPolicy;
        paymentId: string | undefined;
    };
    cancelClientEvent(eventId: string, dto: CancelClientEventDto, role: UserRole, userId?: string): any;
    completeClientEvent(eventId: string, role: UserRole, userId?: string): any;
    delete(eventId: string, role: UserRole, userId?: string): {
        message: string;
    };
    publish(eventId: string, role: UserRole, userId?: string): any;
    getStatistics(): any;
}
//# sourceMappingURL=events.service.d.ts.map