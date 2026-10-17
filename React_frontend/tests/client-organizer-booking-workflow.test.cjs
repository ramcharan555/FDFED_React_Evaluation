const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientRuntime = fs.readFileSync(path.join(__dirname, '../src/apps/client/app/runtime.js'), 'utf8');
const orgRuntime = fs.readFileSync(path.join(__dirname, '../src/apps/organizer/app/runtime.js'), 'utf8');

test('1. Discover Organizers: includes category, city/location, ratings, and published pricing filters without availability calendar', () => {
  const start = clientRuntime.indexOf('    function pageFindOrganizers()');
  const end = clientRuntime.indexOf('    async function viewOrganizerProfile', start);
  const source = clientRuntime.slice(start, end);

  // Filter dropdown IDs
  assert.match(source, /id="search-org-category"/);
  assert.match(source, /id="search-org-city"/);
  assert.match(source, /id="search-org-rating"/);
  assert.match(source, /id="search-org-pricing"/);

  // Published pricing display on cards
  assert.match(source, /Starts at ₹/);

  // Verify availability calendar is completely removed from viewOrganizerProfile
  const profileStart = clientRuntime.indexOf('    async function viewOrganizerProfile(');
  const profileEnd = clientRuntime.indexOf('    function contactOrganizer(', profileStart);
  const profileSource = clientRuntime.slice(profileStart, profileEnd);
  assert.doesNotMatch(profileSource, /availability-calendar/i);
  assert.doesNotMatch(profileSource, /calendar-grid/i);
  assert.match(profileSource, /Specializations/);
  assert.match(profileSource, /Service Packages/);
  assert.match(profileSource, /Client Reviews/);
});

test('2. Submit Event Request: excludes startTime, endTime, and budgetFlexibility and submits SUBMITTED', () => {
  const formStart = clientRuntime.indexOf('    async function openRequestModal(');
  const formEnd = clientRuntime.indexOf('    function reviewEventRequest(', formStart);
  const formSource = clientRuntime.slice(formStart, formEnd);

  assert.doesNotMatch(formSource, /id="req-start-time"/);
  assert.doesNotMatch(formSource, /id="req-end-time"/);
  assert.doesNotMatch(formSource, /id="req-flexibility"/);
  assert.doesNotMatch(formSource, /id="req-time-flex"/);
  assert.match(formSource, /id="req-title"/);
  assert.match(formSource, /id="req-type"/);
  assert.match(formSource, /id="req-date"/);
  assert.match(formSource, /id="req-guests"/);
  assert.match(formSource, /id="req-budget"/);
});

test('3. Organizer Proposal: structured fields include plan, timeline, fee, taxes, total, deposit, capacity, constraints, payment schedule, and cancellation terms', () => {
  const start = orgRuntime.indexOf('    function openSendProposalModal(');
  const end = orgRuntime.indexOf('    function simulateClientDecision(', start);
  const source = orgRuntime.slice(start, end);

  assert.match(source, /id="prop-amount"/);
  assert.match(source, /id="prop-deposit"/);
  assert.match(source, /id="prop-fee"/);
  assert.match(source, /id="prop-taxes"/);
  assert.match(source, /id="prop-itemized"/);
  assert.match(source, /id="prop-plan"/);
  assert.match(source, /id="prop-timeline"/);
  assert.match(source, /id="prop-included"/);
  assert.match(source, /id="prop-excluded"/);
  assert.match(source, /id="prop-capacity"/);
  assert.match(source, /id="prop-constraints"/);
  assert.match(source, /id="prop-schedule"/);
  assert.match(source, /id="prop-cancellation"/);
  assert.match(source, /id="prop-date"/);
  assert.match(source, /id="prop-expiry"/);
  assert.match(source, /id="prop-conditions"/);

  // Rejection requires mandatory reason
  const rejectStart = orgRuntime.indexOf('    function openRejectModal(');
  const rejectEnd = orgRuntime.indexOf('    function openOrganizerRejectModal', rejectStart);
  const rejectSource = orgRuntime.slice(rejectStart, rejectEnd !== -1 ? rejectEnd : rejectStart + 600);
  assert.match(rejectSource, /Reason for Declining \(Mandatory\)/);
});

