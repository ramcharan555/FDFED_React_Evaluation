import { UserRole } from '../../common/constants';
import { VerifyAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceService {
    private db;
    constructor();
    verify(dto: VerifyAttendanceDto, role: UserRole, userId?: string): any;
    findAll(role: UserRole, eventId?: string, userId?: string): any[];
    findByEvent(eventId: string): any[];
    reconcileNoShows(eventId: string, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=attendance.service.d.ts.map