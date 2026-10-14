import { CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { UserRole } from '../../common/constants';
export declare class EventsService {
    private dataStore;
    constructor();
    create(createEventDto: CreateEventDto, role: UserRole, organizerId?: string): any;
    private mapEventToFrontend;
    findAll(role: UserRole, search?: string, status?: string): any[];
    findAllPublic(search?: string): any[];
    findAllAdmin(search?: string, status?: string): any[];
    findOne(eventId: string): any;
    update(eventId: string, updateEventDto: UpdateEventDto, role: UserRole, userId?: string): any;
    delete(eventId: string, role: UserRole, userId?: string): {
        message: string;
    };
    publish(eventId: string, role: UserRole, userId?: string): any;
    getStatistics(): any;
}
//# sourceMappingURL=events.service.d.ts.map