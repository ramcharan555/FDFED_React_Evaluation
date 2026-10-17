const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { FinanceService } = require('../src/modules/finance/finance.service');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-finance-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const now = new Date('2026-10-15T12:00:00.000Z');
  db.events = [{ eventId: 'evt-test', organizerId: 'org-001', name: 'Test Event', category: 'Workshop', date: '2026-11-01', time: '10:00', location: 'Test Hall', capacity: 10, ticketPrice: 100, status: 'published', createdAt: now, updatedAt: now }];
  db.registrations = ['a','b'].map((id) => ({ registrationId: `reg-${id}`, attendeeId: 'att-001', eventId: 'evt-test', registrationDate: '2026-10-15', status: 'registered', ticketType: 'General', createdAt: now, updatedAt: now }));
  db.payments = [
    { paymentId: 'pay-1', registrationId: 'reg-a', amount: 100, status: 'completed', paymentDate: '2026-10-15', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'pay-2', registrationId: 'reg-a', amount: 100, status: 'failed', paymentDate: '2026-10-15', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'pay-3', registrationId: 'reg-b', amount: 200, status: 'refunded', paymentDate: '2026-10-15', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
  ];
  db.refunds = [{ refundId: 'ref-1', paymentId: 'pay-3', registrationId: 'reg-b', amount: 200, status: 'completed', reason: 'Cancelled', requestedAt: now, processedAt: now }];
  const service = new FinanceService();
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { db, service, userId: 'usr-emp-001c', role: UserRole.EVENT_STAFF };
}

test('dashboard counts captured payments once and subtracts completed refunds', t => {
  const { service, userId, role } = fixture(t);
  const { totals, capabilities } = service.dashboard(userId, role, { from: '2026-10-15', to: '2026-10-15' });
  assert.equal(totals.grossRevenue, 300);
  assert.equal(totals.refundedAmount, 200);
  assert.equal(totals.netRevenue, 100);
  assert.equal(totals.failedPayments, 1);
  assert.equal(totals.ticketsSold, 2);
  assert.equal(totals.platformCommission, null);
  assert.equal(capabilities.gatewayReconciliation, false);
  assert.throws(() => service.dashboard(userId, role, { from: '2026-10-16', to: '2026-10-15' }), /Start date/);
});

test('transaction filters and pagination are backend enforced', t => {
  const { service, userId, role } = fixture(t);
  const result = service.transactions(userId, role, { status: 'failed', search: 'pay-2', page: 1, pageSize: 1 });
  assert.equal(result.pagination.total, 1);
  assert.equal(result.data[0].paymentId, 'pay-2');
  assert.throws(() => service.transactions(userId, role, { pageSize: 999 }), /pagination/);
  assert.throws(() => service.transactions(userId, role, { sort: 'password' }), /sort/);
  assert.throws(() => service.transactions('usr-attendee-001', UserRole.ATTENDEE, {}), /Finance Executive/);
});

