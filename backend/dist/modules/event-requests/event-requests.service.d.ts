import { UserRole } from '../../common/constants';
import { CreateEventRequestDto, UpdateEventRequestStatusDto } from './dto/event-request.dto';
export declare class EventRequestsService {
    private db;
    constructor();
    create(dto: CreateEventRequestDto, role: UserRole): any;
    findAll(role: UserRole, userId?: string): any[];
    findOne(requestId: string, role: UserRole, userId?: string): any;
    updateStatus(requestId: string, dto: UpdateEventRequestStatusDto, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=event-requests.service.d.ts.map