import { AttendeesService } from './attendees.service';
import { CreateAttendeeDto, UpdateAttendeeDto } from './dtos/attendee.dto';
import { UserRole } from '../../common/constants';
export declare class AttendeesController {
    private readonly attendeesService;
    constructor(attendeesService: AttendeesService);
    create(createAttendeeDto: CreateAttendeeDto, role: UserRole): any;
    findAll(role: UserRole, search?: string): any[];
    getStatistics(): any;
    findByEvent(eventId: string, role: UserRole): any[];
    findOne(id: string, role: UserRole): any;
    update(id: string, updateAttendeeDto: UpdateAttendeeDto, role: UserRole, userId: string): any;
    delete(id: string, role: UserRole): {
        message: string;
    };
}
//# sourceMappingURL=attendees.controller.d.ts.map