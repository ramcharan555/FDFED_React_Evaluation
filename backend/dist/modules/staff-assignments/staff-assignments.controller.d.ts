import { StaffAssignmentsService } from './staff-assignments.service';
import { CreateStaffAssignmentDto, UpdateAssignmentStatusDto } from './dto/staff-assignment.dto';
import { UserRole } from '../../common/constants';
export declare class StaffAssignmentsController {
    private readonly service;
    constructor(service: StaffAssignmentsService);
    create(dto: CreateStaffAssignmentDto, role: UserRole): any;
    findAll(role: UserRole, userId: string): any[];
    updateStatus(id: string, dto: UpdateAssignmentStatusDto, role: UserRole, userId: string): any;
}
//# sourceMappingURL=staff-assignments.controller.d.ts.map