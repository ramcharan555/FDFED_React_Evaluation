import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto, UpdateEventRequestStatusDto } from './dto/event-request.dto';
import { UserRole } from '../../common/constants';
export declare class EventRequestsController {
    private readonly service;
    constructor(service: EventRequestsService);
    create(dto: CreateEventRequestDto, role: UserRole): any;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string, role: UserRole, userId: string): any;
    updateStatus(id: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId: string): any;
}
//# sourceMappingURL=event-requests.controller.d.ts.map