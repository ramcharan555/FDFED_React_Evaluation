import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, IsEnum, IsInt, Min, IsBoolean, IsIn, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventPolicyAcknowledgementDto } from '../../../common/event-policy';

export class CreateEventRequestDto extends EventPolicyAcknowledgementDto {
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
  @IsDateString()
  eventDate!: string;

  @ApiPropertyOptional({ description: 'Preferred event start time', example: '18:00' })
  @IsString()
  @IsOptional()
  eventTime?: string;

  @ApiProperty({ description: 'Budget in INR', example: 50000 })
  @IsNumber()
  @IsPositive()
  budget!: number;

  @ApiProperty({ description: 'Expected capacity', example: 200 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ description: 'Preferred event city', example: 'Bangalore' })
  @IsString()
  @IsOptional()
  city?: string;

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

  @ApiPropertyOptional({ description: 'Preferred venue' })
  @IsString()
  @IsOptional()
  venue?: string;
}

export class UpdateEventRequestStatusDto {
  @ApiProperty({
    description: 'The only generic status transition supported; use dedicated workflow actions for all others',
    enum: ['under_review'],
    example: 'under_review',
  })
  @IsIn(['under_review'])
  @IsNotEmpty()
  status!: 'under_review';
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

  @ApiPropertyOptional({ description: 'Event plan and execution details' })
  @IsString()
  @IsOptional()
  eventPlan?: string;

  @ApiPropertyOptional({ description: 'Execution timeline' })
  @IsString()
  @IsOptional()
  timeline?: string;

  @ApiPropertyOptional({ description: 'Organizer management fee in INR' })
  @IsNumber()
  @IsOptional()
  organizerFee?: number;

  @ApiPropertyOptional({ description: 'Itemized costs description or breakdown' })
  @IsString()
  @IsOptional()
  itemizedCosts?: string;

  @ApiPropertyOptional({ description: 'Taxes in INR' })
  @IsNumber()
  @IsOptional()
  taxes?: number;

  @ApiPropertyOptional({ description: 'Included services' })
  @IsString()
  @IsOptional()
  includedServices?: string;

  @ApiPropertyOptional({ description: 'Excluded services' })
  @IsString()
  @IsOptional()
  excludedServices?: string;

  @ApiPropertyOptional({ description: 'Attendee capacity limit' })
  @IsInt()
  @IsOptional()
  attendeeCapacity?: number;

  @ApiPropertyOptional({ description: 'Venue, resource, and budget constraints' })
  @IsString()
  @IsOptional()
  constraints?: string;

  @ApiPropertyOptional({ description: 'Payment schedule and terms' })
  @IsString()
  @IsOptional()
  paymentSchedule?: string;

  @ApiPropertyOptional({ description: 'Cancellation deadline and refund terms' })
  @IsString()
  @IsOptional()
  cancellationTerms?: string;

  @ApiPropertyOptional({ description: 'Additional conditions' })
  @IsString()
  @IsOptional()
  conditions?: string;
}

export class ReviseProposalDto extends SendProposalDto {
  @ApiPropertyOptional({ description: 'Reason for proposal revision', example: 'Adjusted catering options and reduced deposit per client request.' })
  @IsString()
  @IsOptional()
  revisionReason?: string;
}

export class RejectRequestDto {
  @IsBoolean()
  @IsOptional()
  policyAccepted?: boolean;

  @IsString()
  @IsOptional()
  acceptedPolicyVersion?: string;

  @ApiProperty({ description: 'Reason for a permanent rejection or requested change', example: 'The requested date is unavailable.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ enum: ['budget', 'date', 'both', 'other', 'permanent'] })
  @IsEnum(['budget', 'date', 'both', 'other', 'permanent'])
  @IsOptional()
  reasonType?: 'budget' | 'date' | 'both' | 'other' | 'permanent';

  @ApiPropertyOptional({ description: 'Proposed budget when requesting a budget change' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  proposedBudget?: number;

  @ApiPropertyOptional({ description: 'Proposed date when requesting a date change' })
  @IsString()
  @IsOptional()
  @IsDateString()
  proposedDate?: string;

  @ApiPropertyOptional({ description: 'Optional additional comments or context for rejection' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class ClientResponseDto {
  @ApiProperty({
    description: 'Client decision on the proposal or request',
    enum: ['accept', 'request_revision', 'reject', 'withdraw', 'accept_changes', 'reject_changes', 'counteroffer'],
    example: 'accept',
  })
  @IsEnum(['accept', 'request_revision', 'reject', 'withdraw', 'accept_changes', 'reject_changes', 'counteroffer'])
  @IsNotEmpty()
  decision!: 'accept' | 'request_revision' | 'reject' | 'withdraw' | 'accept_changes' | 'reject_changes' | 'counteroffer';

  @ApiPropertyOptional({ description: 'Feedback or notes from the client', example: 'We accept the proposal terms and are ready to sign agreement.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Client counteroffer budget' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  counterofferBudget?: number;

  @ApiPropertyOptional({ description: 'Client counteroffer date' })
  @IsString()
  @IsOptional()
  @IsDateString()
  counterofferDate?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event title' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  counterofferEventName?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event type' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  counterofferEventType?: string;

  @ApiPropertyOptional({ description: 'Counteroffer guest capacity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  counterofferCapacity?: number;

  @ApiPropertyOptional({ description: 'Counteroffer preferred venue' })
  @IsString()
  @IsOptional()
  counterofferVenue?: string;

  @ApiPropertyOptional({ description: 'Counteroffer event requirements' })
  @IsString()
  @IsOptional()
  counterofferRequirements?: string;
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
}

export class PayDepositDto {
  @ApiPropertyOptional({ description: 'Payment method', example: 'DEMO_PROVIDER' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class RequestEventModificationDto {
  @ApiPropertyOptional({ description: 'New proposed event date' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'New proposed venue' })
  @IsString()
  @IsOptional()
  venue?: string;

  @ApiPropertyOptional({ description: 'New expected attendee count' })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'New budget' })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ description: 'New or updated requirements/services' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Updated services' })
  @IsString()
  @IsOptional()
  services?: string;

  @ApiProperty({ description: 'Reason for the requested changes' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RespondToEventModificationDto {
  @ApiProperty({ description: 'Approval decision', enum: ['approve', 'reject'] })
  @IsEnum(['approve', 'reject'])
  @IsNotEmpty()
  action!: 'approve' | 'reject';

  @ApiPropertyOptional({ description: 'Reason for rejection or approval note' })
  @IsString()
  @IsOptional()
  reason?: string;
}
