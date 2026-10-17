const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('client and organizer complete the restored event workflow through the API', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-workflow-test-'));
  const previousCwd = process.cwd();
  const previousDataFile = process.env.EVENTFLOW_DATA_FILE;
  const dataFile = path.join(directory, 'store.json');
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = dataFile;
  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(async () => {
    await app.close();
    DataStore.instance = undefined;
    process.chdir(previousCwd);
    if (previousDataFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousDataFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-workflow-test-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function call(token, method, url, body, expected = 200) {
    const response = await fetch(base + url, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = text; }
    assert.equal(response.status, expected, `${method} ${url}: ${text}`);
    return result;
  }
  async function login(email, password) {
    return (await call(null, 'POST', '/auth/login', { email, password })).data.token;
  }
  await t.test('workflow demo scenarios are idempotent, marked, and filtered from production restores', async () => {
    const demoRequests = db.eventRequests.filter(item => item.demoScenario === 'event-request-workflow-v1');
    assert.equal(demoRequests.length, 20);
    assert.equal(new Set(demoRequests.map(item => item.requestId)).size, demoRequests.length);
    for (const status of ['submitted', 'under_review', 'info_requested', 'proposal_sent', 'awaiting_client', 'planning', 'plan_submitted', 'confirmed', 'rejected', 'withdrawn', 'expired', 'cancelled', 'completed']) {
      assert.ok(demoRequests.some(item => item.status === status), `Expected demo scenario ${status}`);
    }
    assert.ok(demoRequests.some(item => item.paymentStatus === 'failed'));
    assert.ok(demoRequests.some(item => item.agreementStatus === 'agreed'));
    const before = db.eventRequests.length;
    const firstScenario = demoRequests[0];
    db.applyEventRequestDemoScenario();
    assert.equal(db.eventRequests.length, before);
    assert.equal(db.eventRequests.find(item => item.requestId === firstScenario.requestId), firstScenario);

    db.persist();
    const previousNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const productionStore = new DataStore();
      assert.equal(productionStore.eventRequests.some(item => item.demoScenario === 'event-request-workflow-v1'), false);
      assert.equal(productionStore.eventPlans.some(item => item.demoScenario === 'event-request-workflow-v1'), false);
      assert.equal(productionStore.events.some(item => item.demoScenario === 'event-request-workflow-v1'), false);
      assert.ok(productionStore.eventRequests.some(item => item.requestId === 'req-orgdash-prep'), 'Non-workflow production records remain intact');
      assert.equal(productionStore.users.some(item => item.demoScenario === 'event-request-workflow-v1'), false);
      assert.ok(productionStore.clients.some(item => item.clientId === 'cli-001'), 'Existing client profiles remain intact');
      assert.ok(productionStore.users.some(item => item.userId === 'usr-client-001'), 'Existing client users remain intact');
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
  const client = await login('client@example.com', 'Client@123');
  const organizer = await login('organizer@example.com', 'Organizer@123');
  for (const [role, suffix, password] of [['client', 'client', 'Client@123'], ['organizer', 'org', 'Organizer@123']]) {
    const user = db.users.find(user => user.email === `${role}@example.com`);
    db.users.push({ ...user, userId: `usr-other-${suffix}`, email: `other-${role}@example.com`, password });
    const profiles = role === 'client' ? db.clients : db.organizers;
    const idField = role === 'client' ? 'clientId' : 'organizerId';
    profiles.push({ ...profiles.find(profile => profile.userId === user.userId), [idField]: `other-${suffix}`, userId: `usr-other-${suffix}` });
  }
  const otherClient = await login('other-client@example.com', 'Client@123');
  const otherOrganizer = await login('other-organizer@example.com', 'Organizer@123');
  const policy = (await call(client, 'GET', '/event-requests/policies')).data;
  const acknowledgement = { policyAccepted: true, acceptedPolicyVersion: policy.version };
  const future = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  let sequence = 0;
  async function createRequest(overrides = {}) {
    return (await call(client, 'POST', '/event-requests', {
      clientId: 'usr-client-001', organizerId: 'usr-org-001', eventName: `Workflow event ${++sequence}`,
      eventDate: future(400 + sequence), eventType: 'Conference', venue: 'City Hall', budget: 50000,
      capacity: 80, requirements: 'A conference with catering and sound equipment.', ...acknowledgement, ...overrides,
    }, 201)).data;
  }
  async function submitPlan(request, fileName = 'event-plan.pdf') {
    const form = new FormData();
    form.set('file', new Blob(['%PDF-1.4\nWorkflow plan document\n%%EOF'], { type: 'application/pdf' }), fileName);
    await call(organizer, 'POST', `/event-plans/${request.requestId}/document`, form, 201);
    return (await call(organizer, 'POST', '/event-plans', {
      requestId: request.requestId, title: 'Conference plan', description: request.requirements,
      budget: request.budget, capacity: request.capacity,
    }, 201)).data;
  }
  let request, plan, event;

  await t.test('the displayed policy must be accepted by the client and organizer', async () => {
    assert.equal(policy.cancellation.minimumNoticeDays, 14);
    assert.equal(policy.cancellation.feePercent, 10);
    const body = { clientId: 'usr-client-001', organizerId: 'usr-org-001', eventName: 'Policy validation', eventDate: future(44), budget: 50000, capacity: 80 };
    const before = db.eventRequests.length;
    await call(client, 'POST', '/event-requests', body, 400);
    await call(client, 'POST', '/event-requests', { ...body, ...acknowledgement, policyAccepted: false }, 400);
    await call(client, 'POST', '/event-requests', { ...body, ...acknowledgement, acceptedPolicyVersion: 'outdated' }, 400);
    assert.equal(db.eventRequests.length, before);
    const pending = await createRequest();
    assert.equal(pending.clientPolicyAcceptedBy, 'usr-client-001');
    assert.ok(pending.clientPolicyAcceptedAt);
    assert.deepEqual(pending.policySnapshot, policy);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/accept`, undefined, 400);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/accept`, { ...acknowledgement, policyAccepted: false }, 400);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/accept`, { ...acknowledgement, acceptedPolicyVersion: 'outdated' }, 400);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/reject`, { reasonType: 'budget', reason: 'Catering needs an increase.', proposedBudget: 55000 }, 400);
    assert.equal(db.eventRequests.find(item => item.requestId === pending.requestId).status, 'submitted');
    const accepted = (await call(organizer, 'POST', `/event-requests/${pending.requestId}/accept`, acknowledgement, 201)).data;
    assert.equal(accepted.organizerPolicyAcceptedBy, 'usr-org-001');
    assert.ok(accepted.organizerPolicyAcceptedAt);
    assert.deepEqual(accepted.policySnapshot, pending.policySnapshot);
    await call(organizer, 'PATCH', `/event-requests/${pending.requestId}/status`, { status: 'confirmed' }, 400);
    await call(organizer, 'PATCH', `/event-requests/${pending.requestId}/status`, { status: 'rejected' }, 400);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/payment`, { paymentStatus: 'deposit_paid' }, 403);
    await call(client, 'POST', `/event-requests/${pending.requestId}/agreement`, { agreementStatus: 'agreed' }, 400);
  });

  await t.test('requests are shared between roles and acceptance starts planning without creating an event', async () => {
    const directory = await call(client, 'GET', '/event-requests/organizers');
    assert.ok(directory.some(item => item.organizerId === 'org-001'));
    request = await createRequest({ clientId: 'other-client' });
    assert.equal(request.clientId, 'cli-001', 'Ownership must come from the signed-in client');
    assert.equal(request.organizerId, 'org-001');
    assert.equal(request.status, 'submitted');
    const orgRequests = await call(organizer, 'GET', '/event-requests');
    const organizerRequest = orgRequests.find(item => item.requestId === request.requestId);
    assert.equal(organizerRequest.clientUserId, 'usr-client-001');
    assert.equal(organizerRequest.clientDetails.email, 'client@example.com');
    await call(otherOrganizer, 'POST', `/event-requests/${request.requestId}/accept`, acknowledgement, 403);
    await call(otherClient, 'GET', `/event-requests/${request.requestId}`, undefined, 403);
    request = (await call(organizer, 'POST', `/event-requests/${request.requestId}/accept`, acknowledgement, 201)).data;
    assert.equal(request.status, 'planning');
    assert.equal(db.events.filter(item => item.name === request.eventName).length, 0);
    await call(organizer, 'POST', `/event-requests/${request.requestId}/confirm`, {}, 400);
  });

  await t.test('a PDF plan is required and client revisions return to the organizer', async () => {
    const planBody = { requestId: request.requestId, title: 'Plan', description: 'Detailed conference plan', budget: request.budget, capacity: request.capacity };
    await call(organizer, 'POST', '/event-plans', planBody, 400);
    const invalid = new FormData();
    invalid.set('file', new Blob(['not a PDF'], { type: 'application/pdf' }), 'invalid.pdf');
    await call(organizer, 'POST', `/event-plans/${request.requestId}/document`, invalid, 400);
    plan = await submitPlan(request);
    const download = await fetch(`${base}/event-plans/${plan.eventPlanId}/document`, { headers: { Authorization: `Bearer ${client}` } });
    assert.equal(download.status, 200);
    assert.ok((await download.text()).startsWith('%PDF-'));
    await call(otherClient, 'GET', `/event-plans/${plan.eventPlanId}/document`, undefined, 403);
    await call(organizer, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'approved' }, 403);
    await call(client, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'revision_requested', reason: '  ' }, 400);
    await call(client, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'revision_requested', reason: 'Please include the vegetarian catering menu.' });
    assert.equal(db.eventRequests.find(item => item.requestId === request.requestId).status, 'plan_revision_requested');
    assert.equal(db.events.filter(item => item.name === request.eventName).length, 0);
    const revised = await submitPlan(request, 'revised-plan.pdf');
    assert.equal(revised.revision, 2);
    await call(client, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'approved' }, 400);
    plan = revised;
  });

  await t.test('plan approval awaits agreement and verified payment before creating a shared event', async () => {
    const approved = (await call(client, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'approved' })).data;
    assert.equal(approved.plan.approvalStatus, 'approved');
    assert.equal(approved.request.status, 'awaiting_client');
    assert.equal(approved.request.agreementStatus, 'pending_signature');
    assert.equal(db.events.filter(item => item.name === request.eventName).length, 0);
    await call(otherClient, 'POST', `/event-requests/${request.requestId}/agreement`, { agreementStatus: 'agreed' }, 403);
    await call(organizer, 'POST', `/event-requests/${request.requestId}/agreement`, { agreementStatus: 'agreed' }, 403);
    await call(organizer, 'POST', `/event-requests/${request.requestId}/payment`, { paymentStatus: 'deposit_paid' }, 403);
    await call(organizer, 'POST', `/event-requests/${request.requestId}/confirm`, { agreementConfirmed: true, depositConfirmed: true }, 400);
    await call(client, 'POST', `/event-requests/${request.requestId}/agreement`, { agreementStatus: 'agreed' }, 201);
    await call(organizer, 'POST', `/event-requests/${request.requestId}/confirm`, {}, 400);
    const liveRequest = db.eventRequests.find(item => item.requestId === request.requestId);
    liveRequest.paymentStatus = 'deposit_paid'; // Represents a verified processor update; no public API can set this value.
    const confirmation = await call(organizer, 'POST', `/event-requests/${request.requestId}/confirm`, {}, 201);
    event = db.events.find(item => item.eventId === confirmation.eventId);
    assert.equal(event.status, 'ongoing');
    assert.equal(event.clientId, 'cli-001');
    assert.equal(event.organizerId, 'org-001');
    assert.equal(liveRequest.paymentStatus, 'deposit_paid');
    assert.equal(liveRequest.agreementStatus, 'agreed');
    for (const token of [client, organizer]) {
      const events = await call(token, 'GET', '/events');
      assert.ok(events.some(item => item.eventId === event.eventId && item.clientUserId === 'usr-client-001' && item.organizerUserId === 'usr-org-001'));
    }
    await call(client, 'PATCH', `/event-plans/${plan.eventPlanId}/approval`, { approvalStatus: 'approved' }, 400);
    assert.equal(db.events.filter(item => item.name === request.eventName).length, 1);
    assert.ok(db.notifications.some(item => item.userId === 'usr-org-001' && item.type === 'plan_approved'));
  });

  await t.test('budget and date changes, counteroffers, and rejection reasons reach the correct role', async () => {
    const negotiation = await createRequest();
    await call(organizer, 'POST', `/event-requests/${negotiation.requestId}/reject`, { ...acknowledgement, reasonType: 'both', reason: 'The venue needs a larger budget and a different date.', proposedBudget: 65000, proposedDate: future(475) }, 201);
    let record = await call(client, 'GET', `/event-requests/${negotiation.requestId}`);
    assert.equal(record.status, 'changes_requested');
    assert.match(record.negotiations.at(-1).reason, /larger budget/);
    await call(client, 'POST', `/event-requests/${negotiation.requestId}/client-response`, { decision: 'counteroffer', counterofferBudget: 60000, counterofferDate: future(480), counterofferCapacity: 70 }, 201);
    record = (await call(organizer, 'POST', `/event-requests/${negotiation.requestId}/accept-counteroffer`, acknowledgement, 201)).data;
    assert.equal(record.status, 'planning');
    assert.equal(record.budget, 60000);
    assert.equal(record.eventDate, future(480));
    assert.equal(record.capacity, 70);
    const changes = await createRequest();
    await call(organizer, 'POST', `/event-requests/${changes.requestId}/reject`, { ...acknowledgement, reasonType: 'budget', reason: 'Catering requires a higher budget.', proposedBudget: 55000 }, 201);
    record = (await call(client, 'POST', `/event-requests/${changes.requestId}/client-response`, { decision: 'accept_changes' }, 201)).data;
    assert.equal(record.status, 'planning');
    assert.equal(record.budget, 55000);
    const rejected = await createRequest();
    await call(organizer, 'POST', `/event-requests/${rejected.requestId}/reject`, { reason: 'Our team is unavailable for this event.' }, 201);
    record = await call(client, 'GET', `/event-requests/${rejected.requestId}`);
    assert.equal(record.status, 'rejected');
    assert.match(record.rejectionReason, /unavailable/);
    await call(organizer, 'POST', `/event-requests/${rejected.requestId}/accept`, acknowledgement, 400);
  });

  await t.test('a rejected plan never creates an event and availability is rechecked at confirmation', async () => {
    const revised = await createRequest();
    await call(organizer, 'POST', `/event-requests/${revised.requestId}/accept`, acknowledgement, 201);
    const revisionPlan = await submitPlan(revised);
    await call(client, 'PATCH', `/event-plans/${revisionPlan.eventPlanId}/approval`, { approvalStatus: 'rejected', reason: 'Please provide an alternative schedule.' });
    assert.equal(db.eventRequests.find(item => item.requestId === revised.requestId).status, 'plan_revision_requested');
    assert.equal(db.events.filter(item => item.name === revised.eventName).length, 0);
    const collision = await createRequest();
    await call(organizer, 'POST', `/event-requests/${collision.requestId}/accept`, acknowledgement, 201);
    const collisionPlan = await submitPlan(collision);
    await call(client, 'PATCH', `/event-plans/${collisionPlan.eventPlanId}/approval`, { approvalStatus: 'approved' });
    await call(client, 'POST', `/event-requests/${collision.requestId}/agreement`, { agreementStatus: 'agreed' }, 201);
    db.eventRequests.find(item => item.requestId === collision.requestId).paymentStatus = 'deposit_paid';
    db.events.push({ ...event, eventId: 'evt-conflict-test', name: 'A later booking', date: collision.eventDate });
    await call(organizer, 'POST', `/event-requests/${collision.requestId}/confirm`, {}, 409);
    assert.equal(db.events.filter(item => item.name === collision.eventName).length, 0);
  });

  async function approvedEvent(overrides) {
    const pending = await createRequest(overrides);
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/accept`, acknowledgement, 201);
    const submitted = await submitPlan(pending);
    await call(client, 'PATCH', `/event-plans/${submitted.eventPlanId}/approval`, { approvalStatus: 'approved' });
    await call(client, 'POST', `/event-requests/${pending.requestId}/agreement`, { agreementStatus: 'agreed' }, 201);
    db.eventRequests.find(item => item.requestId === pending.requestId).paymentStatus = 'deposit_paid';
    await call(organizer, 'POST', `/event-requests/${pending.requestId}/confirm`, {}, 201);
    return db.events.find(item => item.eventId === db.eventRequests.find(record => record.requestId === pending.requestId).eventId);
  }

  let cancelledEvent;
  await t.test('cancellation validates ownership, policy, reason, and a current payment quote before changing data', async () => {
    cancelledEvent = await approvedEvent({ budget: 50000.25 });
    const url = `/events/${cancelledEvent.eventId}`;
    const body = { reason: 'Our conference plans have changed.', expectedPaidAmount: 0, ...acknowledgement };
    await call(otherClient, 'GET', url + '/cancellation-preview', undefined, 403);
    await call(organizer, 'GET', url + '/cancellation-preview', undefined, 403);
    await call(otherClient, 'POST', url + '/cancel', body, 403);
    await call(organizer, 'POST', url + '/cancel', body, 403);
    const unpaid = (await call(client, 'GET', url + '/cancellation-preview')).data;
    assert.equal(unpaid.canCancel, true);
    assert.equal(unpaid.cancellationFee, 0);
    assert.equal(unpaid.refundAmount, 0);
    await call(client, 'POST', url + '/cancel', { ...body, policyAccepted: false }, 400);
    await call(client, 'POST', url + '/cancel', { ...body, acceptedPolicyVersion: 'outdated' }, 400);
    await call(client, 'POST', url + '/cancel', { ...body, reason: '   ' }, 400);
    await call(client, 'POST', url + '/cancel', { ...body, reason: 'x'.repeat(1001) }, 400);
    await call(client, 'POST', `/payments/events/${cancelledEvent.eventId}`, { paymentMethod: 'DEMO_PROVIDER' }, 201);
    await call(client, 'POST', url + '/cancel', body, 409);
    assert.equal(db.events.find(item => item.eventId === cancelledEvent.eventId).status, 'ongoing');
    assert.equal(db.eventWorkflowRefunds.length, 0);
  });

  await t.test('a paid cancellation records the 10% fee and net refund, notifies participants, and cannot be repeated or reopened', async () => {
    const id = cancelledEvent.eventId;
    const url = `/events/${id}`;
    const preview = (await call(client, 'GET', url + '/cancellation-preview')).data;
    assert.equal(preview.paidAmount, 50000.25);
    assert.equal(preview.cancellationFee, 5000.03);
    assert.equal(preview.refundAmount, 45000.22);
    const scheduled = new Date(`${cancelledEvent.date}T${cancelledEvent.time}+05:30`);
    assert.equal(preview.cancellationDeadline, new Date(scheduled.getTime() - 14 * 86400000).toISOString());
    const registration = { ...db.registrations[0], registrationId: 'reg-client-cancel', eventId: id, attendeeId: db.attendees[0].attendeeId, status: 'registered', qrCode: 'valid-before-cancellation', verificationId: 'verify-before-cancellation' };
    const declined = { ...registration, registrationId: 'reg-already-declined', status: 'rejected', rejectionReason: 'Eligibility requirements were not met.' };
    db.registrations.push(registration, declined);
    db.payments.push({ paymentId: 'pay-client-cancel-ticket', registrationId: registration.registrationId, amount: 250, status: 'completed', paymentDate: new Date(), paymentMethod: 'DEMO_PROVIDER', createdAt: new Date(), updatedAt: new Date() });
    const assignment = { ...db.staffAssignments[0], assignmentId: 'asn-client-cancel', eventId: id, staffId: db.staffProfiles[0].staffId, status: 'accepted' };
    db.staffAssignments.push(assignment);
    const body = { reason: '  Our conference plans have changed.  ', expectedPaidAmount: preview.paidAmount, ...acknowledgement };
    const result = (await call(client, 'POST', url + '/cancel', body)).data;
    assert.equal(result.event.status, 'cancelled');
    assert.equal(result.cancellation.reason, body.reason.trim());
    assert.equal(result.cancellation.cancellationFee, 5000.03);
    assert.equal(result.cancellation.refundAmount, 45000.22);
    assert.equal(result.cancellation.refundStatus, 'pending');
    const linked = db.eventRequests.find(item => item.eventId === id);
    assert.equal(linked.status, 'cancelled');
    assert.equal(registration.status, 'cancelled');
    assert.equal(registration.qrCode, undefined);
    assert.equal(registration.verificationId, undefined);
    assert.equal(declined.status, 'rejected');
    assert.equal(assignment.status, 'cancelled');
    assert.equal(db.refunds.find(item => item.registrationId === registration.registrationId).amount, 250);
    assert.equal(db.eventWorkflowRefunds.find(item => item.eventId === id).amount, 45000.22);
    assert.ok(db.notifications.some(item => item.eventId === id && item.userId === 'usr-org-001' && /client cancelled/.test(item.message)));
    assert.ok(db.notifications.some(item => item.eventId === id && item.userId === db.attendees[0].userId && /ticket is invalid/.test(item.message)));
    assert.ok(db.notifications.some(item => item.eventId === id && item.userId === db.staffProfiles[0].userId && /assignment/.test(item.message)));
    assert.equal((await call(organizer, 'GET', `/event-requests/${linked.requestId}`)).cancellation.refundAmount, 45000.22);
    await call(client, 'POST', url + '/cancel', body, 409);
    await call(client, 'POST', `/payments/events/${id}`, { paymentMethod: 'DEMO_PROVIDER' }, 409);
    await call(organizer, 'POST', url + '/complete', undefined, 400);
    await call(organizer, 'PUT', url, { status: 'ongoing' }, 400);
    await call(organizer, 'DELETE', url, undefined, 400);
    await call(client, 'POST', `/event-requests/${linked.requestId}/client-response`, { decision: 'withdraw' }, 400);
    await call(organizer, 'POST', `/event-requests/${linked.requestId}/review`, undefined, 400);
    await call(organizer, 'POST', `/event-requests/${linked.requestId}/reject`, { reason: 'Trying to change a cancelled event.' }, 400);
    await call(organizer, 'POST', `/event-requests/${linked.requestId}/confirm`, {}, 400);
    assert.equal(db.eventWorkflowRefunds.filter(item => item.eventId === id).length, 1);
  });

  await t.test('the 14-day cutoff is enforced by the API and an unpaid event has no fee or refund', async () => {
    const unpaid = await approvedEvent();
    const record = db.events.find(item => item.eventId === unpaid.eventId);
    const url = `/events/${unpaid.eventId}`;
    const body = { reason: 'The event is no longer required.', expectedPaidAmount: 0, ...acknowledgement };
    record.date = future(13);
    assert.equal((await call(client, 'GET', url + '/cancellation-preview')).data.canCancel, false);
    await call(client, 'POST', url + '/cancel', body, 400);
    assert.equal(record.status, 'ongoing');
    record.date = future(15);
    record.time = '2:30 PM';
    const preview = (await call(client, 'GET', url + '/cancellation-preview')).data;
    assert.equal(preview.canCancel, true);
    assert.equal(preview.cancellationDeadline, new Date(new Date(`${record.date}T14:30:00+05:30`).getTime() - 14 * 86400000).toISOString());
    const result = (await call(client, 'POST', url + '/cancel', body)).data;
    assert.equal(result.cancellation.cancellationFee, 0);
    assert.equal(result.cancellation.refundAmount, 0);
    assert.equal(result.cancellation.refundStatus, 'not_applicable');
    assert.ok(!db.eventWorkflowRefunds.some(item => item.eventId === unpaid.eventId));
  });

  let uploadedReport;
  await t.test('event report files go to the requesting client, enforce ownership, and remain downloadable', async () => {
    const reportEventId = 'evt-client-file-report';
    db.events.push({ ...event, eventId: reportEventId, status: 'completed', clientId: 'cli-001' });
    db.eventRequests.push({ ...request, requestId: 'req-client-file-report', eventId: reportEventId, status: 'completed', clientId: 'cli-001' });
    const content = '%PDF-1.4\nClient report attachment\n%%EOF';
    const fileForm = (text = content, name = 'event-summary.pdf', mime = 'application/pdf') => {
      const form = new FormData();
      form.set('file', new Blob([text], { type: mime }), name);
      return form;
    };
    const route = `/reports/events/${reportEventId}/file`;
    const reportsBefore = db.eventReports.length;
    await call(otherOrganizer, 'POST', route, fileForm(), 403);
    await call(client, 'POST', route, fileForm(), 403);
    await call(organizer, 'POST', route, fileForm('not a PDF'), 400);
    await call(organizer, 'POST', route, fileForm('text', 'summary.txt', 'text/plain'), 400);
    const orphan = { ...event, eventId: 'evt-no-requesting-client', clientId: undefined, status: 'completed' };
    db.events.push(orphan);
    await call(organizer, 'POST', `/reports/events/${orphan.eventId}/file`, fileForm(), 400);
    assert.equal(db.eventReports.length, reportsBefore);
    const uploadDirectory = path.join(directory, 'uploads', 'event-reports');
    assert.equal(fs.readdirSync(uploadDirectory).length, 0, 'Rejected submissions must remove uploaded files');
    const notificationStart = db.notifications.length;
    const forged = (await call(organizer, 'POST', '/reports/events', { eventId: reportEventId, organizerId: 'other-org', clientId: 'other-client', reportTitle: 'Client summary', reportDetails: 'Completed event services and expenses.', submissionDate: future(-1) }, 201)).data;
    assert.equal(forged.organizerId, 'org-001');
    assert.equal(forged.clientId, 'cli-001', 'The browser cannot redirect a report to a different client');
    uploadedReport = (await call(organizer, 'POST', route, fileForm(), 201)).data;
    assert.equal(uploadedReport.clientId, 'cli-001');
    assert.equal(uploadedReport.clientUserId, 'usr-client-001');
    assert.equal(uploadedReport.documentName, 'event-summary.pdf');
    assert.equal(uploadedReport.documentSize, Buffer.byteLength(content));
    const notifications = db.notifications.slice(notificationStart);
    assert.equal(notifications.length, 2);
    assert.ok(notifications.every(item => item.userId === 'usr-client-001' && item.type === 'event_report'));
    assert.ok((await call(client, 'GET', '/reports/events')).some(item => item.eventReportId === uploadedReport.eventReportId));
    assert.ok(!(await call(otherClient, 'GET', '/reports/events')).some(item => item.eventReportId === uploadedReport.eventReportId));
    const downloadRoute = `/reports/events/${uploadedReport.eventReportId}/file`;
    await call(otherClient, 'GET', downloadRoute, undefined, 403);
    await call(otherOrganizer, 'GET', downloadRoute, undefined, 403);
    const download = await fetch(base + downloadRoute, { headers: { Authorization: `Bearer ${client}` } });
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-type'), /application\/pdf/);
    assert.match(download.headers.get('content-disposition'), /event-summary.pdf/);
    assert.equal(await download.text(), content);
  });

  await t.test('payment, completion, reports, reviews, and saved workflow data survive the restoration', async () => {
    await call(otherClient, 'POST', `/payments/events/${event.eventId}`, { paymentMethod: 'DEMO_PROVIDER' }, 403);
    await call(client, 'POST', '/reviews/client-organizer', { eventId: event.eventId, rating: 5, comment: 'A wonderful conference.' }, 403);
    const payment = (await call(client, 'POST', `/payments/events/${event.eventId}`, { paymentMethod: 'DEMO_PROVIDER' }, 201)).data;
    assert.equal(payment.amount, request.budget);
    await call(client, 'POST', `/payments/events/${event.eventId}`, { paymentMethod: 'DEMO_PROVIDER' }, 409);
    await call(organizer, 'POST', `/events/${event.eventId}/complete`, undefined, 400);
    // Simulate the event date passing in this isolated test store.
    db.events.find(item => item.eventId === event.eventId).date = future(-2);
    db.eventRequests.find(item => item.requestId === request.requestId).eventDate = future(-2);
    await call(organizer, 'POST', `/events/${event.eventId}/complete`);
    await call(organizer, 'POST', `/reports/events/${event.eventId}/completion`, { servicesProvided: 'Catering, sound, and event coordination.', expenses: 'Catering 30000; sound and services 20000.', completionNotes: 'All sessions completed successfully.' }, 201);
    await call(client, 'POST', '/reviews/client-organizer', { eventId: event.eventId, rating: 5, comment: 'A wonderful conference.' }, 201);
    const publicReviews = (await call(client, 'GET', '/reviews/organizers/org-001')).data.reviews;
    assert.ok(publicReviews.some(item => item.eventName === request.eventName && item.reviewerName === 'Michael Torres' && item.rating === 5));
    const saved = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    assert.ok(saved.eventWorkflowPayments.some(item => item.eventId === event.eventId));
    assert.ok(saved.eventWorkflowRefunds.some(item => item.eventId === cancelledEvent.eventId && item.amount === 45000.22));
    assert.ok(saved.eventCompletionReports.some(item => item.eventId === event.eventId));
    assert.equal(saved.eventRequests.find(item => item.requestId === request.requestId).status, 'completed');
    assert.ok(saved.clientOrganizerReviews.some(item => item.reviewId === 'rev-org-demo-001'), 'Existing sample reviews must remain');
    DataStore.instance = undefined;
    const reloaded = DataStore.getInstance();
    assert.equal(reloaded.eventRequests.find(item => item.requestId === request.requestId).status, 'completed');
    assert.equal(reloaded.eventPlans.filter(item => item.requestId === request.requestId).length, 2);
    assert.ok(reloaded.eventCompletionReports[0].submittedAt instanceof Date);
    assert.ok(reloaded.eventRequests.find(item => item.requestId === request.requestId).clientPolicyAcceptedAt instanceof Date);
    assert.ok(reloaded.eventRequests.find(item => item.requestId === request.requestId).organizerPolicyAcceptedAt instanceof Date);
    assert.ok(reloaded.events.find(item => item.eventId === cancelledEvent.eventId).cancellation.cancelledAt instanceof Date);
    assert.ok(reloaded.eventReports.some(item => item.eventReportId === uploadedReport.eventReportId && item.clientId === 'cli-001' && item.documentName === 'event-summary.pdf'));
  });

  await t.test('client request creation rejects startTime, endTime, and budgetFlexibility and accepts supported fields', async () => {
    const invalidWithExtraProps = {
      clientId: 'usr-client-001', organizerId: 'usr-org-001', eventName: `Timing event ${++sequence}`,
      eventDate: future(500 + sequence), eventType: 'Corporate Events', venue: 'Convention Center',
      budget: 60000, capacity: 150, city: 'Bangalore', requirements: 'Complete setup',
      startTime: '10:00', endTime: '19:00', budgetFlexibility: 'fixed',
      ...acknowledgement,
    };
    const errorResponse = await call(client, 'POST', '/event-requests', invalidWithExtraProps, 400);
    assert.ok(errorResponse.message.some(msg => msg.includes('property startTime should not exist')));
    assert.ok(errorResponse.message.some(msg => msg.includes('property endTime should not exist')));
    assert.ok(errorResponse.message.some(msg => msg.includes('property budgetFlexibility should not exist')));

    const validPayload = {
      clientId: 'usr-client-001', organizerId: 'usr-org-001', eventName: `Supported event ${++sequence}`,
      eventDate: future(500 + sequence), eventType: 'Corporate Events', venue: 'Convention Center',
      budget: 75000, capacity: 200, city: 'Bangalore', requirements: 'Complete corporate setup with audio and dining',
      ...acknowledgement,
    };
    const created = (await call(client, 'POST', '/event-requests', validPayload, 201)).data;
    assert.equal(created.startTime, undefined);
    assert.equal(created.endTime, undefined);
    assert.equal(created.budgetFlexibility, undefined);
    assert.equal(created.budget, 75000);
    assert.equal(created.capacity, 200);
    assert.equal(created.city, 'Bangalore');
    assert.equal(created.venue, 'Convention Center');
    assert.equal(created.requirements, 'Complete corporate setup with audio and dining');

    // Duplicate submission should be blocked with 409 Conflict
    await call(client, 'POST', '/event-requests', validPayload, 409);

    // Verify organizer can see the created request with its details
    const orgReqs = await call(organizer, 'GET', '/event-requests');
    const orgFound = orgReqs.find(item => item.requestId === created.requestId);
    assert.ok(orgFound, 'Organizer must be able to view the newly created event request');
    assert.equal(orgFound.eventName, `Supported event ${sequence}`);
  });
});
