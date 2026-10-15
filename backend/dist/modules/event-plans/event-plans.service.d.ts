import { createReadStream } from 'fs';
import { UserRole } from '../../common/constants';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
export declare class EventPlansService {
    private db;
    constructor();
    uploadDocument(requestId: string, file: Express.Multer.File, role: UserRole, userId?: string): any;
    create(dto: CreateEventPlanDto, role: UserRole, userId?: string): any;
    private createStandalonePlan;
    findAll(role: UserRole, userId?: string): any[];
    findOne(planId: string, role: UserRole, userId?: string): any;
    getDocument(planId: string, role: UserRole, userId?: string): Promise<{
        stream: ReturnType<typeof createReadStream>;
        fileName: string;
    }>;
    private removeUploadedFile;
    updateApproval(planId: string, dto: UpdateEventPlanApprovalDto, role: UserRole, userId?: string): any;
    private notify;
}
//# sourceMappingURL=event-plans.service.d.ts.map