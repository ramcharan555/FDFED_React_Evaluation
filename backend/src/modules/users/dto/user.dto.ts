import {
  IsString, IsNotEmpty, IsOptional, IsEmail,
  IsEnum, MinLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/constants';

export class CreateUserDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Password (min 6 chars)', example: 'Pass@123' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.ATTENDEE,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  userRole!: UserRole;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Phone number (10 digits, starts with 6-9)',
    example: '9876543210',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be 10 digits starting with 6, 7, 8, or 9' })
  phoneNo?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Full name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Phone number (10 digits, starts with 6-9)' })
  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be 10 digits starting with 6, 7, 8, or 9' })
  phoneNo?: string;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsEnum(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';
}
