import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dtos/staff.dto';
import { UserRole } from '../../common/constants';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    create(createStaffDto: CreateStaffDto, role: UserRole): import("../../common/data-store").EventStaff;
    findAll(role: UserRole, search?: string): any[];
    getStatistics(role: UserRole): any;
    findOne(id: string, role: UserRole): any;
    update(id: string, updateStaffDto: UpdateStaffDto, role: UserRole, userId: string): any;
    delete(id: string, role: UserRole): {
        message: string;
    };
    assignEvent(staffId: string, eventId: string, role: UserRole): any;
}
//# sourceMappingURL=staff.controller.d.ts.map