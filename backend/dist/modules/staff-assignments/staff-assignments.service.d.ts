import { UserRole } from '../../common/constants';
import { CreateStaffAssignmentDto, UpdateAssignmentStatusDto } from './dto/staff-assignment.dto';
export declare class StaffAssignmentsService {
    private db;
    constructor();
    create(dto: CreateStaffAssignmentDto, role: UserRole): any;
    findAll(role: UserRole, userId?: string): any[];
    updateStatus(id: string, dto: UpdateAssignmentStatusDto, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=staff-assignments.service.d.ts.map