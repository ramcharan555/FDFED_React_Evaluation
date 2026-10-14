import { UserRole } from '../../common/constants';
import { CreateRegistrationDto } from './dto/registration.dto';
export declare class RegistrationsService {
    private db;
    constructor();
    create(dto: CreateRegistrationDto, role: UserRole): Promise<any>;
    findAll(role: UserRole, userId?: string): any[];
    findOne(id: string): any;
}
//# sourceMappingURL=registrations.service.d.ts.map