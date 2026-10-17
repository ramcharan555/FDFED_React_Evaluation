import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export interface EventPolicy {
  version: string;
  cancellation: { minimumNoticeDays: number; feePercent: number };
  sections: Array<{ title: string; items: string[] }>;
}

const EVENT_POLICY: EventPolicy = {
  version: '2026-10-17.1',
  cancellation: { minimumNoticeDays: 14, feePercent: 10 },
  sections: [
    { title: 'Event rules', items: [
      'Provide accurate event dates, venue, guest capacity, budget, and requirements.',
      'The client and organizer must agree on venue permissions, safety arrangements, capacity limits, and the services to be provided.',
      'Record changes to the date, budget, venue, or services in the event request and obtain the other party’s approval.',
    ] },
    { title: 'Cancellation and refund policy', items: [
      'The client may cancel an approved ongoing event only when at least 14 days remain before its scheduled start time (India Standard Time).',
      'A cancellation fee of 10% of the amount actually paid is deducted. The refund due is the remaining 90%. No fee is charged if nothing has been paid.',
      'A cancellation reason and confirmation of the fee and refund amount are required. The event and linked request are cancelled, and the organizer is notified.',
      'Any refund due is recorded as pending review. Cancelling the event does not mean the refund has already been paid.',
    ] },
    { title: 'Terms and conditions', items: [
      'Accepting a request starts planning. The event is created only after the client approves the final event plan.',
      'The latest approved plan defines the agreed scope, schedule, services, capacity, and budget. Plan revisions require a reason and a new client approval.',
      'Both parties must acknowledge these rules, policies, and terms. The accepted policy version and acknowledgement times are saved with the request.',
      'Payments and refunds in this application use a demo provider and do not transfer real money.',
    ] },
  ],
};

export function getEventPolicy(): EventPolicy {
  return structuredClone(EVENT_POLICY);
}

export class EventPolicyAcknowledgementDto {
  @ApiProperty({ description: 'Explicit acceptance of the displayed event rules, policies, and terms', example: true })
  @IsBoolean()
  @Equals(true)
  policyAccepted!: boolean;

  @ApiProperty({ description: 'Version of the displayed event policy', example: EVENT_POLICY.version })
  @IsString()
  @IsNotEmpty()
  acceptedPolicyVersion!: string;
}

export function assertEventPolicyAccepted(
  acknowledgement: { policyAccepted?: boolean; acceptedPolicyVersion?: string },
  policy: EventPolicy,
): void {
  if (acknowledgement.policyAccepted !== true || acknowledgement.acceptedPolicyVersion !== policy.version) {
    throw new BadRequestException('Read and accept the displayed event rules, policies, and terms before continuing. Refresh if the policy version has changed.');
  }
}
