import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/registration.dto';
import { UserRole } from '../../common/constants';
export declare class RegistrationsController {
    private readonly service;
    constructor(service: RegistrationsService);
    create(dto: CreateRegistrationDto, role: UserRole): Promise<any>;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string): any;
}
//# sourceMappingURL=registrations.controller.d.ts.map