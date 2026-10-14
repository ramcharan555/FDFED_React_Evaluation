import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole } from '../../common/constants';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(role: UserRole): any[];
    findOne(id: string, role: UserRole): any;
    create(dto: CreateUserDto, role: UserRole): any;
    update(id: string, dto: UpdateUserDto, role: UserRole, userId: string): any;
    remove(id: string, role: UserRole): any;
    updateStatus(id: string, body: {
        status: 'active' | 'inactive' | 'suspended';
    }, role: UserRole): any;
}
//# sourceMappingURL=users.controller.d.ts.map