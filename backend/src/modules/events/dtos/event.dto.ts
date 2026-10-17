import { ArrayMaxSize, IsArray, IsBoolean, IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, Min, MinLength, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { EventPolicyAcknowledgementDto } from '../../../common/event-policy';

export class CancelClientEventDto extends EventPolicyAcknowledgementDto {
  @ApiProperty({ description: 'Reason for cancelling the event (10–1000 characters)' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;

  @ApiProperty({ description: 'Amount paid shown in the cancellation preview; prevents accepting a stale fee quote' })
  @IsNumber()
  @Min(0)
  expectedPaidAmount!: number;
}

export class CreateEventDto {
  @IsIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() city?: string;

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
  @Min(1)
  @IsNotEmpty()
  capacity!: number;

  @ApiProperty({
    description: 'Ticket price',
    example: 99,
  })
  @IsNumber()
  @Min(0)
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

  @IsString() @IsOptional() registrationDeadline?: string;
  @IsString() @IsOptional() cancellationDeadline?: string;
  @IsString() @IsOptional() eligibility?: string;
  @IsBoolean() @IsOptional() waitlistEnabled?: boolean;
}

export class EventPreparationTaskDto {
  @IsString() @IsOptional() taskId?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title!: string;
  @IsString() @IsNotEmpty() deadline!: string;
  @IsIn(['pending', 'in_progress', 'completed']) status!: 'pending' | 'in_progress' | 'completed';
}

export class UpdateEventDto {
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() city?: string;

  @ApiProperty({
    description: 'Event name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Event category',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  category?: string;

  @ApiProperty({
    description: 'Event date (YYYY-MM-DD)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  date?: string;

  @ApiProperty({
    description: 'Event time (HH:MM AM/PM)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  time?: string;

  @ApiProperty({
    description: 'Event location',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  location?: string;

  @ApiProperty({
    description: 'Event capacity',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @ApiProperty({
    description: 'Ticket price',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  ticketPrice?: number;

  @ApiProperty({
    description: 'Event status',
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

  @IsString() @IsOptional() registrationDeadline?: string;
  @IsString() @IsOptional() cancellationDeadline?: string;
  @IsString() @IsOptional() eligibility?: string;
  @IsBoolean() @IsOptional() waitlistEnabled?: boolean;

  @IsString() @IsOptional() @MinLength(10) @MaxLength(1000) changeReason?: string;

  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => EventPreparationTaskDto)
  @IsOptional()
  preparationTasks?: EventPreparationTaskDto[];
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