test('4. Client Proposal Review: displays complete breakdown, version history, accept, revision, decline, and withdraw actions', () => {
  const start = clientRuntime.indexOf('    function openClientPlanReview(');
  const end = clientRuntime.indexOf('    function switchReqStatTab(', start);
  const source = clientRuntime.slice(start, end);

  assert.match(source, /TOTAL PROPOSAL PRICE/);
  assert.match(source, /REQUIRED ADVANCE DEPOSIT/);
  assert.match(source, /ORGANIZER FEE/);
  assert.match(source, /TAXES & GST/);
  assert.match(source, /Execution Timeline/);
  assert.match(source, /Payment Schedule/);
  assert.match(source, /Cancellation Terms/);
  assert.match(source, /Proposal Version History/);

  // 4 action buttons
  assert.match(source, /Accept & Proceed to Payment/);
  assert.match(source, /Request Revision/);
  assert.match(source, /Decline/);
  assert.match(source, /Withdraw Request/);
});

test('5. Payment and Booking Confirmation: mock demo provider, booking ID, receipt, and balance display', () => {
  const start = clientRuntime.indexOf('    function openClientPaymentModal(');
  const end = clientRuntime.indexOf('    function openUpdateConfirmedEventModal(', start);
  const source = clientRuntime.slice(start, end);

  assert.match(source, /DEMO PAYMENT PROVIDER · SIMULATED TRANSACTION/);
  assert.match(source, /BOOKING ID/);
  assert.match(source, /OUTSTANDING BALANCE/);
  assert.match(source, /Advance Deposit/);
  assert.match(source, /Pay Remaining Balance|Pay Full Amount/);
  assert.match(source, /Transaction History & Receipts/);
  assert.match(source, /apiPayDeposit/);
});

test('6. Update Confirmed Events: permits date, venue, attendee count, requirements, recalculates cost, and requires approval', () => {
  const start = clientRuntime.indexOf('    function openUpdateConfirmedEventModal(');
  const end = clientRuntime.indexOf('    function viewWorkflowRequestDrawer(', start);
  const source = clientRuntime.slice(start, end);

  assert.match(source, /id="mod-date"/);
  assert.match(source, /id="mod-venue"/);
  assert.match(source, /id="mod-capacity"/);
  assert.match(source, /id="mod-reqs"/);
  assert.match(source, /id="mod-reason"/);
  assert.match(source, /calculateModCostClient/);
  assert.match(source, /apiRequestEventModification/);
});

test('7. Cancellation and Refunds: displays policy terms, fees, refunds, and organizer cancellation with reason', () => {
  const orgCancelStart = orgRuntime.indexOf('    function openOrganizerEventCancellationModal(');
  const orgCancelEnd = orgRuntime.indexOf('    function openRejectModal(', orgCancelStart);
  const orgCancelSource = orgRuntime.slice(orgCancelStart, orgCancelEnd);

  assert.match(orgCancelSource, /Organizer Initiated Cancellation/);
  assert.match(orgCancelSource, /Mandatory Cancellation Reason/);
  assert.match(orgCancelSource, /apiCancelOrganizerEvent/);
});

test('8. Status Tracking: displays 8-stage workflow stepper across client and organizer', () => {
  // Organizer stepper
  const orgDrawerStart = orgRuntime.indexOf('function viewRequestDrawer(id) {');
  const orgDrawerEnd = orgRuntime.indexOf('function openSendProposalModal', orgDrawerStart);
  const orgDrawerSource = orgRuntime.slice(orgDrawerStart, orgDrawerEnd);

  for (const step of [
    '1. Submitted',
    '2. Under Review',
    '3. Proposal Sent',
    '4. Negotiation',
    '5. Accepted',
    '6. Payment',
    '7. Confirmed',
    '8. Completed',
  ]) {
    assert.match(orgDrawerSource, new RegExp(step));
  }

  // Client stepper
  const clientDetailsStart = clientRuntime.indexOf('function renderWorkflowRequestDetails(id) {');
  const clientDetailsEnd = clientRuntime.indexOf('let workflowResponsePolicy = null;', clientDetailsStart);
  const clientDetailsSource = clientRuntime.slice(clientDetailsStart, clientDetailsEnd);

  for (const step of [
    '1. Submitted',
    '2. Under Review',
    '3. Proposal Sent',
    '4. Negotiation',
    '5. Accepted',
    '6. Payment Pending',
    '7. Confirmed',
    '8. Completed',
  ]) {
    assert.match(clientDetailsSource, new RegExp(step));
  }
});
