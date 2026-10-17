const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sources = Object.fromEntries(['client', 'organizer'].map(role => [role, fs.readFileSync(path.join(__dirname, `../src/apps/${role}/app/runtime.js`), 'utf8')]));
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const policy = { version: 'test-policy-1', cancellation: { minimumNoticeDays: 14, feePercent: 10 }, sections: [
  { title: 'Event rules', items: ['Agree on venue permissions and safety arrangements.'] },
  { title: 'Cancellation and refund policy', items: ['Cancel at least 14 days before the event. A 10% fee applies to the amount paid.'] },
  { title: 'Terms and conditions', items: ['Accepting a request starts planning. The client approves the final event plan.'] },
] };
function section(source, from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Missing workflow section ${from}`);
  return source.slice(start, end);
}
function harness(role, state) {
  const content = { innerHTML: '' };
  const elements = new Map([['page-content', content]]);
  const context = vm.createContext({
    CU: { id: role === 'client' ? 'usr-client-001' : 'usr-org-001', role },
    DB: { users: [], events: [], eventRequests: [], eventPlans: [], notifications: [] },
    g: id => elements.get(id), v: id => elements.get(id)?.value || '', escapeHtml,
    reqBadge: () => 'blue', _workflowReturnPage: 'request-status', _currentPage: 'request-status',
    apiGetEventRequests: async () => ({ data: structuredClone(state.requests) }),
    apiGetEventPlans: async () => structuredClone(state.plans),
    apiGetWorkflowEvents: async () => structuredClone(state.events),
    apiGetNotifications: async () => [], apiGetCompletionReports: async () => [],
    apiGetEventReports: async () => structuredClone(state.fileReports || []),
    apiGetPrivateOrganizerReviews: async () => [], toast() {},
    apiGetEventPolicy: async () => ({ data: structuredClone(policy) }),
    closeModal() {}, closeDrawer() {}, renderPage: async () => {},
  });
  vm.runInContext(section(sources[role], '    function workflowPayload(', '    function viewRequestDrawer('), context);
  return { context, content, elements, async render() {
    await context.syncWorkflowData();
    context.renderWorkflowRequestDetails(state.requests[0].requestId);
    return content.innerHTML;
  } };
}
function fixture() {
  return { requests: [{ requestId: 'req-flow', clientId: 'cli-001', clientUserId: 'usr-client-001', organizerId: 'org-001', organizerUserId: 'usr-org-001', eventName: 'Client conference', eventType: 'Conference', eventDate: '2099-11-20', budget: 50000, capacity: 80, requirements: 'Catering and sound equipment.', status: 'submitted' }], plans: [], events: [] };
}

test('both pages refresh the same workflow and expose actions only to the responsible role', async () => {
  const state = fixture();
  const client = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await organizer.render(), /onclick="acceptWorkflowRequest/);
  assert.doesNotMatch(await client.render(), /onclick="acceptWorkflowRequest/);
  state.requests[0].status = 'planning';
  assert.match(await organizer.render(), /Create Event Plan/);
  assert.doesNotMatch(await client.render(), /onclick="openWorkflowPlanModal/);
  state.requests[0].status = 'plan_submitted';
  state.requests[0].activeEventPlanId = 'plan-flow';
  state.plans.push({ eventPlanId: 'plan-flow', requestId: 'req-flow', title: 'Full plan', description: 'Detailed event plan', budget: 50000, approvalStatus: 'pending', documentFileName: 'plan.pdf', documentName: 'Conference plan.pdf' });
  const clientPlan = await client.render();
  assert.match(clientPlan, /Accept Plan/);
  assert.match(clientPlan, /Request New Plan/);
  assert.match(clientPlan, /View PDF/);
  assert.doesNotMatch(await organizer.render(), /onclick="reviewWorkflowPlan/);
  state.requests[0].status = 'plan_revision_requested';
  state.plans[0].approvalStatus = 'revision_requested';
  state.plans[0].revisionReason = 'Please revise catering.';
  assert.match(await organizer.render(), /Edit and Resubmit Plan/);
  assert.match(await client.render(), /Please revise catering/);
  assert.equal(client.context.DB.eventRequests[0].clientId, 'usr-client-001');
  assert.equal(organizer.context.DB.eventRequests[0].organizer, 'usr-org-001');
});

test('clients see negotiation choices and escaped rejection reasons', async () => {
  const state = fixture();
  const h = harness('client', state);
  state.requests[0].status = 'changes_requested';
  state.requests[0].negotiations = [{ action: 'changes_requested', reason: 'A larger budget is needed.', budget: 60000 }];
  let html = await h.render();
  for (const label of ['Accept Changes', 'Reject Changes', 'Send Counteroffer', 'A larger budget is needed.']) assert.ok(html.includes(label));
  state.requests[0].status = 'rejected';
  state.requests[0].rejectionReason = 'The <venue> is unavailable & cannot be booked.';
  html = await h.render();
  assert.match(html, /Reason for declining/);
  assert.match(html, /The &lt;venue&gt; is unavailable &amp; cannot be booked/);
  assert.doesNotMatch(html, /onclick="respondToWorkflowChanges/);
});

test('approved events show payment for the client and completion requirements for the organizer', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'confirmed', eventId: 'evt-flow', paymentStatus: 'unpaid' });
  state.events.push({ eventId: 'evt-flow', name: 'Client conference', date: '2099-11-20', status: 'ongoing', clientId: 'cli-001', organizerId: 'org-001' });
  const client = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await client.render(), /Pay Now/);
  assert.doesNotMatch(await organizer.render(), /onclick="payWorkflowEvent/);
  assert.match(organizer.content.innerHTML, /client must complete full payment/);
  state.requests[0].paymentStatus = 'fully_paid';
  assert.doesNotMatch(await client.render(), /Pay Now/);
  assert.match(await organizer.render(), /Completion is available after the event date/);
  state.requests[0].eventDate = '2000-01-01';
  assert.match(await organizer.render(), /Mark Event as Completed/);
  assert.equal(client.context.DB.events.filter(item => item.eventId === 'evt-flow').length, 1);
});

test('client submission calls the backend and cannot create a local-only request', async () => {
  const h = harness('client', fixture());
  await h.context.syncWorkflowData();
  h.elements.set('req-policy', { checked: true });
  const values = { 'req-title': 'New conference', 'req-type': 'Conference', 'req-date': '2099-11-20', 'req-city': 'Mumbai', 'req-guests': '80', 'req-budget': '50000', 'req-desc': 'Conference requirements', 'req-venue': 'City Hall' };
  for (const [id, value] of Object.entries(values)) h.elements.set(id, { value });
  h.context.openModal = () => {};
  const notices = [];
  h.context.toast = (...args) => notices.push(args);
  h.context.DB.users.push({ id: 'usr-org-001', role: 'organizer', name: 'Test Organizer' });
  let payload;
  h.context.apiCreateEventRequest = async data => { payload = data; };
  h.context.runWorkflowAction = action => action();
  vm.runInContext(section(sources.client, '    let eventRequestDraft = null;', '    function pageFindStaff('), h.context);
  await h.context.loadWorkflowEventPolicy();
  const before = h.context.DB.eventRequests.length;
  h.elements.get('req-policy').checked = false;
  h.context.reviewEventRequest('usr-org-001');
  await h.context.submitEventRequest('usr-org-001');
  assert.equal(payload, undefined, 'Unchecked terms must block submission');
  h.elements.get('req-policy').checked = true;
  h.context.reviewEventRequest('usr-org-001');
  assert.ok(vm.runInContext('eventRequestDraft', h.context), `Accepted request should reach the review step: ${JSON.stringify(notices)}`);
  await h.context.submitEventRequest('usr-org-001');
  assert.equal(payload.organizerId, 'usr-org-001');
  assert.equal(payload.eventName, 'New conference');
  assert.equal(payload.capacity, 80);
  assert.equal(payload.policyAccepted, true);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
  assert.equal(h.context.DB.eventRequests.length, before);
});

test('organizer submits the selected PDF before submitting its linked event plan', async () => {
  const state = fixture();
  state.requests[0].status = 'planning';
  const h = harness('organizer', state);
  await h.render();
  const calls = [];
  h.elements.set('workflow-plan-pdf', { files: [{ name: 'conference.pdf', type: 'application/pdf', size: 100 }] });
  h.context.apiUploadEventPlanDocument = async (id, file) => calls.push(['upload', id, file.name]);
  h.context.apiCreateEventPlan = async body => calls.push(['submit', body.requestId, body.budget, body.capacity]);
  let pending;
  h.context.runWorkflowAction = action => { pending = action(); return pending; };
  await h.context.submitWorkflowPlan('req-flow');
  await pending;
  assert.deepEqual(calls, [['upload', 'req-flow', 'conference.pdf'], ['submit', 'req-flow', 50000, 80]]);
});

test('both client creation entry points link to policies and terms and require agreement before calling the server', async () => {
  const h = harness('client', fixture());
  const panels = [];
  h.context.openModal = (title, body) => panels.push(body);
  h.context.openDrawer = (title, body) => panels.push(body);
  h.context.syncOrganizerDirectory = async () => {};
  h.context.DB.users.push({ id: 'usr-org-001', role: 'organizer', name: 'Test Organizer' });
  vm.runInContext(section(sources.client, '    async function openNewRequestForm(', '    function submitPlan('), h.context);
  vm.runInContext(section(sources.client, '    async function openRequestModal(', '    function pageFindStaff('), h.context);
  await h.context.openNewRequestForm();
  await h.context.openRequestModal('usr-org-001');
  assert.match(panels[0], /id="nr-policy"/);
  assert.match(panels[1], /id="req-policy"/);
  for (const html of panels) {
    assert.match(html, /Event Policies &amp; Rules/);
    assert.match(html, /Terms and Conditions/);
    assert.match(html, /14 days/);
    assert.match(html, /cancellation fee is 10%/);
    assert.doesNotMatch(html, /<details|Agree on venue permissions|The client approves the final event plan/);
  }
  const values = { 'nr-organizer': 'usr-org-001', 'nr-title': 'New conference', 'nr-type': 'Conference', 'nr-date': '2099-11-20', 'nr-guests': '80', 'nr-budget': '50000', 'nr-desc': 'Conference requirements', 'nr-venue': 'City Hall' };
  for (const [id, value] of Object.entries(values)) h.elements.set(id, { value });
  let payload;
  h.context.apiCreateEventRequest = async data => { payload = data; };
  h.context.runWorkflowAction = action => action();
  h.elements.set('nr-policy', { checked: false });
  await h.context.submitRequest();
  assert.equal(payload, undefined);
  h.elements.get('nr-policy').checked = true;
  await h.context.submitRequest();
  assert.equal(payload.policyAccepted, true);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
});

test('client and organizer open separate policy and terms views without losing form values or agreement', async () => {
  for (const role of ['client', 'organizer']) {
    const state = fixture();
    const savedPolicy = structuredClone(policy);
    savedPolicy.version = 'saved-request-policy';
    savedPolicy.sections[0].items.push('Confirm the <venue> capacity & safety rules.');
    state.requests[0].policySnapshot = savedPolicy;
    const h = harness(role, state);
    const html = await h.render();
    assert.match(html, /openWorkflowPolicyDocument\('policies'/);
    assert.match(html, /openWorkflowPolicyDocument\('terms'/);
    let focused, openModalCalls = 0;
    const input = { value: 'Unsaved conference details', isConnected: true, focus() { focused = input; } };
    const checkbox = { checked: true };
    h.elements.set('req-title', input);
    h.elements.set('workflow-accept-policy', checkbox);
    const overlays = [];
    const document = { activeElement: input, body: { appendChild(node) { overlays.push(node); } }, createElement() {
      const listeners = {};
      const closeButton = { focus() { focused = closeButton; } };
      return { style: {}, innerHTML: '', removed: false, listeners, setAttribute() {}, addEventListener(type, handler) { listeners[type] = handler; },
        querySelector() { return closeButton; }, remove() { this.removed = true; } };
    } };
    h.context.document = document;
    h.context.openModal = () => { openModalCalls++; };
    h.context.openWorkflowPolicyDocument('policies', savedPolicy.version);
    assert.equal(overlays.length, 1);
    assert.match(overlays[0].innerHTML, /Cancellation and refund policy/);
    assert.match(overlays[0].innerHTML, /10% fee/);
    assert.match(overlays[0].innerHTML, /Confirm the &lt;venue&gt; capacity &amp; safety rules/);
    assert.doesNotMatch(overlays[0].innerHTML, /The client approves the final event plan/);
    assert.match(overlays[0].innerHTML, /saved-request-policy/);
    h.context.closeWorkflowPolicyDocument();
    assert.equal(overlays[0].removed, true);
    assert.equal(focused, input);
    h.context.openWorkflowPolicyDocument('terms', savedPolicy.version);
    assert.equal(overlays.length, 2);
    assert.match(overlays[1].innerHTML, /Terms and conditions/);
    assert.match(overlays[1].innerHTML, /The client approves the final event plan/);
    assert.doesNotMatch(overlays[1].innerHTML, /Cancellation and refund policy|Confirm the &lt;venue&gt;/);
    overlays[1].listeners.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(overlays[1].removed, true);
    assert.equal(input.value, 'Unsaved conference details');
    assert.equal(checkbox.checked, true);
    assert.equal(openModalCalls, 0, 'Reading documents must leave the parent event form intact');
    assert.equal(focused, input);
  }
});

test('organizer acceptance, counteroffers, and proposed changes use the exact policy saved with the request', async () => {
  const state = fixture();
  const savedPolicy = { ...structuredClone(policy), version: 'saved-policy-version' };
  state.requests[0].policySnapshot = savedPolicy;
  const h = harness('organizer', state);
  await h.render();
  let modal, payload, calls = 0;
  h.context.openModal = (title, body) => { modal = body; };
  h.context.apiAcceptEventRequest = async (id, body) => { calls++; payload = body; };
  h.context.apiAcceptCounteroffer = h.context.apiAcceptEventRequest;
  h.context.apiRejectEventRequest = h.context.apiAcceptEventRequest;
  h.context.runWorkflowAction = action => action();
  h.elements.set('workflow-accept-policy', { checked: false });
  await h.context.acceptWorkflowRequest('req-flow');
  assert.match(modal, /saved-policy-version/);
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(calls, 0);
  h.elements.get('workflow-accept-policy').checked = true;
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(payload.acceptedPolicyVersion, savedPolicy.version);
  await h.context.acceptWorkflowCounteroffer('req-flow');
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(calls, 2);
  h.elements.set('workflow-reject-type', { value: 'budget' });
  h.elements.set('workflow-reject-reason', { value: 'Catering needs a larger budget.' });
  h.elements.set('workflow-new-budget', { value: '55000' });
  h.elements.set('workflow-change-policy', { checked: false });
  await h.context.openWorkflowRejectModal('req-flow');
  assert.match(modal, /saved-policy-version/);
  h.context.submitWorkflowReject('req-flow');
  assert.equal(calls, 2);
  h.elements.get('workflow-change-policy').checked = true;
  h.context.submitWorkflowReject('req-flow');
  assert.equal(calls, 3);
  assert.equal(payload.acceptedPolicyVersion, savedPolicy.version);
  assert.equal(payload.proposedBudget, 55000);
});

function cancellationFixture() {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'confirmed', eventId: 'evt-flow', paymentStatus: 'fully_paid' });
  state.events.push({ eventId: 'evt-flow', name: 'Client conference', date: '2099-11-20', status: 'ongoing', clientId: 'cli-001', organizerId: 'org-001' });
  const preview = { eventId: 'evt-flow', canCancel: true, minimumNoticeDays: 14, cancellationDeadline: '2099-11-06T04:30:00.000Z', paidAmount: 50000, cancellationFeePercent: 10, cancellationFee: 5000, refundAmount: 45000, policy };
  return { state, preview };
}

test('client cancellation previews the fee and refund, requires a reason and consent, then displays the saved result for both roles', async () => {
  const { state, preview } = cancellationFixture();
  const h = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await h.render(), /onclick="openWorkflowCancellation/);
  assert.doesNotMatch(await organizer.render(), /onclick="openWorkflowCancellation/);
  let modal, actions, payload, visited;
  h.context.openModal = (title, body, buttons) => { modal = body; actions = buttons; };
  h.context.apiPreviewClientEventCancellation = async () => ({ data: structuredClone(preview) });
  h.context.apiCancelClientEvent = async (id, body) => {
    payload = body;
    state.requests[0].status = state.events[0].status = 'cancelled';
    state.requests[0].cancellation = { reason: body.reason, paidAmount: 50000, cancellationFeePercent: 10, cancellationFee: 5000, refundAmount: 45000, refundStatus: 'pending', cancelledAt: '2099-10-01T10:00:00Z' };
  };
  h.context.viewWorkflowRequestDrawer = id => { visited = id; };
  await h.context.openWorkflowCancellation('evt-flow');
  for (const text of ['50,000.00', '5,000.00', '45,000.00', 'Cancellation fee (10%)', 'Cancellation deadline', 'pending review']) assert.ok(modal.includes(text), text);
  assert.ok(actions.some(item => item.lbl === 'Confirm Cancellation'));
  h.elements.set('workflow-cancel-error', { textContent: '' });
  h.elements.set('workflow-cancel-reason', { value: ' ' });
  h.elements.set('workflow-cancel-policy', { checked: false });
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload, undefined);
  assert.match(h.elements.get('workflow-cancel-error').textContent, /10 to 1000/);
  h.elements.get('workflow-cancel-reason').value = '  Our conference plans changed.  ';
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload, undefined);
  h.elements.get('workflow-cancel-policy').checked = true;
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload.reason, 'Our conference plans changed.');
  assert.equal(payload.expectedPaidAmount, 50000);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
  assert.equal(visited, 'req-flow');
  for (const page of [h, organizer]) {
    const html = await page.render();
    assert.match(html, /Our conference plans changed/);
    assert.match(html, /45,000.00/);
    assert.match(html, /Refund pending review/);
    assert.doesNotMatch(html, /onclick="openWorkflowCancellation|Pay Now/);
  }
});

test('a closed cancellation window has no confirmation action and failed cancellation preserves the reason for retry', async () => {
  const { state, preview } = cancellationFixture();
  const h = harness('client', state);
  await h.render();
  let modal, actions, calls = 0;
  h.context.openModal = (title, body, buttons) => { modal = body; actions = buttons; };
  h.context.apiPreviewClientEventCancellation = async () => ({ data: { ...preview, canCancel: false, unavailableReason: 'Cancellation closes 14 days before the event.' } });
  h.context.apiCancelClientEvent = async () => { calls++; throw Error('Payment changed. Review a new quote.'); };
  await h.context.openWorkflowCancellation('evt-flow');
  assert.match(modal, /Cancellation closes 14 days/);
  assert.ok(!actions.some(item => item.lbl === 'Confirm Cancellation'));
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(calls, 0);
  h.context.apiPreviewClientEventCancellation = async () => ({ data: preview });
  await h.context.openWorkflowCancellation('evt-flow');
  h.elements.set('workflow-cancel-reason', { value: 'Our conference plans changed.' });
  h.elements.set('workflow-cancel-policy', { checked: true });
  h.elements.set('workflow-cancel-error', { textContent: '' });
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(calls, 1);
  assert.match(h.elements.get('workflow-cancel-error').textContent, /Payment changed/);
  assert.equal(h.elements.get('workflow-cancel-reason').value, 'Our conference plans changed.');
  assert.equal(h.context.DB.events[0].status, 'ongoing');
});

test('organizer reports use the requesting client and save files through the API, preserving failures for retry', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { eventId: 'evt-report', status: 'completed' });
  state.events.push({ eventId: 'evt-report', name: 'Client conference', status: 'completed', clientId: 'cli-001', clientUserId: 'usr-client-001', organizerId: 'org-001' });
  const h = harness('organizer', state);
  await h.render();
  h.context.DB.users.push({ id: 'usr-admin-001', name: 'Admin', role: 'superuser' }, { id: 'usr-client-001', name: 'Requesting Client', email: 'client@example.com', role: 'client' });
  vm.runInContext(section(sources.organizer, '    function reportContactHtml(', '    function pageReports('), h.context);
  vm.runInContext(section(sources.organizer, '    function getEventReportRecipients(', '    function deleteEventReport('), h.context);
  let modal, submissions = 0, closes = 0;
  h.context.openModal = (title, body) => { modal = body; };
  h.context.closeModal = () => { closes++; };
  h.context.openSubmitReportModal('evt-report');
  assert.match(modal, /Requesting Client/);
  assert.match(modal, /automatically to the client who requested this event/);
  assert.doesNotMatch(modal, /<select|Admin/);
  const file = { name: 'event-report.pdf', size: 100 };
  h.elements.set('report-file', { files: [file] });
  h.elements.set('event-report-error', { textContent: '' });
  h.context.apiUploadEventReport = async () => { submissions++; throw Error('Upload failed; try again.'); };
  await h.context.submitEventReport('evt-report');
  assert.equal(closes, 0);
  assert.match(h.elements.get('event-report-error').textContent, /Upload failed/);
  assert.equal(h.elements.get('report-file').files[0], file);
  assert.equal(h.context.DB.reports.length, 0);
  h.context.apiUploadEventReport = async (eventId, selected) => { submissions++; assert.equal(eventId, 'evt-report'); assert.equal(selected, file); };
  await h.context.submitEventReport('evt-report');
  assert.equal(submissions, 2);
  assert.equal(closes, 1);
  assert.equal(h.context.getEventReportRecipients({ id: 'unlinked-event' }).length, 0, 'An event without a client must never fall back to admin');
});

test('the client can see and download organizer report files in the completed event details', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { eventId: 'evt-report', status: 'completed' });
  state.events.push({ eventId: 'evt-report', name: 'Client conference', status: 'completed', clientId: 'cli-001' });
  state.fileReports = [{ eventReportId: 'rpt-file', eventId: 'evt-report', clientId: 'cli-001', clientUserId: 'usr-client-001', clientName: 'Michael Torres', reportTitle: 'Conference summary', reportDetails: 'Final event services and expenses.', documentName: 'conference-summary.pdf', documentFileName: 'stored-report.pdf' }];
  const h = harness('client', state);
  const html = await h.render();
  assert.match(html, /Conference summary/);
  assert.match(html, /Final event services and expenses/);
  assert.match(html, /downloadWorkflowEventReport\('rpt-file'\)/);
  assert.match(html, /conference-summary.pdf/);
  assert.equal(h.context.DB.reports[0].recipientId, 'usr-client-001');
});

test('organizer submitted reports open real uploads and labeled sample files with working download controls', async () => {
  const h = harness('organizer', fixture());
  vm.runInContext(section(sources.organizer, '    const organizerReportSamples =', '    function reportContactHtml('), h.context);
  const sample = { id: 'rpt-org-001', submittedBy: 'usr-org-001', fileName: 'healthcare-innovation-forum-final-report.pdf' };
  const uploaded = { id: 'rpt-upload', eventReportId: 'rpt-upload', submittedBy: 'usr-org-001', documentName: 'uploaded-summary.pdf', documentFileName: 'stored.pdf' };
  const missing = { id: 'rpt-legacy', submittedBy: 'usr-org-001', fileName: 'original-not-saved.pdf' };
  h.context.DB.reports = [sample, uploaded, missing];
  const sampleHtml = h.context.renderOrganizerReportFile(sample);
  assert.match(sampleHtml, /View File/);
  assert.match(sampleHtml, /Download/);
  assert.match(sampleHtml, /Sample/);
  assert.match(sampleHtml, /-sample.html/);
  assert.match(h.context.renderOrganizerReportFile(uploaded), /uploaded-summary.pdf/);
  assert.match(h.context.renderOrganizerReportFile(uploaded), /View File/);
  assert.doesNotMatch(h.context.renderOrganizerReportFile(uploaded), /Sample/);
  assert.match(h.context.renderOrganizerReportFile(missing), /No file saved/);
  assert.doesNotMatch(h.context.renderOrganizerReportFile(missing), /View File|Download/);
  const calls = [], previews = [], links = [], errors = [];
  h.context.API_BASE_URL = 'http://localhost/api';
  h.context.getAuthHeader = () => 'Bearer test-token';
  h.context.window = { open() { const preview = { location: {}, close() { this.closed = true; } }; previews.push(preview); return preview; } };
  h.context.URL = { createObjectURL: () => 'blob:report-file', revokeObjectURL() {} };
  h.context.setTimeout = () => {};
  h.context.document = { body: { appendChild(link) { links.push(link); } }, createElement() { return { click() { this.clicked = true; }, remove() {} }; } };
  h.context.toast = message => errors.push(message);
  h.context.fetch = async (url, options) => { calls.push([url, options]); return { ok: true, blob: async () => ({}) }; };
  await h.context.openOrganizerReportFile(sample.id);
  assert.equal(calls[0][0], '/assets/demo-reports/rpt-org-001.html');
  assert.equal(calls[0][1].headers, undefined);
  assert.equal(previews[0].location.href, 'blob:report-file');
  assert.equal(previews[0].opener, null);
  const sampleFile = path.join(__dirname, '../public/assets/demo-reports/rpt-org-001.html');
  assert.match(fs.readFileSync(sampleFile, 'utf8'), /SAMPLE REPORT/);
  await h.context.openOrganizerReportFile(uploaded.id, true);
  assert.equal(calls[1][0], 'http://localhost/api/reports/events/rpt-upload/file');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer test-token');
  assert.equal(links[0].download, 'uploaded-summary.pdf');
  assert.equal(links[0].clicked, true);
  h.context.fetch = async () => ({ ok: false });
  await h.context.openOrganizerReportFile(uploaded.id);
  assert.equal(previews[1].closed, true);
  assert.match(errors[0], /could not be loaded/);
});
