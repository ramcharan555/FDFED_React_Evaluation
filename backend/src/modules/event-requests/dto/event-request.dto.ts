import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min, IsBoolean, IsIn,
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

  @ApiProperty({ description: 'Event type/category', example: 'Corporate Events' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ description: 'Desired event date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsString()
  @IsNotEmpty()
  eventDate!: string;

  @ApiProperty({ description: 'Preferred event start time', example: '18:00' })
  @IsString()
  @IsNotEmpty()
  eventTime!: string;

  @ApiProperty({ description: 'Budget in INR', example: 50000 })
  @IsNumber()
  @IsPositive()
  budget!: number;

  @ApiProperty({ description: 'Expected capacity', example: 200 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty({ description: 'Preferred event city', example: 'Bangalore' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ description: 'Whether the requested date is flexible', enum: ['exact', 'flexible'] })
  @IsString()
  @IsIn(['exact', 'flexible'])
  @IsOptional()
  dateFlexibility?: 'exact' | 'flexible';

  @ApiPropertyOptional({ description: 'Special requirements', example: 'Need catering and live band' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Additional client notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEventRequestStatusDto {
  @ApiProperty({
    description: 'New status for the request',
    enum: ['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'confirmed', 'approved', 'rejected', 'cancelled', 'withdrawn', 'expired'],
    example: 'under_review',
  })
  @IsEnum(['submitted', 'pending', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'confirmed', 'approved', 'rejected', 'cancelled', 'withdrawn', 'expired'])
  @IsNotEmpty()
  status!: 'submitted' | 'pending' | 'under_review' | 'info_requested' | 'proposal_sent' | 'awaiting_client' | 'confirmed' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn' | 'expired';
}

export class RequestMissingInfoDto {
  @ApiProperty({ description: 'Query / question requesting missing information from the client', example: 'Could you specify the preferred AV equipment and catering dietary preferences?' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class ProvideMissingInfoDto {
  @ApiProperty({ description: 'Client response to the missing info request', example: 'We require 3 wireless microphones, 4K projector, and 20% vegetarian meals.' })
  @IsString()
  @IsNotEmpty()
  response!: string;
}

export class SendProposalDto {
  @ApiProperty({ description: 'Total proposed amount in INR', example: 60000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'Required deposit amount in INR', example: 15000 })
  @IsNumber()
  @Min(0)
  depositRequired!: number;

  @ApiPropertyOptional({ description: 'Proposed event date if different (YYYY-MM-DD)', example: '2026-09-05' })
  @IsString()
  @IsOptional()
  proposedDate?: string;

  @ApiProperty({ description: 'Proposal validity expiration date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsString()
  @IsNotEmpty()
  validUntil!: string;

  @ApiPropertyOptional({ description: 'Terms and conditions / deliverables', example: 'Includes full day hall rental, standard audio setup, and buffet catering.' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the client', example: 'Deposit required within 7 days of agreement to lock the venue.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReviseProposalDto extends SendProposalDto {
  @ApiPropertyOptional({ description: 'Reason for proposal revision', example: 'Adjusted catering options and reduced deposit per client request.' })
  @IsString()
  @IsOptional()
  revisionReason?: string;
}

export class RejectRequestDto {
  @ApiProperty({ description: 'Mandatory reason for rejection', example: 'Venue is booked for maintenance on requested dates.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ClientResponseDto {
  @ApiProperty({
    description: 'Client decision on the proposal or request',
    enum: ['accept', 'request_revision', 'reject', 'withdraw'],
    example: 'accept',
  })
  @IsEnum(['accept', 'request_revision', 'reject', 'withdraw'])
  @IsNotEmpty()
  decision!: 'accept' | 'request_revision' | 'reject' | 'withdraw';

  @ApiPropertyOptional({ description: 'Feedback or notes from the client', example: 'We accept the proposal terms and are ready to sign agreement.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAgreementStatusDto {
  @ApiProperty({
    description: 'Agreement status',
    enum: ['not_sent', 'pending_signature', 'agreed', 'declined'],
    example: 'agreed',
  })
  @IsEnum(['not_sent', 'pending_signature', 'agreed', 'declined'])
  @IsNotEmpty()
  agreementStatus!: 'not_sent' | 'pending_signature' | 'agreed' | 'declined';
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Deposit / Payment status',
    enum: ['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded'],
    example: 'deposit_paid',
  })
  @IsEnum(['unpaid', 'deposit_pending', 'deposit_paid', 'fully_paid', 'refunded'])
  @IsNotEmpty()
  paymentStatus!: 'unpaid' | 'deposit_pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
}

export class ConfirmBookingDto {
  @ApiPropertyOptional({ description: 'Force confirm agreement if verified out-of-band', example: true })
  @IsBoolean()
  @IsOptional()
  agreementConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Force confirm deposit if verified out-of-band', example: true })
  @IsBoolean()
  @IsOptional()
  depositConfirmed?: boolean;
}
