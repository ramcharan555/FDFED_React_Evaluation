import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendeeDto {
  @ApiProperty({
    description: 'Attendee name',
    example: 'Iris Attendee',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Attendee email',
    example: 'attendee@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Attendee phone',
    example: '9876543210',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Attendee password',
    example: 'Attendee@123',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

export class UpdateAttendeeDto {
  @ApiProperty({
    description: 'Attendee name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Attendee email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Attendee phone',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Attendee status',
    enum: ['active', 'inactive', 'suspended'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';
}

export class AttendeeResponseDto {
  attendeeId!: string;
  userId!: string;
  name!: string;
  email!: string;
  phone?: string;
  status!: string;
  createdAt!: Date;
}
