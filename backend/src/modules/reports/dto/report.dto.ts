import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventReportDto {
  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Organizer ID', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiPropertyOptional({ description: 'Client ID', example: 'cli-001' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Staff ID (if submitted by staff)', example: 'staff-001' })
  @IsString()
  @IsOptional()
  submittedByStaffId?: string;

  @ApiProperty({ description: 'Report title', example: 'Tech Conference 2024 - Final Report' })
  @IsString()
  @IsNotEmpty()
  reportTitle!: string;

  @ApiProperty({ description: 'Report details', example: 'Event was successful with 450 attendees.' })
  @IsString()
  @IsNotEmpty()
  reportDetails!: string;

  @ApiProperty({ description: 'Submission date (YYYY-MM-DD)', example: '2024-06-20' })
  @IsString()
  @IsNotEmpty()
  submissionDate!: string;
}

export class CreateStaffReportDto {
  @ApiProperty({ description: 'Staff ID', example: 'staff-001' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({ description: 'Organizer ID', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Report text', example: 'Event ran smoothly. Check-in was efficient.' })
  @IsString()
  @IsNotEmpty()
  reportText!: string;
}

export class CreateEventReviewDto {
  @ApiProperty({ description: 'Reviewer ID (attendeeId or clientId)', example: 'att-001' })
  @IsString()
  @IsNotEmpty()
  reviewerId!: string;

  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Rating (1–5)', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Review comment', example: 'Excellent event!' })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}

export class CreateStaffReviewDto {
  @ApiProperty({ description: 'Organizer ID (reviewer)', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  reviewerId!: string;

  @ApiProperty({ description: 'Staff ID being reviewed', example: 'staff-001' })
  @IsString()
  @IsNotEmpty()
  staffId!: string;

  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Rating (1–5)', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ description: 'Review comment', example: 'Very professional.' })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
