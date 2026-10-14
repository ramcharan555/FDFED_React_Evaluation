import { UserRole } from '../../common/constants';
import { CreatePaymentDto } from './dto/payment.dto';
export declare class PaymentsService {
    private db;
    constructor();
    create(dto: CreatePaymentDto, role: UserRole): any;
    findAll(role: UserRole, userId?: string): any[];
    findOne(id: string): any;
}
//# sourceMappingURL=payments.service.d.ts.map