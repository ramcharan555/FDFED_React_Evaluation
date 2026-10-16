import { IsBoolean, IsString, IsNotEmpty, IsOptional, IsIn, MinLength, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ description: 'Attendee ID', example: 'att-001' })
  @IsString()
  @IsNotEmpty()
  attendeeId!: string;

  @ApiProperty({ description: 'Event ID', example: 'evt-001' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({ description: 'Ticket type', example: 'General Admission', enum: ['General Admission', 'VIP', 'Early Bird'] })
  @IsString()
  @IsNotEmpty()
  ticketType!: string;

  @ApiPropertyOptional({ description: 'Additional information', example: 'Vegetarian meal preference' })
  @IsString()
  @IsOptional()
  additionalInfo?: string;

  @ApiPropertyOptional({ description: 'Join the waitlist when the event is full' })
  @IsBoolean()
  @IsOptional()
  joinWaitlist?: boolean;
}

export class CancelRegistrationDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class UpdateRegistrationDetailsDto {
  @ApiPropertyOptional({ description: 'Corrected attendee-provided registration information' })
  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

export class ReviewRegistrationDto {
  @ApiProperty({ enum: ['approved', 'rejected'], description: 'Organizer registration decision' })
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Required when declining; shared with the attendee', minLength: 10, maxLength: 1000 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf(dto => dto.decision === 'rejected' || dto.reason !== undefined)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason?: string;
}
