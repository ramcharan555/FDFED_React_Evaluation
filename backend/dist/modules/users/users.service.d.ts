import { UserRole } from '../../common/constants';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersService {
    private db;
    constructor();
    findAll(role: UserRole): any[];
    findOne(userId: string, role: UserRole): any;
    create(dto: CreateUserDto, role: UserRole): any;
    update(userId: string, dto: UpdateUserDto, role: UserRole, requesterId: string): any;
    remove(userId: string, role: UserRole): any;
    updateStatus(userId: string, status: 'active' | 'inactive' | 'suspended', role: UserRole): any;
}
//# sourceMappingURL=users.service.d.ts.map