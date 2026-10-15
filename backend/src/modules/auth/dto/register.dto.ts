import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../common/constants';
export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(8) @MaxLength(200) password!: string;
  @IsIn([UserRole.ATTENDEE, UserRole.CLIENT, UserRole.EVENT_ORGANIZER, UserRole.EVENT_STAFF]) userRole!: UserRole;
  @IsOptional() @IsString() @Matches(/^[6-9]\d{9}$/) phoneNo?: string;
}
