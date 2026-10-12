import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event name/title',
    example: 'Tech Conference 2024',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Event category/type',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Event date (YYYY-MM-DD)',
    example: '2024-06-15',
  })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({
    description: 'Event time (HH:MM AM/PM)',
    example: '09:00 AM',
  })
  @IsString()
  @IsNotEmpty()
  time!: string;

  @ApiProperty({
    description: 'Event location/venue',
    example: 'Convention Center, New York',
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({
    description: 'Event capacity',
    example: 500,
  })
  @IsNumber()
  @IsNotEmpty()
  capacity!: number;

  @ApiProperty({
    description: 'Ticket price',
    example: 99,
  })
  @IsNumber()
  @IsNotEmpty()
  ticketPrice!: number;

  @ApiProperty({
    description: 'Organizer ID',
    example: 'org-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  organizerId?: string;

  @ApiProperty({
    description: 'Client ID',
    example: 'cli-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  clientId?: string;
}

export class UpdateEventDto {
  @ApiProperty({
    description: 'Event name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Event category',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Event date (YYYY-MM-DD)',
    required: false,
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Event time (HH:MM AM/PM)',
    required: false,
  })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiProperty({
    description: 'Event location',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Event capacity',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: 'Ticket price',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  ticketPrice?: number;

  @ApiProperty({
    description: 'Event status',
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
}

export class EventResponseDto {
  eventId!: string;
  organizerId!: string;
  clientId?: string;
  name!: string;
  category!: string;
  date!: string;
  time!: string;
  location!: string;
  capacity!: number;
  ticketPrice!: number;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
