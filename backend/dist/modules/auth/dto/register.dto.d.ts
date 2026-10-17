import { UserRole } from '../../../common/constants';
import { CreateUserDto } from '../../users/dto/user.dto';
export declare class RegisterDto extends CreateUserDto {
    userRole: UserRole;
    profile?: Record<string, unknown>;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
//# sourceMappingURL=register.dto.d.ts.map