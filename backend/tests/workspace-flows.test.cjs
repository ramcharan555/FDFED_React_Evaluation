require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('connected role workflows use one persisted backend', async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-workspace-test-'));
  const storeFile = path.join(temporary, 'store.json');
  const previousFile = process.env.EVENTFLOW_DATA_FILE, previousSmtp = process.env.SMTP_HOST;
  process.env.EVENTFLOW_DATA_FILE = storeFile; process.env.SMTP_HOST = '';
  const { Module, ValidationPipe } = require('@nestjs/common');
  const { APP_INTERCEPTOR } = require('@nestjs/core');
  const { NestFactory } = require('@nestjs/core');
  const { ThrottlerModule } = require('@nestjs/throttler');
  const { DataStorePersistenceInterceptor } = require('../src/common/interceptors/data-store-persistence.interceptor');
  const { DataStore } = require('../src/common/data-store');
  const { jwtConfig } = require('../src/config/jwt.config');
  const jwt = require('jsonwebtoken');
  const names = ['auth', 'users', 'events', 'registrations', 'payments', 'attendance', 'staff-assignments', 'staff', 'event-requests', 'event-plans', 'reports', 'notifications', 'reviews', 'support', 'finance', 'workspace'];
  const imports = names.map(name => { const exported = require(`../src/modules/${name}/${name}.module`); return Object.values(exported)[0]; });
  class TestApplication {}
  Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]), ...imports], providers: [{ provide: APP_INTERCEPTOR, useClass: DataStorePersistenceInterceptor }] })(TestApplication);
  const app = await NestFactory.create(TestApplication, { logger: ['error'], abortOnError: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  let admin, operations, verifier, finance, attendee, otherAttendee, organizer, client, otherClient, staff;
  let freeEvent, paidEvent, booking, paidBooking, task, employeeReport, proposalRequest, plan;
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    async function request(actor, endpoint, method = 'GET', body, expected = 200) {
      const response = await fetch(`${base}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: `Bearer ${actor.token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      const result = await response.json();
      assert.equal(response.status, expected, `${method} ${endpoint}: ${JSON.stringify(result)}`);
      return result;
    }
    const login = await request(null, '/auth/login', 'POST', { email: 'superadmin@example.com', password: 'Admin@123' }); admin = login.data;
    const db = DataStore.getInstance();
    async function user(name, userRole, employeeType) {
      const result = await request(admin, '/users', 'POST', { name, email: `${name.toLowerCase().replace(/\W/g, '')}@test.invalid`, password: 'TestPass@123', userRole, ...(employeeType ? { employeeType } : {}) }, 201);
      return { ...result.data, token: jwt.sign({ userId: result.data.userId, email: result.data.email }, jwtConfig.secret, { expiresIn: '10m' }) };
    }
    operations = await user('Test Operations', 'event_staff', 'EVENT_OPERATIONS');
    verifier = await user('Test Verification', 'event_staff', 'REGISTRATION_VERIFICATION');
    finance = await user('Test Finance', 'event_staff', 'FINANCE_EXECUTIVE');
    attendee = await user('Test Attendee', 'attendee'); otherAttendee = await user('Other Attendee', 'attendee');
    organizer = await user('Test Organizer', 'event_organizer'); client = await user('Test Client', 'client'); otherClient = await user('Other Client', 'client'); staff = await user('Test Staff', 'event_staff');
    const orgId = db.organizers.find(o => o.userId === organizer.userId).organizerId;
    const attId = db.attendees.find(a => a.userId === attendee.userId).attendeeId;
    const staffId = db.staffProfiles.find(s => s.userId === staff.userId).staffId;
    const verifierId = db.staffProfiles.find(s => s.userId === verifier.userId).staffId;
    const clientId = db.clients.find(c => c.userId === client.userId).clientId;

    await t.test('public signup persists a real profile and cannot create privileged employees', async () => {
      const created = await request(null, '/auth/register', 'POST', { name: 'Public Signup', email: 'signup@test.invalid', password: 'PublicPass@123', userRole: 'attendee' }, 201);
      assert.ok(created.data.token); assert.ok(db.attendees.some(a => a.userId === created.data.userId));
      assert.ok(db.findUserByEmail('signup@test.invalid').password.startsWith('scrypt$'));
      await request(null, '/auth/register', 'POST', { name: 'Bad Signup', email: 'bad@test.invalid', password: 'PublicPass@123', userRole: 'super_admin' }, 400);
      await request(null, '/auth/register', 'POST', { name: 'Bad Employee', email: 'bad2@test.invalid', password: 'PublicPass@123', userRole: 'event_staff', employeeType: 'FINANCE_EXECUTIVE' }, 400);
      await request(null, '/auth/login', 'POST', { email: 'superadmin@example.com', password: 'admin123' }, 401);
    });
    await t.test('Super Admin and employee data is shared; department boundaries are enforced', async () => {
      const eventPayload = { name: 'Connected free event', category: 'Technology', date: '2099-01-20', time: '10:00', location: 'Test Venue', capacity: 10, ticketPrice: 0, organizerId: orgId };
      freeEvent = await request(organizer, '/events', 'POST', eventPayload, 201);
      await request(operations, `/workspace/events/${freeEvent.eventId}/status`, 'PATCH', { status: 'published' });
      assert.equal((await request(admin, '/workspace')).events.find(e => e.eventId === freeEvent.eventId).status, 'published');
      await request(verifier, `/workspace/events/${freeEvent.eventId}/status`, 'PATCH', { status: 'cancelled' }, 403);
      const edited = await request(operations, `/workspace/events/${freeEvent.eventId}`, 'PUT', { location: 'Updated Venue' });
      assert.equal(edited.location, 'Updated Venue');
      task = await request(operations, '/workspace/tasks', 'POST', { title: 'Confirm AV equipment', eventId: freeEvent.eventId, assignedTo: operations.userId, status: 'pending' }, 201);
      assert.ok((await request(admin, '/workspace')).tasks.some(r => r.id === task.id));
      await request(attendee, '/workspace/tasks', 'POST', { title: 'Unauthorized', eventId: freeEvent.eventId, assignedTo: operations.userId, status: 'pending' }, 403);
      await request(operations, `/workspace/tasks/${task.id}`, 'PATCH', { title: task.title, eventId: freeEvent.eventId, assignedTo: operations.userId, status: 'completed' });
      assert.equal((await request(admin, '/workspace')).tasks.find(r => r.id === task.id).status, 'completed');
    });
    await t.test('employee report reaches Super Admin and review feedback returns to the employee', async () => {
      const payload = { title: 'Event readiness', content: 'AV checked, venue confirmed.', key: 'employee-report-workflow-test' };
      employeeReport = await request(operations, '/workspace/reports', 'POST', payload, 201);
      const repeated = await request(operations, '/workspace/reports', 'POST', payload, 201); assert.equal(repeated.id, employeeReport.id);
      assert.ok((await request(admin, '/workspace')).reports.some(r => r.id === employeeReport.id));
      await request(verifier, `/workspace/reports/${employeeReport.id}/review`, 'POST', { notes: 'Unauthorized' }, 403);
      await request(admin, `/workspace/reports/${employeeReport.id}/review`, 'POST', { notes: 'Ready for publication.' }, 201);
      const feedback = (await request(operations, '/workspace')).reports.find(r => r.id === employeeReport.id);
      assert.equal(feedback.reviewNotes, 'Ready for publication.');
      assert.ok((await request(operations, '/notifications')).some(n => n.type === 'employee_report_reviewed'));
    });
    await t.test('registration review and QR verification persist without overriding payment state', async () => {
      booking = (await request(attendee, '/registrations', 'POST', { attendeeId: attId, eventId: freeEvent.eventId, ticketType: 'General Admission' }, 201)).data;
      await request(verifier, `/workspace/registrations/${booking.registrationId}/review`, 'PATCH', { status: 'approved' });
      const stored = (await request(admin, '/workspace')).registrations.find(r => r.registrationId === booking.registrationId);
      assert.equal(stored.status, 'registered'); assert.equal(stored.reviewStatus, 'approved');
      await request(operations, `/workspace/registrations/${booking.registrationId}/review`, 'PATCH', { status: 'approved' }, 403);
      await request(otherAttendee, `/registrations/${booking.registrationId}`, 'GET', undefined, 403);
      await request(verifier, '/attendance/verify', 'POST', { eventId: freeEvent.eventId, staffId: verifierId, verificationId: booking.verificationId, checkInTime: new Date().toISOString() });
      assert.equal((await request(attendee, '/registrations')).find(r => r.registrationId === booking.registrationId).status, 'attended');
      await request(verifier, '/attendance/verify', 'POST', { eventId: freeEvent.eventId, staffId: verifierId, verificationId: booking.verificationId, checkInTime: new Date().toISOString() }, 400);
    });
    await t.test('attendee demo payment updates finance; cancellation creates an approvable refund', async () => {
      paidEvent = await request(organizer, '/events', 'POST', { name: 'Connected paid event', category: 'Workshop', date: '2099-01-21', time: '10:00', location: 'Paid Venue', capacity: 4, ticketPrice: 250.55, organizerId: orgId }, 201);
      await request(operations, `/workspace/events/${paidEvent.eventId}/status`, 'PATCH', { status: 'published' });
      paidBooking = (await request(attendee, '/registrations', 'POST', { attendeeId: attId, eventId: paidEvent.eventId, ticketType: 'General Admission' }, 201)).data;
      await request(verifier, `/workspace/registrations/${paidBooking.registrationId}/review`, 'PATCH', { status: 'approved' });
      assert.equal(db.registrations.find(r => r.registrationId === paidBooking.registrationId).status, 'pending_payment');
      await request(organizer, `/events/${paidEvent.eventId}`, 'PUT', { ticketPrice: 300 });
      assert.equal(paidBooking.ticketPriceAtBooking, 250.55);
      await request(attendee, '/payments', 'POST', { registrationId: paidBooking.registrationId, amount: 300, paymentMethod: 'DEMO_PROVIDER', paymentDate: new Date().toISOString() }, 409);
      await request(attendee, '/payments', 'POST', { registrationId: paidBooking.registrationId, amount: 1, paymentMethod: 'DEMO_PROVIDER', paymentDate: new Date().toISOString() }, 409);
      await request(attendee, '/payments', 'POST', { registrationId: paidBooking.registrationId, amount: 250.55, paymentMethod: 'DEMO_PROVIDER', paymentDate: '1999-01-01' }, 201);
      assert.notEqual(db.payments.find(p => p.registrationId === paidBooking.registrationId).paymentDate.slice(0, 4), '1999');
      const dashboard = await request(finance, `/finance/dashboard?eventId=${paidEvent.eventId}`); assert.equal(dashboard.summary.gross, 25055);
      assert.equal((await request(operations, '/workspace')).payments.length, 0);
      assert.equal((await request(verifier, '/workspace')).viewRevenue, false);
      await request(attendee, '/payments', 'POST', { registrationId: paidBooking.registrationId, amount: 250.55, paymentMethod: 'DEMO_PROVIDER', paymentDate: new Date().toISOString() }, 409);
      await request(attendee, `/registrations/${paidBooking.registrationId}/cancel`, 'PATCH', { reason: 'Unable to attend' });
      const refund = (await request(finance, `/finance/refunds?eventId=${paidEvent.eventId}`)).records[0]; assert.equal(refund.amount, 25055);
      await request(finance, `/finance/refunds/${refund.id}/review`, 'POST', { action: 'approve' }, 403);
      await request(admin, '/finance/permissions', 'POST', { userId: finance.userId, permission: 'refund.approve', enabled: true }, 201);
      await request(finance, `/finance/refunds/${refund.id}/review`, 'POST', { action: 'approve' }, 201);
      assert.equal(db.refunds.find(r => r.refundId === refund.id).status, 'approved');
    });
    await t.test('organizer invitation, staff acceptance and availability are shared and private', async () => {
      const invited = (await request(organizer, '/staff-assignments', 'POST', { eventId: freeEvent.eventId, organizerId: orgId, staffId }, 201)).data;
      assert.equal((await request(staff, '/workspace')).registrations.length, 0);
      await request(staff, `/staff-assignments/${invited.assignmentId}/status`, 'PATCH', { status: 'accepted' });
      assert.ok((await request(staff, '/workspace')).registrations.some(r => r.registrationId === booking.registrationId));
      assert.equal((await request(organizer, '/staff-assignments')).find(r => r.assignmentId === invited.assignmentId).status, 'accepted');
      await request(staff, `/staff-assignments/${invited.assignmentId}/status`, 'PATCH', { status: 'completed' }, 403);
      const updated = await request(staff, `/staff/${staffId}`, 'PUT', { availableDates: ['2099-01-20', '2099-01-21'] });
      assert.equal(updated.availableDates.length, 2); assert.equal(updated.password, undefined);
      assert.ok((await request(organizer, '/staff')).every(s => !('password' in s)));
    });
    await t.test('a cancellation offers the next waitlisted attendee a persisted seat', async () => {
      const event = await request(organizer, '/events', 'POST', { name: 'Waitlist event', category: 'Workshop', date: '2099-04-01', time: '10:00', location: 'Small Venue', capacity: 1, ticketPrice: 0, organizerId: orgId, waitlistEnabled: true }, 201);
      await request(operations, `/workspace/events/${event.eventId}/status`, 'PATCH', { status: 'published' });
      const first = (await request(attendee, '/registrations', 'POST', { attendeeId: attId, eventId: event.eventId, ticketType: 'General Admission' }, 201)).data;
      const otherId = db.attendees.find(a => a.userId === otherAttendee.userId).attendeeId;
      const waiting = (await request(otherAttendee, '/registrations', 'POST', { attendeeId: otherId, eventId: event.eventId, ticketType: 'General Admission', joinWaitlist: true }, 201)).data;
      assert.equal(waiting.status, 'waitlisted');
      await request(attendee, `/registrations/${first.registrationId}/cancel`, 'PATCH', { reason: 'Release my free seat' });
      assert.ok((await request(otherAttendee, '/workspace')).registrations.find(r => r.registrationId === waiting.registrationId).offerExpiresAt);
      await request(otherAttendee, `/registrations/${waiting.registrationId}/waitlist/confirm`, 'POST', {}, 201);
      assert.equal((await request(otherAttendee, '/registrations')).find(r => r.registrationId === waiting.registrationId).status, 'registered');
    });
    await t.test('client request, proposal, agreement and zero-deposit booking form a real workflow', async () => {
      proposalRequest = (await request(client, '/event-requests', 'POST', { clientId, organizerId: orgId, eventName: 'Client conference', eventDate: '2099-03-03', budget: 50000, capacity: 100, requirements: 'Conference hall and AV' }, 201)).data;
      await request(organizer, `/event-requests/${proposalRequest.requestId}/review`, 'POST', {}, 201);
      await request(organizer, `/event-requests/${proposalRequest.requestId}/proposal`, 'POST', { amount: 50000, depositRequired: 0, proposedDate: '2099-03-03', validUntil: '2099-02-01', terms: 'Demo event planning contract' }, 201);
      await request(client, `/event-requests/${proposalRequest.requestId}/client-response`, 'POST', { decision: 'accept', notes: 'Accepted.' }, 201);
      await request(client, `/event-requests/${proposalRequest.requestId}/payment`, 'POST', { paymentStatus: 'deposit_paid' }, 403);
      await request(client, `/event-requests/${proposalRequest.requestId}/agreement`, 'POST', { agreementStatus: 'agreed' }, 201);
      const confirmed = (await request(organizer, `/event-requests/${proposalRequest.requestId}/confirm`, 'POST', {}, 201)).data;
      assert.equal(confirmed.status, 'confirmed');
      assert.ok((await request(client, '/workspace')).events.some(e => e.eventId === confirmed.eventId));
      await request(otherClient, `/event-requests/${proposalRequest.requestId}`, 'GET', undefined, 403);
    });
    await t.test('plans and event reports reach their actual client with ownership checks', async () => {
      const confirmedEvent = db.events.find(e => e.clientId === clientId && e.name === 'Client conference');
      plan = (await request(organizer, '/event-plans', 'POST', { organizerId: orgId, clientId, eventId: confirmedEvent.eventId, title: 'Conference execution plan', description: 'Setup, doors, speakers, teardown', budget: 50000, capacity: 100 }, 201)).data;
      assert.ok((await request(client, '/event-plans')).some(p => p.eventPlanId === plan.eventPlanId));
      await request(otherClient, `/event-plans/${plan.eventPlanId}`, 'GET', undefined, 403);
      await request(client, `/event-plans/${plan.eventPlanId}/approval`, 'PATCH', { approvalStatus: 'approved' });
      await request(organizer, '/reports/events', 'POST', { eventId: confirmedEvent.eventId, organizerId: orgId, clientId, reportTitle: 'Conference report', reportDetails: 'Plan is approved and ready.', submissionDate: '2026-10-16' }, 201);
      assert.ok((await request(client, '/workspace')).eventReports.some(r => r.reportTitle === 'Conference report'));
    });
    await t.test('support ticket updates and notification read states reach the correct requester', async () => {
      const ticket = await request(attendee, '/support/tickets', 'POST', { requestType: 'Account Related Problems', concern: 'Profile details not saving', description: 'Please help with my account.' }, 201);
      await request(admin, `/support/tickets/${ticket.ticketId}/status`, 'PATCH', { status: 'in_progress', response: 'We are checking your profile.' });
      const ownTickets = await request(attendee, '/support/tickets'); assert.equal(ownTickets.find(r => r.ticketId === ticket.ticketId).response, 'We are checking your profile.');
      assert.ok(!(await request(otherAttendee, '/support/tickets')).some(r => r.ticketId === ticket.ticketId));
      const notifications = await request(attendee, '/notifications'); assert.ok(notifications.length > 0);
      await request(attendee, `/notifications/${notifications[0].notificationId}/read`, 'PATCH', {});
      assert.equal((await request(attendee, '/notifications')).find(n => n.notificationId === notifications[0].notificationId).read, true);
      await request(otherAttendee, `/notifications/${notifications[0].notificationId}/read`, 'PATCH', {}, 404);
    });
    await t.test('account edits and password changes persist without storing passwords in UI responses', async () => {
      await request(attendee, '/workspace/account', 'PATCH', { name: 'Updated Attendee', email: attendee.email, phoneNo: '9876543210', bio: 'Updated via API', preferences: { emailNotifications: true, smsReminders: false, eventRecommendations: true } });
      assert.equal((await request(admin, '/workspace')).users.find(u => u.userId === attendee.userId).name, 'Updated Attendee');
      await request(attendee, '/workspace/password', 'POST', { currentPassword: 'TestPass@123', newPassword: 'ChangedPass@123' }, 201);
      const changed = await request(null, '/auth/login', 'POST', { email: attendee.email, password: 'ChangedPass@123' }); assert.ok(changed.data.token); assert.equal(changed.data.password, undefined);
      const snapshot = await request(attendee, '/workspace'); assert.equal(snapshot.actor.password, undefined); assert.ok(snapshot.users.every(u => !('password' in u)));
    });
    await t.test('successful actions survive snapshot restoration', async () => {
      const stored = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
      assert.equal(stored.employeeReports.find(r => r.id === employeeReport.id).status, 'reviewed');
      assert.equal(stored.operationTasks.find(r => r.id === task.id).status, 'completed');
      assert.equal(stored.registrations.find(r => r.registrationId === booking.registrationId).status, 'attended');
      assert.ok(stored.users.find(u => u.userId === attendee.userId).password.startsWith('scrypt$'));
    });
  } finally {
    await app.close();
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    if (previousSmtp === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = previousSmtp;
    for (const file of [storeFile, `${storeFile}.tmp`]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(temporary);
  }
});
