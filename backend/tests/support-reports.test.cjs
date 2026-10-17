const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('Support Executive reports reach the admin inbox with real documents and persisted reviews', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-support-reports-'));
  const previousCwd = process.cwd(), previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  db.supportExecutiveReports = []; db.notifications = [];
  const executive = db.users.find(user => user.email === 'employee@example.com');
  executive.employeeType = 'SUPPORT_EXECUTIVE';
  db.users.push({ ...executive, userId: 'usr-other-support', email: 'other-support@example.com', name: 'Other Support Executive' });
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(async () => {
    await app.close(); DataStore.instance = undefined; process.chdir(previousCwd);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-support-reports-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function call(token, method, route, body, expected = 200) {
    const response = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
    if (route.endsWith('/file') && response.ok) return response;
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }
  const login = async (email, password) => (await call(null, 'POST', '/auth/login', { email, password })).token;
  const admin = await login('superadmin@example.com', 'Admin@123');
  const agent = await login('employee@example.com', 'Employee@123');
  const { AuthService } = require('../src/modules/auth/auth.service');
  const otherAgent = app.get(AuthService).login({ email: 'other-support@example.com', password: 'Employee@123' }).data.token;
  const attendee = await login('attendee@example.com', 'Attendee@123');
  const organizer = await login('organizer@example.com', 'Organizer@123');
  const finance = await login('marcus.ops@eventflow.com', 'Employee@123');
  const issue = { title: 'Support report for October', category: 'Support & Issue Summary', scope: 'Platform Wide', period: 'October 2026', summary: 'Resolved 12 customer requests.\nVenue checks completed.', status: 'draft', sourceReference: 'form:report-1' };
  const bytes = Buffer.from('%PDF-1.4\nSupport report document\n%%EOF');
  let report;

  await t.test('drafts remain private and only support executives can create reports', async () => {
    await call(null, 'GET', '/reports/support', null, 401);
    for (const token of [attendee, organizer, finance]) {
      await call(token, 'GET', '/reports/support', null, 403);
      await call(token, 'POST', '/reports/support', issue, 403);
    }
    await call(admin, 'POST', '/reports/support', issue, 403);
    await call(agent, 'POST', '/reports/support', { ...issue, author: 'Forged author' }, 400);
    await call(agent, 'POST', '/reports/support', { ...issue, title: '  ' }, 400);
    const form = new FormData();
    for (const [key, value] of Object.entries(issue)) form.append(key, value);
    form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'October support.pdf');
    report = await call(agent, 'POST', '/reports/support', form, 201);
    assert.equal(report.status, 'draft');
    assert.equal(report.author, executive.name);
    assert.equal(report.hasDocument, true);
    assert.equal(report.documentName, 'October support.pdf');
    assert.equal(report.documentFileName, undefined, 'Storage paths must not be exposed');
    assert.equal((await call(admin, 'GET', '/reports/support')).length, 0);
    await call(admin, 'GET', `/reports/support/${report.reportId}`, null, 404);
    await call(admin, 'PATCH', `/reports/support/${report.reportId}/review`, { feedback: 'Not submitted' }, 404);
    assert.equal(db.notifications.length, 0);
  });

  await t.test('submitting a draft makes it visible and downloadable to admin without duplicates', async () => {
    const route = `/reports/support/${report.reportId}`;
    await call(otherAgent, 'GET', route, null, 404);
    await call(otherAgent, 'POST', route + '/submit', null, 404);
    await call(agent, 'POST', route + '/submit');
    await call(agent, 'POST', route + '/submit');
    const inbox = await call(admin, 'GET', '/reports/support');
    assert.equal(inbox.length, 1);
    assert.equal(inbox[0].status, 'submitted');
    assert.equal(inbox[0].summary.replace(/\r\n/g, '\n'), issue.summary);
    assert.equal(inbox[0].authorEmail, executive.email);
    assert.ok(inbox[0].submittedAt);
    const file = await call(admin, 'GET', route + '/file');
    assert.equal(file.headers.get('content-type'), 'application/pdf');
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes);
    await call(otherAgent, 'GET', route + '/file', null, 404);
    await call(attendee, 'GET', route + '/file', null, 403);
    assert.equal(db.notifications.filter(item => item.type === 'support_report_submitted').length, 1);
  });

  await t.test('admin feedback reaches the author and survives a data-store reload', async () => {
    const route = `/reports/support/${report.reportId}/review`;
    for (const token of [agent, otherAgent, finance, attendee]) await call(token, 'PATCH', route, { feedback: 'Not admin' }, 403);
    const reviewed = await call(admin, 'PATCH', route, { feedback: '  Reviewed. Please include resolution times next month.  ' });
    assert.equal(reviewed.status, 'reviewed');
    assert.equal(reviewed.reviewFeedback, 'Reviewed. Please include resolution times next month.');
    const own = await call(agent, 'GET', '/reports/support');
    assert.equal(own[0].reviewFeedback, reviewed.reviewFeedback);
    assert.equal((await call(otherAgent, 'GET', '/reports/support')).length, 0);
    await call(admin, 'PATCH', route, { feedback: reviewed.reviewFeedback });
    assert.equal(db.notifications.filter(item => item.type === 'support_report_reviewed').length, 1);
    DataStore.instance = undefined;
    const reloaded = DataStore.getInstance().supportExecutiveReports.find(item => item.reportId === report.reportId);
    assert.equal(reloaded.reviewFeedback, reviewed.reviewFeedback);
    assert.ok(reloaded.reviewedAt instanceof Date);
    assert.ok(reloaded.submittedAt instanceof Date);
    assert.ok(fs.existsSync(path.join(directory, 'uploads', 'support-reports', reloaded.documentFileName)));
  });

  await t.test('direct submissions and retried legacy submissions create one admin-visible report', async () => {
    const body = { ...issue, status: 'submitted', sourceReference: 'legacy:SER-old' };
    const first = await call(agent, 'POST', '/reports/support', body, 201);
    const retry = await call(agent, 'POST', '/reports/support', body, 201);
    assert.equal(first.reportId, retry.reportId);
    assert.equal((await call(admin, 'GET', '/reports/support')).length, 2);
    assert.equal(first.hasDocument, false);
    await call(admin, 'GET', `/reports/support/${first.reportId}/file`, null, 404);
    const form = new FormData();
    for (const [key, value] of Object.entries({ ...issue, sourceReference: 'bad-upload' })) form.append(key, value);
    form.append('file', new Blob(['unsafe'], { type: 'text/html' }), 'report.html');
    await call(agent, 'POST', '/reports/support', form, 400);
  });
});
