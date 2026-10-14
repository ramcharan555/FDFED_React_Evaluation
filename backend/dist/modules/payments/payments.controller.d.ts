import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { UserRole } from '../../common/constants';
export declare class PaymentsController {
    private readonly service;
    constructor(service: PaymentsService);
    create(dto: CreatePaymentDto, role: UserRole): any;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string): any;
}
//# sourceMappingURL=payments.controller.d.ts.map