import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventPlanDto {
  @ApiPropertyOptional({ description: 'Event request this plan fulfils', example: 'req-001' })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Event ID (if event already created)', example: 'evt-001' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Client ID (derived from the event request)', example: 'cli-001' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Organizer ID (derived from the event request)', example: 'org-001' })
  @IsString()
  @IsOptional()
  organizerId?: string;

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

  @ApiPropertyOptional({ description: 'Detailed event schedule' })
  @IsString()
  @IsOptional()
  schedule?: string;

  @ApiPropertyOptional({ description: 'Services included in the plan' })
  @IsString()
  @IsOptional()
  services?: string;

  @ApiPropertyOptional({ description: 'Venue and event arrangements' })
  @IsString()
  @IsOptional()
  arrangements?: string;

  @ApiPropertyOptional({ description: 'Itemized budget breakdown' })
  @IsString()
  @IsOptional()
  budgetBreakdown?: string;
}

export class UpdateEventPlanApprovalDto {
  @ApiProperty({
    description: 'Approval status',
    enum: ['approved', 'rejected', 'revision_requested'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected', 'revision_requested'])
  @IsNotEmpty()
  approvalStatus!: 'approved' | 'rejected' | 'revision_requested';

  @ApiPropertyOptional({ description: 'Reason for requesting a revised plan' })
  @IsString()
  @IsOptional()
  reason?: string;
}
