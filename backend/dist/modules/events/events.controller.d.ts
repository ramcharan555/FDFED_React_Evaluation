import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(createEventDto: CreateEventDto, role: UserRole, userId: string): any;
    findAll(role: UserRole, search?: string, status?: string): any[];
    findAllAdmin(search?: string, status?: string): any[];
    getStatistics(): any;
    findOne(id: string): any;
    update(id: string, updateEventDto: UpdateEventDto, role: UserRole, userId: string): any;
    delete(id: string, role: UserRole, userId: string): {
        message: string;
    };
}
//# sourceMappingURL=events.controller.d.ts.map