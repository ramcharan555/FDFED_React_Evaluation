import { RegistrationsService } from './registrations.service';
import { CancelRegistrationDto, CreateRegistrationDto, UpdateRegistrationDetailsDto } from './dto/registration.dto';
import { UserRole } from '../../common/constants';
export declare class RegistrationsController {
    private readonly service;
    constructor(service: RegistrationsService);
    create(dto: CreateRegistrationDto, role: UserRole, userId: string): Promise<any>;
    findAll(role: UserRole, userId: string): any[];
    findOne(id: string, role: UserRole, userId: string): any;
    updateDetails(id: string, dto: UpdateRegistrationDetailsDto, role: UserRole, userId: string): any;
    confirmWaitlist(id: string, role: UserRole, userId: string): Promise<any>;
    cancel(id: string, dto: CancelRegistrationDto, role: UserRole, userId: string): any;
}
//# sourceMappingURL=registrations.controller.d.ts.map