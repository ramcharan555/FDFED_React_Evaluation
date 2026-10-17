const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('saved data communicates across authenticated role workspaces and survives reloads', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-dynamic-data-'));
  const previousCwd = process.cwd(), previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.chdir(directory); process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const { AuthService } = require('../src/modules/auth/auth.service');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(async () => {
    await app.close(); DataStore.instance = undefined; process.chdir(previousCwd);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-dynamic-data-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  const login = (email, password) => app.get(AuthService).login({ email, password }).data.token;
  const admin = login('superadmin@example.com', 'Admin@123'), support = login('employee@example.com', 'Employee@123');
  const organizer = login('organizer@example.com', 'Organizer@123'), staff = login('staff@example.com', 'Staff@123');
  const attendee = login('attendee@example.com', 'Attendee@123'), finance = login('marcus.ops@eventflow.com', 'Employee@123');
  const client = login('client@example.com', 'Client@123');
  const tokenByRole = { admin, support, organizer, staff, attendee, finance, client };
  async function call(token, method, route, body, expected = 200) {
    const response = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }
  const workspace = token => call(token, 'GET', '/workspace');
  let event, registration, assignment;

  await t.test('every role receives its real workspace without passwords, file storage paths, or unrelated personnel', async () => {
    await call(null, 'GET', '/workspace', null, 401);
    for (const [role, token] of Object.entries(tokenByRole)) {
      const result = await workspace(token);
      assert.ok(result.version);
      assert.equal(Object.hasOwn(result.currentUser, 'password'), false);
      assert.equal(JSON.stringify(result).includes('documentFileName'), false);
      for (const user of result.users) assert.equal(Object.hasOwn(user, 'password'), false);
      if (role === 'support') {
        assert.equal(result.users.some(user => user.userRole === 'event_staff' || user.employeeType), false);
        assert.equal(result.staffAssignments.length, 0); assert.equal(result.staffProfiles.length, 0);
      }
      if (role === 'attendee') assert.ok(result.registrations.every(item => item.attendee.userId === 'usr-attendee-001'));
      assert.ok(result.notifications.every(item => item.userId === result.currentUser.userId));
    }
  });

  await t.test('an organizer event and paid attendee registration reach admin, support and finance', async () => {
    event = await call(organizer, 'POST', '/events', { name: 'Dynamic integration conference', category: 'Technology',
      date: '2099-11-20', time: '10:00', location: 'Integration Hall', capacity: 20, ticketPrice: 125, status: 'published' }, 201);
    registration = await call(attendee, 'POST', '/registrations', { attendeeId: 'usr-attendee-001', eventId: event.eventId, ticketType: 'General' }, 201);
    await call(attendee, 'POST', '/payments', { registrationId: registration.registrationId, amount: 125, paymentMethod: 'DEMO_PROVIDER', paymentDate: '2026-10-17' }, 201);
    const before = await workspace(admin);
    for (const token of [admin, support, organizer, attendee, finance]) {
      const result = await workspace(token);
      assert.equal(result.events.find(item => item.eventId === event.eventId).registered, 1);
      assert.equal(result.registrations.find(item => item.registrationId === registration.registrationId).payment.amount, 125);
    }
    assert.ok((await call(null, 'GET', '/public/events')).some(item => item.eventId === event.eventId));
    await call(support, 'PATCH', `/workspace/events/${event.eventId}`, { location: 'Updated Integration Hall' });
    const after = await workspace(admin);
    assert.notEqual(after.version, before.version);
    assert.equal(after.events.find(item => item.eventId === event.eventId).location, 'Updated Integration Hall');
    const notifications = await call(attendee, 'GET', '/notifications');
    assert.ok(notifications.some(item => item.eventId === event.eventId && item.type === 'event_changed'));
  });

  await t.test('support customer edits and registration reviews persist while personnel remain protected', async () => {
    await call(support, 'PATCH', '/workspace/customers/usr-attendee-001', { name: 'Updated Attendee' });
    assert.equal((await workspace(attendee)).currentUser.name, 'Updated Attendee');
    for (const id of ['usr-admin-001', 'usr-staff-001', 'usr-emp-001c']) {
      await call(support, 'PATCH', `/workspace/customers/${id}`, { name: 'Forbidden' }, 403);
      await call(support, 'DELETE', `/workspace/customers/${id}`, null, 403);
    }
    await call(finance, 'PATCH', '/workspace/customers/usr-attendee-001', { name: 'Forbidden' }, 403);
    await call(support, 'PATCH', '/workspace/customers/usr-attendee-001', { userRole: 'super_admin' }, 400);
    await call(support, 'PATCH', `/registrations/${registration.registrationId}/review`, { decision: 'approved' });
    assert.equal((await call(attendee, 'GET', `/registrations/${registration.registrationId}`)).reviewStatus, 'approved');
    const stats = await call(support, 'GET', '/analytics/staff-dashboard');
    assert.equal(stats.registrationsAwaitingReview, db.registrations.filter(item => !item.reviewStatus && ['registered', 'pending_payment', 'waitlisted'].includes(item.status)).length);
    assert.ok((await call(attendee, 'GET', '/notifications')).some(item => item.registrationId === registration.registrationId && item.type === 'registration_approved'));
  });

  await t.test('staff assignments, responses, attendance reports and notifications reach their organizer', async () => {
    const profile = db.staffProfiles.find(item => item.userId === 'usr-staff-001'); profile.availableDates = [];
    assignment = await call(organizer, 'POST', '/staff-assignments', { eventId: event.eventId, organizerId: event.organizerId,
      staffId: profile.staffId, role: 'Check-in desk', fee: 1500, notes: 'Arrive at 09:00.' }, 201);
    const staffView = await workspace(staff);
    assert.equal(staffView.staffAssignments.find(item => item.assignmentId === assignment.assignmentId).role, 'Check-in desk');
    assert.ok(staffView.notifications.some(item => item.type === 'assignment' && item.eventId === event.eventId));
    await call(staff, 'PATCH', `/staff-assignments/${assignment.assignmentId}/status`, { status: 'accepted' });
    assert.equal((await workspace(organizer)).staffAssignments.find(item => item.assignmentId === assignment.assignmentId).status, 'accepted');
    const report = { eventId: event.eventId, organizerId: event.organizerId, staffId: profile.staffId, reportText: 'One attendee checked in.' };
    await call(staff, 'POST', '/reports/staff', { ...report, staffId: db.staffProfiles.find(item => item.userId !== profile.userId).staffId }, 403);
    const submitted = await call(staff, 'POST', '/reports/staff', report, 201);
    const retry = await call(staff, 'POST', '/reports/staff', report, 201);
    assert.equal(retry.staffReportId, submitted.staffReportId);
    assert.ok((await workspace(organizer)).staffReports.some(item => item.staffReportId === submitted.staffReportId));
    await call(staff, 'PUT', `/staff/${profile.staffId}`, { availableDates: ['2099-11-21'] });
    assert.deepEqual((await workspace(staff)).staffProfiles.find(item => item.staffId === profile.staffId).availableDates, ['2099-11-21']);
  });

  await t.test('finance drafts stay private and submitted reports and admin reviews reach both workspaces', async () => {
    const report = await call(finance, 'POST', '/reports/operational', { title: 'Live finance reconciliation', category: 'Finance Report',
      scope: 'Platform Wide', period: 'October 2026', summary: 'Reconciled current registration payments.', status: 'draft', sourceReference: 'form:finance-integration' }, 201);
    assert.equal((await workspace(admin)).supportReports.some(item => item.reportId === report.reportId), false);
    await call(finance, 'POST', `/reports/operational/${report.reportId}/submit`, null, 201);
    assert.ok((await workspace(admin)).supportReports.some(item => item.reportId === report.reportId));
    await call(admin, 'PATCH', `/reports/support/${report.reportId}/review`, { feedback: 'Reconciliation approved.' });
    assert.equal((await workspace(finance)).supportReports.find(item => item.reportId === report.reportId).reviewFeedback, 'Reconciliation approved.');
    await call(support, 'GET', '/reports/operational', null, 403);
    const notification = (await call(finance, 'GET', '/notifications')).find(item => item.supportReportId === report.reportId);
    await call(finance, 'PATCH', `/notifications/${notification.notificationId}/read`);
    assert.equal((await workspace(finance)).notifications.find(item => item.notificationId === notification.notificationId).read, true);
  });

  await t.test('email and password edits remain usable in the current session and after sign-in', async () => {
    await call(support, 'PATCH', '/users/usr-emp-001', { email: 'updated-support@example.com', name: 'Updated Support', bio: 'Saved biography' });
    const profile = (await workspace(support)).currentUser;
    assert.equal(profile.email, 'updated-support@example.com'); assert.equal(profile.bio, 'Saved biography');
    await call(support, 'POST', '/auth/password', { currentPassword: 'Incorrect', newPassword: 'Updated@123' }, 400);
    await call(support, 'POST', '/auth/password', { currentPassword: 'Employee@123', newPassword: 'Updated@123' });
    assert.ok(login('updated-support@example.com', 'Updated@123'));
  });

  await t.test('public signup creates server accounts, returns an attendee token, and requires approval for other roles', async () => {
    const created = await call(null, 'POST', '/auth/register', { name: 'New Live Attendee', email: 'new-attendee@example.com',
      password: 'NewUser@123', userRole: 'attendee', profile: { city: 'Hyderabad', employeeType: 'SUPPORT_EXECUTIVE', password: 'ignored' } }, 201);
    assert.ok(created.token);
    const own = await workspace(created.token);
    assert.equal(own.currentUser.profile.city, 'Hyderabad'); assert.equal(own.currentUser.employeeType, undefined);
    assert.equal(own.currentUser.profile.password, undefined);
    await call(null, 'POST', '/auth/register', { name: 'Duplicate', email: 'NEW-ATTENDEE@example.com', password: 'NewUser@123', userRole: 'attendee' }, 409);
    await call(null, 'POST', '/auth/register', { name: 'Admin', email: 'fake-admin@example.com', password: 'NewUser@123', userRole: 'super_admin' }, 400);
    const pending = await call(null, 'POST', '/auth/register', { name: 'New Live Client', email: 'new-client@example.com', password: 'NewUser@123', userRole: 'client' }, 201);
    assert.equal(pending.status, 'pending'); assert.equal(pending.token, undefined);
    assert.equal((await workspace(admin)).users.find(user => user.userId === pending.userId).status, 'pending');
    await call(admin, 'PATCH', `/users/${pending.userId}`, { status: 'active' });
    assert.ok(login('new-client@example.com', 'NewUser@123'));
    db.persist(); DataStore.instance = undefined;
    const restored = DataStore.getInstance();
    assert.ok(restored.registrations.some(item => item.registrationId === registration.registrationId && item.reviewStatus === 'approved'));
    assert.ok(restored.staffAssignments.some(item => item.assignmentId === assignment.assignmentId && item.status === 'accepted'));
    assert.ok(restored.supportExecutiveReports.some(item => item.title === 'Live finance reconciliation' && item.status === 'reviewed'));
    assert.equal(restored.findUserById('usr-emp-001').email, 'updated-support@example.com');
  });
});
