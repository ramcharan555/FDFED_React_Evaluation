import { UserRole } from '../../../common/constants';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    userRole: UserRole;
    address?: string;
    phoneNo?: string;
}
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    address?: string;
    phoneNo?: string;
    status?: 'active' | 'inactive' | 'suspended';
}
//# sourceMappingURL=user.dto.d.ts.map