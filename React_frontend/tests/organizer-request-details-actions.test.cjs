const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const orgRuntime = fs.readFileSync(path.join(__dirname, '../src/apps/organizer/app/runtime.js'), 'utf8');
const clientRuntime = fs.readFileSync(path.join(__dirname, '../src/apps/client/app/runtime.js'), 'utf8');

test('1. Organizer Request Details: contains Accept & Create Proposal, Reject Request, and Back to Requests buttons', () => {
  const vrdStart = orgRuntime.indexOf('function viewRequestDetail(reqId)');
  const vrdEnd = orgRuntime.indexOf('function viewOngoingEventDetail(eventId)', vrdStart);
  assert.ok(vrdStart !== -1, 'viewRequestDetail function exists');
  const vrdSource = orgRuntime.slice(vrdStart, vrdEnd);

  // Prominent action buttons at bottom of request details page
  assert.match(vrdSource, /Accept &amp; Create Proposal|Accept & Create Proposal/);
  assert.match(vrdSource, /Reject Request/);
  assert.match(vrdSource, /Back to Requests/);

  // Client info, event details, and requirements preserved
  assert.match(vrdSource, /Client Information/);
  assert.match(vrdSource, /Event Details/);
  assert.match(vrdSource, /Event Requirements/);
});

test('2. Accept & Create Proposal Form: structured fields include plan, timeline, fee, itemized, taxes, total price, deposit, capacity, constraints, payment terms, cancellation policy, validity, conditions', () => {
  const start = orgRuntime.indexOf('function openSendProposalModal(');
  const end = orgRuntime.indexOf('function simulateClientDecision(', start);
  const source = orgRuntime.slice(start, end);

  // 1. Pricing & Fee Breakdown
  assert.match(source, /id="prop-amount"/);
  assert.match(source, /id="prop-deposit"/);
  assert.match(source, /id="prop-fee"/);
  assert.match(source, /id="prop-taxes"/);
  assert.match(source, /id="prop-itemized"/);

  // 2. Event Plan, Services & Deliverables
  assert.match(source, /id="prop-plan"/);
  assert.match(source, /id="prop-timeline"/);
  assert.match(source, /id="prop-included"/);
  assert.match(source, /id="prop-excluded"/);

  // 3. Capacity & Constraints
  assert.match(source, /id="prop-capacity"/);
  assert.match(source, /id="prop-venue-constraints"/);
  assert.match(source, /id="prop-constraints"/);

  // 4. Payment Schedule & Cancellation Terms
  assert.match(source, /id="prop-schedule"/);
  assert.match(source, /id="prop-cancellation"/);

  // 5. Dates, Validity & Conditions
  assert.match(source, /id="prop-date"/);
  assert.match(source, /id="prop-expiry"/);
  assert.match(source, /id="prop-conditions"/);

  // Check calculation functions
  assert.match(orgRuntime, /function calculateProposalPrice\(\)/);
  assert.match(orgRuntime, /function updateProposalBreakdownFromTotal\(/);
});

test('3. Proposal Submission: sets status to proposal_sent and saves proposal against request', () => {
  const start = orgRuntime.indexOf('async function submitSendProposal(');
  const end = orgRuntime.indexOf('function simulateClientDecision(', start);
  const source = orgRuntime.slice(start, end);

  assert.match(source, /apiSendEventProposal/);
  assert.match(source, /r\.status = 'proposal_sent'/);
  assert.match(source, /r\.agreementStatus = 'not_sent'/);
  assert.match(source, /viewRequestDetail\(id\)/);
});

test('4. Reject Request: confirmation modal requires mandatory reason and optional additional comments', () => {
  const start = orgRuntime.indexOf('function openRejectModal(');
  const end = orgRuntime.indexOf('// Legacy wrappers', start);
  const source = orgRuntime.slice(start, end);

  assert.match(source, /id="reject-reason-txt"/);
  assert.match(source, /Reason for Declining \(Mandatory\)/);
  assert.match(source, /id="reject-comments-txt"/);
  assert.match(source, /Additional Comments \(Optional\)/);
  assert.match(source, /apiRejectEventRequest/);
  assert.match(source, /r\.status = 'rejected'/);
  assert.match(source, /r\.rejectionReason = reason/);
  assert.match(source, /r\.rejectionComments = comments/);
});

test('5. Status & Integration: decision buttons are hidden after terminal status or progressed stage or awaiting client', () => {
  const vrdStart = orgRuntime.indexOf('function viewRequestDetail(reqId)');
  const vrdEnd = orgRuntime.indexOf('function viewOngoingEventDetail(eventId)', vrdStart);
  const vrdSource = orgRuntime.slice(vrdStart, vrdEnd);

  // Logic preventing duplicate proposals and repeated decisions
  assert.match(vrdSource, /isTerminal/);
  assert.match(vrdSource, /isProgressed/);
  assert.match(vrdSource, /isAwaitingClient/);
  assert.match(vrdSource, /canDecide/);
  assert.match(vrdSource, /canManage/);
});

test('6. Client side outcome: displays proposal review actions when PROPOSAL_SENT and rejection reason when REJECTED', () => {
  // Client Request Status page displays review button
  assert.match(clientRuntime, /openClientPlanReview/);
  assert.match(clientRuntime, /Review Plan/);

  // Client Request Status page & drawer display rejection reason and comments
  assert.match(clientRuntime, /Declined:/);
  assert.match(clientRuntime, /Reason for declining/);
  assert.match(clientRuntime, /Additional comments:/);
});
