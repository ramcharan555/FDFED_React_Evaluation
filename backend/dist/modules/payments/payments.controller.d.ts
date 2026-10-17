import { PaymentsService } from './payments.service';
import { CreateEventWorkflowPaymentDto, CreatePaymentDto } from './dto/payment.dto';
import { UserRole } from '../../common/constants';
export declare class PaymentsController {
    private readonly service;
    constructor(service: PaymentsService);
    create(dto: CreatePaymentDto, role: UserRole, userId: string): Promise<any>;
    payForEvent(eventId: string, dto: CreateEventWorkflowPaymentDto, role: UserRole, userId: string): any;
    processRefund(id: string, role: UserRole): any;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string, role: UserRole, userId: string): any;
}
//# sourceMappingURL=payments.controller.d.ts.map