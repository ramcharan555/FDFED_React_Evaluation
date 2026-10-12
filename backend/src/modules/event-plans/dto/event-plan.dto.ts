import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventPlanDto {
  @ApiPropertyOptional({ description: 'Event ID (if event already created)', example: 'evt-001' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ description: 'Client ID', example: 'cli-001' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ description: 'Organizer ID', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiProperty({ description: 'Plan title', example: 'Tech Conference Full Plan' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Plan description', example: 'Complete event plan including speakers and schedule' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Budget in INR', example: 75000 })
  @IsNumber()
  @IsPositive()
  budget!: number;

  @ApiProperty({ description: 'Capacity', example: 500 })
  @IsInt()
  @Min(1)
  capacity!: number;
}

export class UpdateEventPlanApprovalDto {
  @ApiProperty({
    description: 'Approval status',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected'])
  @IsNotEmpty()
  approvalStatus!: 'approved' | 'rejected';
}
