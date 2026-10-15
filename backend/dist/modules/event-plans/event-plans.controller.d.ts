import { EventPlansService } from './event-plans.service';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
import { UserRole } from '../../common/constants';
export declare class EventPlansController {
    private readonly service;
    constructor(service: EventPlansService);
    create(dto: CreateEventPlanDto, role: UserRole, userId: string): any;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string, role: UserRole, userId: string): any;
    updateApproval(id: string, dto: UpdateEventPlanApprovalDto, role: UserRole, userId: string): any;
}
//# sourceMappingURL=event-plans.controller.d.ts.map