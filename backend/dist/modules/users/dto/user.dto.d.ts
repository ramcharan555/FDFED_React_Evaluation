import { UserRole } from '../../../common/constants';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    userRole: UserRole;
    address?: string;
    phoneNo?: string;
    bio?: string;
}
export declare class UpdateUserDto {
    bio?: string;
    name?: string;
    email?: string;
    address?: string;
    phoneNo?: string;
    bio?: string;
    status?: 'active' | 'inactive' | 'suspended';
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
//# sourceMappingURL=user.dto.d.ts.map