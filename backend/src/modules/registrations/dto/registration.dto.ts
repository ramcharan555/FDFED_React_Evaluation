import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
} from 'class-validator';
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
}
