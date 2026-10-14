import { EventStaff } from '../../common/data-store';
import { CreateStaffDto, UpdateStaffDto } from './dtos/staff.dto';
import { UserRole } from '../../common/constants';
export declare class StaffService {
    private dataStore;
    constructor();
    create(createStaffDto: CreateStaffDto, role: UserRole): EventStaff;
    findAll(role: UserRole, search?: string): any[];
    findOne(staffId: string, role: UserRole): any;
    update(staffId: string, updateStaffDto: UpdateStaffDto, role: UserRole, userId?: string): any;
    assignEvent(staffId: string, eventId: string, role: UserRole): any;
    delete(staffId: string, role: UserRole): {
        message: string;
    };
    getStatistics(): any;
}
//# sourceMappingURL=staff.service.d.ts.map