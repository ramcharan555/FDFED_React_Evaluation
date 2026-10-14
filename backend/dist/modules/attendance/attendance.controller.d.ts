import { AttendanceService } from './attendance.service';
import { VerifyAttendanceDto } from './dto/attendance.dto';
import { UserRole } from '../../common/constants';
export declare class AttendanceController {
    private readonly service;
    constructor(service: AttendanceService);
    verify(dto: VerifyAttendanceDto, role: UserRole): any;
    findAll(role: UserRole, eventId?: string): any[];
}
//# sourceMappingURL=attendance.controller.d.ts.map