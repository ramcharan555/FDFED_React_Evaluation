import { EventsService } from './events.service';
import { CancelClientEventDto, CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(createEventDto: CreateEventDto, role: UserRole, userId: string): any;
    findAll(role: UserRole, search?: string, status?: string): any[];
    findAllAdmin(role: UserRole, search?: string, status?: string): any[];
    getStatistics(): any;
    findOne(id: string, role: UserRole, userId: string): any;
    completeClientEvent(id: string, role: UserRole, userId: string): any;
    cancellationPreview(id: string, role: UserRole, userId: string): {
        success: boolean;
        data: {
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
    };
    cancelClientEvent(id: string, dto: CancelClientEventDto, role: UserRole, userId: string): any;
    update(id: string, updateEventDto: UpdateEventDto, role: UserRole, userId: string): any;
    delete(id: string, role: UserRole, userId: string): {
        message: string;
    };
}
//# sourceMappingURL=events.controller.d.ts.map