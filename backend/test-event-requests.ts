import { EventRequestsService } from './src/modules/event-requests/event-requests.service';
import { UserRole } from './src/common/constants';
import { DataStore } from './src/common/data-store';

async function runTests() {
  console.log('=== RUNNING EVENT REQUESTS SERVICE AUDIT & LIFECYCLE TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  const service = new EventRequestsService();
  const db = DataStore.getInstance();

  // Test 1: Date availability - Past date
  console.log('\n--- 1. Date Availability Checks ---');
  const pastCheck = service.checkDateAvailability('org-001', '2020-01-01');
  assert(!pastCheck.available && pastCheck.pastDate === true, 'Past date identified as unavailable');

  // Test 2: Date availability - Conflicting event date (org-001 on 2026-11-12 has AI Product & Cloud Summit)
  const conflictCheck = service.checkDateAvailability('org-001', '2026-11-12');
  assert(!conflictCheck.available && conflictCheck.conflictEvent !== undefined, 'Conflicting booking detected on organizer calendar');

  // Test 3: Date availability - Free date
  const freeCheck = service.checkDateAvailability('org-001', '2026-11-20');
  assert(freeCheck.available === true, 'Free future date is available for booking');

  // Test 4: Request Creation Validation - Past date
  console.log('\n--- 2. Request Creation & Duplicate Protection ---');
  try {
    service.create({
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Past Event Test',
      eventDate: '2020-05-01',
      budget: 50000,
      capacity: 100,
    }, UserRole.CLIENT, 'usr-client-001');
    assert(false, 'Past date request creation should fail');
  } catch (err: any) {
    assert(err.message.includes('past'), 'Past date request creation blocked with BadRequestException');
  }

  // Test 5: Valid request creation
  const createdRes = service.create({
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Automated Lifecycle Test Gala',
    eventDate: '2026-12-10',
    budget: 65000,
    capacity: 250,
    requirements: 'Stage, PA system, 250 seated dinners',
  }, UserRole.CLIENT, 'usr-client-001');

  const newReq = createdRes.data;
  assert(newReq.status === 'submitted', 'New request created with status "submitted"');
  assert(newReq.agreementStatus === 'not_sent', 'Agreement status initialized to "not_sent"');
  assert(newReq.paymentStatus === 'unpaid', 'Payment status initialized to "unpaid"');
  assert(newReq.auditHistory?.length === 1, 'Audit history initialized with initial submission entry');

  // Test 6: Duplicate request detection
  try {
    service.create({
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Automated Lifecycle Test Gala',
      eventDate: '2026-12-10',
      budget: 65000,
      capacity: 250,
    }, UserRole.CLIENT, 'usr-client-001');
    assert(false, 'Duplicate active request should be blocked');
  } catch (err: any) {
    assert(err.message.includes('already exists'), 'Duplicate request blocked with ConflictException');
  }

  // Test 7: Review start
  console.log('\n--- 3. Review & Missing Information Workflow ---');
  const reviewRes = service.startReview(newReq.requestId, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(reviewRes.data.status === 'under_review', 'Organizer startReview moves status to "under_review"');

  // Test 8: Request missing info
  const infoReqRes = service.requestMissingInfo(newReq.requestId, {
    message: 'What dietary preferences and table configurations are required?'
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(infoReqRes.data.status === 'info_requested', 'Requesting missing info moves status to "info_requested"');
  assert(infoReqRes.data.clarifications?.length === 1, 'Clarification question saved in clarifications thread');

  // Test 9: Provide missing info
  const infoReplyRes = service.provideMissingInfo(newReq.requestId, {
    response: '30 vegetarian meals, round tables of 10.'
  }, UserRole.CLIENT, 'usr-client-001');
  assert(infoReplyRes.data.status === 'under_review', 'Client reply restores status to "under_review"');
  assert(infoReplyRes.data.clarifications?.length === 2, 'Clarification reply appended to thread');

  // Test 10: Proposal Sending & Versioning
  console.log('\n--- 4. Proposal Sending & Version Tracking ---');
  const propRes = service.sendProposal(newReq.requestId, {
    amount: 60000,
    depositRequired: 18000,
    proposedDate: '2026-12-10',
    validUntil: '2026-11-01',
    terms: 'Includes hall, AV, full catering, and cleanup.',
    notes: 'Please review and accept within validity date.'
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(propRes.data.status === 'proposal_sent', 'Sending proposal moves status to "proposal_sent"');
  assert(propRes.data.proposals?.length === 1 && propRes.data.proposals[0].version === 1, 'Proposal v1 recorded');

  // Test 11: Revise Proposal (v2)
  const revPropRes = service.reviseProposal(newReq.requestId, {
    amount: 58000,
    depositRequired: 15000,
    proposedDate: '2026-12-10',
    validUntil: '2026-11-01',
    terms: 'Adjusted package pricing per discussion.',
    revisionReason: 'Discounted deposit requirement per client request'
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(revPropRes.data.proposals?.length === 2 && revPropRes.data.proposals[1].version === 2, 'Proposal v2 recorded with previous version preserved');
  assert(revPropRes.data.proposals[0].status === 'revision_requested', 'Previous proposal marked revision_requested');

  // Test 12: Rejection with Mandatory Reason
  console.log('\n--- 5. Rejection Handling with Mandatory Reason ---');
  const rejectTestReq = service.create({
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Rejection Reason Test',
    eventDate: '2026-12-28',
    budget: 30000,
    capacity: 50,
  }, UserRole.CLIENT, 'usr-client-001').data;

  try {
    service.rejectRequest(rejectTestReq.requestId, { reason: '   ' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
    assert(false, 'Empty rejection reason should fail');
  } catch (err: any) {
    assert(err.message.includes('mandatory') || err.message.includes('required'), 'Empty rejection reason rejected with BadRequestException');
  }

  const rejectRes = service.rejectRequest(rejectTestReq.requestId, {
    reason: 'Fully booked with corporate commitments during holiday week.'
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(rejectRes.data.status === 'rejected', 'Status changed to "rejected"');
  assert(rejectRes.data.rejectionReason === 'Fully booked with corporate commitments during holiday week.', 'Rejection reason preserved in request record');

  // Test 13: Client Decision on Proposal
  console.log('\n--- 6. Client Acceptance & Confirmation Conditions ---');
  const acceptRes = service.clientResponse(newReq.requestId, {
    decision: 'accept',
    notes: 'We accept proposal v2 terms.'
  }, UserRole.CLIENT, 'usr-client-001');
  assert(acceptRes.data.status === 'awaiting_client', 'Proposal acceptance moves status to "awaiting_client"');
  assert(acceptRes.data.agreementStatus === 'pending_signature', 'Agreement status updated to "pending_signature"');
  assert(acceptRes.data.paymentStatus === 'deposit_pending', 'Payment status updated to "deposit_pending"');

  // Test 14: Confirm Booking BEFORE agreement signed -> FAILS
  try {
    service.confirmBooking(newReq.requestId, {}, UserRole.EVENT_ORGANIZER, 'usr-org-001');
    assert(false, 'Confirm booking without agreement should fail');
  } catch (err: any) {
    assert(err.message.includes('agreement'), 'Booking confirmation blocked when agreement is not signed');
  }

  // Test 15: Mark agreement signed, but deposit unpaid -> FAILS
  service.updateAgreementStatus(newReq.requestId, { agreementStatus: 'agreed' }, UserRole.CLIENT, 'usr-client-001');
  try {
    service.confirmBooking(newReq.requestId, {}, UserRole.EVENT_ORGANIZER, 'usr-org-001');
    assert(false, 'Confirm booking without deposit should fail');
  } catch (err: any) {
    assert(err.message.includes('deposit') || err.message.includes('payment'), 'Booking confirmation blocked when deposit is not paid');
  }

  // Test 16: Mark deposit paid -> Confirmation SUCCEEDS & Event Created
  service.updatePaymentStatus(newReq.requestId, { paymentStatus: 'deposit_paid' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  const confirmRes = service.confirmBooking(newReq.requestId, {}, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert(confirmRes.data.status === 'confirmed', 'Request status moved to "confirmed"');
  assert(confirmRes.data.eventId !== undefined, 'Linked eventId set on request');
  
  const createdEvent = db.events.find(e => e.eventId === confirmRes.data.eventId);
  assert(createdEvent !== undefined && createdEvent.name === newReq.eventName, 'New event record successfully created in events store');
  assert(confirmRes.data.auditHistory?.some((a: any) => a.action.includes('Booking Confirmed')), 'Booking confirmed logged in audit trail');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
