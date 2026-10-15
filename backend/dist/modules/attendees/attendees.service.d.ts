import { CreateAttendeeDto, UpdateAttendeeDto } from './dtos/attendee.dto';
import { UserRole } from '../../common/constants';
export declare class AttendeesService {
    private dataStore;
    constructor();
    private mapAttendeeToFrontend;
    create(createAttendeeDto: CreateAttendeeDto, role: UserRole): any;
    findAll(role: UserRole, search?: string): any[];
    findOne(attendeeId: string, role: UserRole, userId?: string): any;
    findByEvent(eventId: string, role: UserRole, userId?: string): any[];
    update(attendeeId: string, updateAttendeeDto: UpdateAttendeeDto, role: UserRole, userId?: string): any;
    delete(attendeeId: string, role: UserRole): {
        message: string;
    };
    getStatistics(): any;
}
//# sourceMappingURL=attendees.service.d.ts.map