import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Staff member name',
    example: 'Frank Staff',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Staff email',
    example: 'staff@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Staff phone',
    example: '9876543210',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Available dates (YYYY-MM-DD)',
    example: ['2024-06-01', '2024-06-15'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  availableDates?: string[];

  @ApiProperty({
    description: 'Staff password',
    example: 'Staff@123',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

export class UpdateStaffDto {
  @ApiProperty({
    description: 'Staff name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Staff email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Available dates (YYYY-MM-DD)',
    required: false,
  })
  @IsArray()
  @IsOptional()
  availableDates?: string[];

  @ApiProperty({
    description: 'Staff availability status',
    enum: ['available', 'unavailable', 'busy'],
    required: false,
  })
  @IsIn(['available', 'unavailable', 'busy'])
  @IsOptional()
  status?: 'available' | 'unavailable' | 'busy';

  @ApiProperty({
    description: 'Staff phone number',
    example: '9876543210',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class StaffResponseDto {
  staffId!: string;
  userId!: string;
  name!: string;
  email!: string;
  phone?: string;
  availableDates!: string[];
  rating!: number;
  status!: string;
  createdAt!: Date;
}
