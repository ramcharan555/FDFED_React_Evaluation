import { UserRole } from '../../common/constants';
import { CreatePaymentDto } from './dto/payment.dto';
export declare class PaymentsService {
    private db;
    private processingRegistrations;
    constructor();
    create(dto: CreatePaymentDto, role: UserRole, userId?: string): Promise<any>;
    processRefund(refundId: string, role: UserRole): any;
    findAll(role: UserRole, userId?: string): any[];
    findOne(id: string, role: UserRole, userId?: string): any;
}
//# sourceMappingURL=payments.service.d.ts.map