test('report CSV escapes formula cells and includes all filtered rows', t => {
  const { db, service, userId, role } = fixture(t);
  db.events[0].name = '=HYPERLINK("example")';
  const csv = service.reportCsv(userId, role, { type: 'transactions' });
  assert.match(csv, /'\=HYPERLINK/);
  assert.equal(csv.split('\r\n').length, 4);
  assert.equal(service.report(userId, role, { type: 'daily' }).rows[0].netRevenue, 100);
  const pdf = service.reportPdf(userId, role, { type: 'transactions' });
  assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4');
  assert.match(pdf.toString(), /Matching records: 3/);
});

test('finance can add an audited review note without changing refund status', t => {
  const { db, service, userId, role } = fixture(t);
  db.refunds[0].status = 'pending';
  db.payments[2].status = 'completed';
  assert.throws(() => service.reviewRefund(userId, role, 'ref-1', { note: 'short' }), /10 to 1000/);
  assert.throws(() => service.reviewRefund('usr-attendee-001', UserRole.ATTENDEE, 'ref-1', { note: 'Eligible cancellation' }), /Finance Executive/);
  const reviewed = service.reviewRefund(userId, role, 'ref-1', { note: 'Captured payment and cancellation date verified.' });
  assert.equal(reviewed.status, 'pending');
  assert.equal(reviewed.reviews.length, 1);
  assert.equal(reviewed.reviews[0].actorUserId, userId);
  db.persist(); DataStore.instance = undefined;
  assert.equal(new FinanceService().refund(userId, role, 'ref-1').reviews.length, 1);
});

test('sent finance reports keep a saved snapshot and review feedback after reload', t => {
  const { db, service, userId, role } = fixture(t);
  const sent = service.submitReport(userId, role, { title: 'Payment review', summary: 'Captured payments and refunds were reviewed.', reportType: 'transactions', filters: { from: '2026-10-15', to: '2026-10-15' } });
  assert.equal(sent.metrics.recordCount, 3);
  assert.equal(sent.rows.length, 3);
  service.reviewReport(sent.id, 'usr-admin-001', UserRole.SUPER_ADMIN, { feedback: 'Accepted after review.' });
  db.persist();
  DataStore.instance = undefined;
  const reloaded = new FinanceService().submissions(userId, role)[0];
  assert.equal(reloaded.id, sent.id);
  assert.equal(reloaded.status, 'Reviewed');
  assert.equal(reloaded.feedback, 'Accepted after review.');
  assert.equal(reloaded.rows.length, 3);
});

test('finance HTTP endpoints require a finance JWT and export real filtered data', async t => {
  fixture(t);
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  t.after(() => app.close());
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  const login = async (email, password) => (await (await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).json()).data.token;
  const finance = await login('marcus.ops@eventflow.com', 'Employee@123');
  const attendee = await login('attendee@example.com', 'Attendee@123');
  const admin = await login('superadmin@example.com', 'Admin@123');
  assert.equal((await fetch(base + '/finance/dashboard')).status, 401);
  assert.equal((await fetch(base + '/finance/dashboard', { headers: { Authorization: `Bearer ${attendee}` } })).status, 403);
  const headers = { Authorization: `Bearer ${finance}` };
  const overview = await (await fetch(base + '/finance/overview?from=2026-10-15&to=2026-10-15', { headers })).json();
  assert.equal(overview.totals.grossRevenue, 300);
  const csv = await fetch(base + '/finance/reports.csv?type=transactions&status=failed', { headers });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /pay-2/);
  const pdf = await fetch(base + '/finance/reports.pdf?type=transactions', { headers });
  assert.equal(pdf.status, 200);
  assert.equal((await pdf.arrayBuffer()).byteLength > 100, true);
  const submission = await fetch(base + '/finance/submissions', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'October reconciliation review', summary: 'Two captured payment records were checked.', reportType: 'transactions', filters: { from: '2026-10-15', to: '2026-10-15' } }) });
  assert.equal(submission.status, 201);
  const sent = await submission.json();
  assert.equal(sent.metrics.recordCount, 3);
  assert.equal((await fetch(base + '/finance/submissions', { headers: { Authorization: `Bearer ${attendee}` } })).status, 403);
  const adminRows = await (await fetch(base + '/finance/submissions', { headers: { Authorization: `Bearer ${admin}` } })).json();
  assert.equal(adminRows[0].id, sent.id);
  const review = await fetch(base + `/finance/submissions/${sent.id}/review`, { method: 'PATCH', headers: { Authorization: `Bearer ${admin}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: 'Reviewed and accepted.' }) });
  assert.equal(review.status, 200);
  const tracked = await (await fetch(base + '/finance/submissions', { headers })).json();
  assert.equal(tracked[0].status, 'Reviewed');
  assert.equal(tracked[0].feedback, 'Reviewed and accepted.');
});
