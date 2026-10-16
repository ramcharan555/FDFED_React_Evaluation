import { UserRole } from '../../common/constants';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
export declare class EventPlansService {
    private db;
    constructor();
    create(dto: CreateEventPlanDto, role: UserRole): any;
    findAll(role: UserRole, userId?: string): any[];
    findOne(planId: string): any;
    updateApproval(planId: string, dto: UpdateEventPlanApprovalDto, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=event-plans.service.d.ts.map