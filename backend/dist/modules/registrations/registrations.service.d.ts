import { UserRole } from '../../common/constants';
import { CreateRegistrationDto, UpdateRegistrationDetailsDto } from './dto/registration.dto';
export declare class RegistrationsService {
    private db;
    private attendeeForUser;
    private activeReservation;
    private occupied;
    private assertOwner;
    private issueTicket;
    private notify;
    private enrich;
    create(dto: CreateRegistrationDto, role: UserRole, userId?: string): Promise<any>;
    findAll(role: UserRole, userId?: string): any[];
    findOne(id: string, role: UserRole, userId?: string): any;
    updateDetails(id: string, dto: UpdateRegistrationDetailsDto, role: UserRole, userId?: string): any;
    confirmWaitlist(id: string, role: UserRole, userId?: string): Promise<any>;
    cancel(id: string, reason: string, role: UserRole, userId?: string): any;
    private offerNext;
}
//# sourceMappingURL=registrations.service.d.ts.map