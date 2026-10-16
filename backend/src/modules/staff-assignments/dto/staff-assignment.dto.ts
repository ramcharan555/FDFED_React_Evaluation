import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffAssignmentDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Organizer ID', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiProperty({ description: 'Staff ID', example: 'staff-001' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;
}

export class UpdateAssignmentStatusDto {
  @ApiProperty({
    description: 'Assignment status',
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    example: 'accepted',
  })
  @IsEnum(['pending', 'accepted', 'declined', 'completed', 'cancelled'])
  @IsNotEmpty()
  status!: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
}
