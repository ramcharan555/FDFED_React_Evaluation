const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('Customer Support requests reach support executives and saved replies reach their requesters', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-support-workflow-'));
  const previousCwd = process.cwd(), previousFile = process.env.EVENTFLOW_DATA_FILE;
  const dataFile = path.join(directory, 'store.json');
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = dataFile;
  const { DataStore } = require('../src/common/data-store');
  const { UserRole } = require('../src/common/constants');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  db.supportTickets = []; db.supportAttachments = []; db.notifications = [];
  db.users.find(user => user.userId === 'usr-emp-001').employeeType = 'EVENT_OPERATIONS';
  db.users.find(user => user.email === 'marcus.ops@eventflow.com').employeeType = 'FINANCE_EXECUTIVE';
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const { SupportMailService } = require('../src/modules/support/support-mail.service');
  const { SupportService } = require('../src/modules/support/support.service');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  let emailAttempts = 0;
  app.get(SupportMailService).sendResolvedEmail = async () => { emailAttempts++; return false; };
  t.after(async () => {
    await app.close(); DataStore.instance = undefined; process.chdir(previousCwd);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-support-workflow-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function call(token, method, route, body, expected = 200) {
    const response = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }
  const login = async (email, password) => (await call(null, 'POST', '/auth/login', { email, password })).token;
  const attendee = await login('attendee@example.com', 'Attendee@123');
  const client = await login('client@example.com', 'Client@123');
  const organizer = await login('organizer@example.com', 'Organizer@123');
  const agent = await login('employee@example.com', 'Employee@123');
  const finance = await login('marcus.ops@eventflow.com', 'Employee@123');
  const issue = { requestType: 'Account Related Problems', concern: 'Profile details not saving', description: 'My new phone number does not stay saved after refreshing.' };
  let ticket;

  await t.test('requests from different user roles arrive in the real support queue with requester details', async () => {
    for (const token of [agent, finance]) await call(token, 'POST', '/support/tickets', issue, 403);
    assert.throws(() => app.get(SupportService).createTicket('usr-staff-001', UserRole.EVENT_STAFF, issue), /Your role cannot submit/);
    ticket = await call(attendee, 'POST', '/support/tickets', issue, 201);
    await call(client, 'POST', '/support/tickets', { ...issue, description: 'Our company profile changes are not saving.' }, 201);
    await call(organizer, 'POST', '/support/tickets', { ...issue, description: 'Our organizer profile needs assistance.' }, 201);
    const queue = await call(agent, 'GET', '/support/tickets');
    assert.equal(queue.length, 3);
    const received = queue.find(item => item.ticketId === ticket.ticketId);
    assert.equal(received.description, issue.description);
    assert.ok(received.requesterName && received.requesterEmail);
    assert.equal(received.requesterRole, 'attendee');
    assert.equal((await call(attendee, 'GET', '/support/tickets')).length, 1);
    assert.equal((await call(finance, 'GET', '/support/tickets')).length, 0);
    assert.ok(db.notifications.some(item => item.userId === 'usr-emp-001' && item.supportTicketId === ticket.ticketId && item.type === 'support_ticket_received'));
    for (const type of ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS']) {
      db.users.find(user => user.userId === 'usr-emp-001').employeeType = type;
      assert.equal((await call(agent, 'GET', '/support/tickets')).length, 3);
    }
    assert.equal(app.get(SupportService).listTickets('usr-staff-001', UserRole.EVENT_STAFF).length, 0);
  });

  await t.test('only support agents can reply or update status; resolution needs a current reply', async () => {
    const route = `/support/tickets/${ticket.ticketId}/status`;
    for (const token of [attendee, client, organizer, finance]) await call(token, 'PATCH', route, { status: 'resolved', response: 'Pretending to be support.' }, 403);
    const before = JSON.stringify(db.supportTickets.find(item => item.ticketId === ticket.ticketId));
    for (const body of [{ status: 'resolved' }, { status: 'resolved', response: '   ' }, { status: 'invalid' }, { status: 'resolved', response: 'x'.repeat(2001) }]) await call(agent, 'PATCH', route, body, 400);
    assert.equal(JSON.stringify(db.supportTickets.find(item => item.ticketId === ticket.ticketId)), before);
    const progress = await call(agent, 'PATCH', route, { status: 'in_progress', response: 'We are checking why your profile update was not saved.' });
    assert.equal(progress.status, 'in_progress');
    assert.equal(progress.messages.at(-1).senderId, 'usr-emp-001');
    assert.ok(progress.messages.at(-1).senderName);
    const resolved = await call(agent, 'PATCH', route, { status: 'resolved', response: '  Your issue has been resolved. Please try saving your phone number again.  ' });
    assert.equal(resolved.status, 'resolved');
    assert.equal(resolved.response, 'Your issue has been resolved. Please try saving your phone number again.');
    assert.equal(resolved.emailNotificationSent, false);
    assert.equal(emailAttempts, 1);
    const notificationsBefore = db.notifications.length;
    await call(agent, 'PATCH', route, { status: 'resolved', response: resolved.response });
    assert.equal(db.notifications.length, notificationsBefore, 'Retrying an identical update must not send duplicate notifications');
    assert.equal(db.supportTickets.find(item => item.ticketId === ticket.ticketId).messages.length, 2);
    const received = (await call(attendee, 'GET', '/support/tickets'))[0];
    assert.equal(received.response, resolved.response);
    assert.equal(received.status, 'resolved');
    assert.equal(received.messages.length, 2);
    assert.ok(db.notifications.some(item => item.userId === ticket.userId && item.supportTicketId === ticket.ticketId && item.message.includes(resolved.response)));
  });

  await t.test('requester follow-ups reopen the ticket and mail failure does not lose a saved support reply', async () => {
    await call(client, 'POST', `/support/tickets/${ticket.ticketId}/follow-ups`, { message: 'Not my request.' }, 404);
    const reopened = await call(attendee, 'POST', `/support/tickets/${ticket.ticketId}/follow-ups`, { message: 'The phone number still resets after I sign in again.' }, 201);
    assert.equal(reopened.status, 'open');
    assert.equal(reopened.messages.at(-1).sender, 'requester');
    assert.ok(db.notifications.some(item => item.userId === 'usr-emp-001' && item.message.includes('user replied')));
    await call(agent, 'PATCH', `/support/tickets/${ticket.ticketId}/status`, { status: 'resolved' }, 400);
    app.get(SupportMailService).sendResolvedEmail = async () => { throw Error('Simulated mail outage'); };
    const final = await call(agent, 'PATCH', `/support/tickets/${ticket.ticketId}/status`, { status: 'resolved', response: 'We corrected the profile sync issue. Your phone number will now remain saved.' });
    assert.equal(final.status, 'resolved');
    assert.equal(final.emailNotificationSent, false);
    assert.equal(final.messages.length, 4);
    DataStore.instance = undefined;
    const reloaded = DataStore.getInstance();
    const saved = reloaded.supportTickets.find(item => item.ticketId === ticket.ticketId);
    assert.equal(saved.response, final.response);
    assert.equal(saved.status, 'resolved');
    assert.ok(saved.messages.every(message => message.createdAt instanceof Date));
    assert.ok(reloaded.notifications.some(item => item.supportTicketId === ticket.ticketId && item.message.includes(final.response)));
  });
});
