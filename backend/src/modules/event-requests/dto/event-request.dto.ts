import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventRequestDto {
  @ApiProperty({ description: 'Client ID', example: 'cli-001' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ description: 'Organizer ID to send request to', example: 'org-001' })
  @IsString()
  @IsNotEmpty()
  organizerId!: string;

  @ApiProperty({ description: 'Event name', example: 'Annual Company Gala' })
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @ApiProperty({ description: 'Desired event date (YYYY-MM-DD)', example: '2024-09-01' })
  @IsString()
  @IsNotEmpty()
  eventDate!: string;

  @ApiProperty({ description: 'Budget in INR', example: 50000 })
  @IsNumber()
  @IsPositive()
  budget!: number;

  @ApiProperty({ description: 'Expected capacity', example: 200 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ description: 'Special requirements', example: 'Need catering and live band' })
  @IsString()
  @IsOptional()
  requirements?: string;
}

export class UpdateEventRequestStatusDto {
  @ApiProperty({
    description: 'New status for the request',
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    example: 'approved',
  })
  @IsEnum(['pending', 'approved', 'rejected', 'cancelled'])
  @IsNotEmpty()
  status!: 'pending' | 'approved' | 'rejected' | 'cancelled';
}
