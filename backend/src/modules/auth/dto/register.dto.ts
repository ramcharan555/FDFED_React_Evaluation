import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants';
import { CreateUserDto } from '../../users/dto/user.dto';

export class RegisterDto extends CreateUserDto {
  @IsIn([UserRole.ATTENDEE, UserRole.CLIENT, UserRole.EVENT_ORGANIZER, UserRole.EVENT_STAFF])
  userRole!: UserRole;

  @IsObject()
  @IsOptional()
  profile?: Record<string, unknown>;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
