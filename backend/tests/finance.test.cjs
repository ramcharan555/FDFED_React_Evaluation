require('reflect-metadata');
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { DataStore } = require('../src/common/data-store');
const { FinanceService, minor } = require('../src/modules/finance/finance.service');
const { FinanceController } = require('../src/modules/finance/finance.controller');
const { csv, pdf } = require('../src/modules/finance/finance.exports');
const { verifyPassword } = require('../src/common/utils/password');
let db, service;
beforeEach(() => {
  let sequence = 0;
  db = {
    users: [
      { userId: 'admin', name: 'Super Admin', userRole: 'super_admin', status: 'active' },
      { userId: 'finance', userRole: 'event_staff', employeeType: 'FINANCE_EXECUTIVE', status: 'active', name: 'Finance', email: 'finance@test.invalid', password: 'Current@123' },
      { userId: 'attendee', userRole: 'attendee', status: 'active', name: 'Attendee' },
      { userId: 'ops', userRole: 'event_staff', employeeType: 'EVENT_OPERATIONS', status: 'active' },
    ],
    events: [{ eventId: 'event', organizerId: 'org', name: 'Fixture', status: 'cancelled', cancellationDeadline: '2026-10-31' }],
    organizers: [{ organizerId: 'org', userId: 'admin' }], attendees: [{ attendeeId: 'att', userId: 'attendee' }],
    registrations: [{ registrationId: 'booking', eventId: 'event', attendeeId: 'att', status: 'cancelled' }, { registrationId: 'booking2', eventId: 'event', attendeeId: 'att', status: 'registered' }],
    payments: [
      { paymentId: 'payment', registrationId: 'booking', amount: 123.45, status: 'completed', paymentMethod: 'DEMO_PROVIDER', paymentDate: '2026-10-10', createdAt: new Date('2026-10-10') },
      { paymentId: 'failed', registrationId: 'booking2', amount: 99, status: 'failed', paymentMethod: 'DEMO_PROVIDER', paymentDate: '2026-10-11', createdAt: new Date('2026-10-11') },
    ],
    refunds: [], financeSettlements: [], commissionPolicies: [], financeAudit: [], financeGrants: [], financeReportSubmissions: [], notifications: [],
    generateId: prefix => `${prefix}-${++sequence}`, persist() {}, findUserByEmail(email) { return this.users.find(u => u.email === email); },
  };
  DataStore.getInstance = () => db;
  service = new FinanceService();
});
test('gross uses stored successful values, excludes failures, and deduplicates booking attempts', () => {
  db.payments.push({ ...db.payments[0], paymentId: 'duplicate' });
  const dashboard = service.dashboard({ from: '2026-10-01', to: '2026-10-31' });
  assert.equal(dashboard.summary.gross, 12345);
  assert.equal(dashboard.summary.tickets, 1);
  assert.equal(dashboard.summary.failed, 1);
  assert.equal(dashboard.summary.commission, null);
  assert.equal(service.dashboard({ from: '2026-11-01' }).summary.gross, 0);
});
test('filters combine search, event, method, status, sort and backend pagination', () => {
  const result = service.transactions({ search: 'Attendee', eventId: 'event', method: 'DEMO_PROVIDER', status: 'completed', pageSize: '1', sort: 'amount_desc' });
  assert.equal(result.total, 1); assert.equal(result.records[0].id, 'payment');
  assert.equal(service.transactions({ page: '2', pageSize: '1' }).records.length, 1);
  assert.throws(() => service.transactions({ page: '-1' }));
  assert.throws(() => service.transactions({ from: '2026-99-20' }));
  assert.throws(() => service.transactions({ from: '2026-10-31', to: '2026-10-01' }));
  assert.throws(() => service.transactions({ status: 'captured' }));
});
test('persisted department and explicit permissions are required', () => {
  assert.throws(() => service.actor('attendee'));
  assert.throws(() => service.actor('ops'));
  assert.throws(() => service.actor('finance', 'refund.approve'));
  service.grant('admin', { userId: 'finance', permission: 'refund.approve', enabled: true });
  assert.equal(service.actor('finance', 'refund.approve').userId, 'finance');
  assert.throws(() => service.grant('finance', { userId: 'finance', permission: 'settlement.approve', enabled: true }));
});
test('refund approval does not mark completed and duplicate approval is rejected', () => {
  db.refunds.push({ refundId: 'refund', paymentId: 'payment', registrationId: 'booking', amount: 123.45, status: 'pending', reason: 'Cancelled', requestedAt: new Date('2026-10-12') });
  service.reviewRefund('refund', 'finance', { action: 'review' });
  assert.throws(() => service.reviewRefund('refund', 'finance', { action: 'approve' }));
  service.reviewRefund('refund', 'admin', { action: 'approve' });
  assert.equal(db.refunds[0].status, 'approved'); assert.equal(db.payments[0].status, 'completed');
  assert.throws(() => service.reviewRefund('refund', 'admin', { action: 'approve' }));
  assert.equal(db.financeAudit.length, 2);
});
test('refund limits, policy, and rejection reasons are enforced', () => {
  db.refunds.push({ refundId: 'refund', paymentId: 'payment', registrationId: 'booking', amount: 124, status: 'pending', reason: 'Cancelled', requestedAt: new Date('2026-10-12') });
  assert.throws(() => service.reviewRefund('refund', 'admin', { action: 'approve' }));
  assert.throws(() => service.reviewRefund('refund', 'admin', { action: 'reject', reason: '' }));
  db.refunds[0].amount = 100; db.events[0].status = 'published'; db.events[0].cancellationDeadline = '2026-10-01';
  assert.throws(() => service.reviewRefund('refund', 'admin', { action: 'approve' }));
  service.reviewRefund('refund', 'admin', { action: 'reject', reason: 'Outside policy' });
  assert.equal(db.financeAudit[0].metadata.reason, 'Outside policy');
});
test('settlement requires policy, uses integer commission, freezes lines and prevents duplicate allocation', () => {
  const input = { eventId: 'event', from: '2026-10-01', to: '2026-10-31' };
  assert.throws(() => service.createSettlement('finance', input));
  service.addPolicy('admin', { basisPoints: 250, effectiveDate: '2026-01-01' });
  const settlement = service.createSettlement('finance', input);
  assert.equal(settlement.commission, 309); assert.equal(settlement.amount, 12036);
  assert.throws(() => service.createSettlement('finance', input));
  assert.throws(() => service.settlementAction(settlement.id, 'finance', { action: 'approve' }));
  service.settlementAction(settlement.id, 'admin', { action: 'approve' });
  assert.equal(settlement.status, 'approved');
  assert.throws(() => service.settlementAction(settlement.id, 'admin', { action: 'record_external', reference: 'bank-ref' }));
  service.addPolicy('admin', { basisPoints: 1000, effectiveDate: '2026-01-02' });
  assert.equal(service.revenue({})[0].commission, 309);
});
test('refund completion adjusts net revenue separately by processed date', () => {
  db.refunds.push({ refundId: 'ref', paymentId: 'payment', registrationId: 'booking', amount: 23.45, status: 'completed', requestedAt: new Date('2026-09-30'), processedAt: new Date('2026-10-12') });
  const result = service.dashboard({ from: '2026-10-01', to: '2026-10-31' });
  assert.equal(result.summary.refunded, 2345); assert.equal(result.summary.net, 10000);
  assert.equal(result.trends.find(r => r.label === '2026-10-12').completed, 2345);
});
test('CSV escapes formulas and exports all filtered rows; PDF has page tree and totals metadata', () => {
  assert.match(csv([{ name: '=HYPERLINK("bad")', amount: 100 }]), /'=/);
  const report = service.report({ type: 'transactions', pageSize: '1' });
  assert.equal(report.records.length, 1); assert.equal(report.allRecords.length, 2);
  const document = pdf('Revenue', ['Totals: 12345'], report.allRecords).toString();
  assert.match(document, /^%PDF-1.4/); assert.match(document, /Totals: 12345/); assert.match(document, /startxref/);
});
test('failed persistence rolls finance mutations back', () => {
  const controller = new FinanceController(service);
  db.persist = () => { throw new Error('disk failure'); };
  assert.throws(() => controller.policy({ user: { userId: 'admin' } }, { basisPoints: 100, effectiveDate: '2026-01-01' }));
  assert.equal(db.commissionPolicies.length, 0); assert.equal(db.financeAudit.length, 0);
});
const submission = (extra = {}) => ({ title: 'October transaction report', notes: 'Please review.', filters: { type: 'transactions', from: '2026-10-01', to: '2026-10-31' }, idempotencyKey: 'finance-submission-test-001', ...extra });
test('sending a report stores all filtered rows, notifies Super Admin, and is idempotent', () => {
  const sent = service.submitReport('finance', submission({ filters: { type: 'transactions', pageSize: '1' } }));
  assert.equal(sent.status, 'submitted'); assert.equal(sent.totals.recordCount, 2);
  assert.equal(db.financeReportSubmissions[0].snapshot.records.length, 2);
  assert.equal(db.notifications.length, 1); assert.equal(db.notifications[0].userId, 'admin');
  assert.equal(db.notifications[0].type, 'finance_report_submitted');
  assert.equal(service.submitReport('finance', submission({ filters: { type: 'transactions', pageSize: '1' } })).id, sent.id);
  assert.equal(db.financeReportSubmissions.length, 1); assert.equal(db.notifications.length, 1);
  assert.throws(() => service.submitReport('finance', submission({ title: 'Changed title' })), /Submission key/);
  const original = service.submittedReport('admin', sent.id);
  db.payments[0].amount = 999;
  assert.equal(service.submittedReport('admin', sent.id).snapshot.records.find(r => r.id === 'payment').amount, 12345);
  original.snapshot.records[0].amount = -1;
  assert.ok(service.submittedReport('admin', sent.id).snapshot.records.every(r => r.amount > 0));
});
test('report ownership, admin-only review and sender feedback are enforced', () => {
  const sent = service.submitReport('finance', submission());
  db.users.push({ userId: 'other-finance', name: 'Other Finance', userRole: 'event_staff', employeeType: 'FINANCE_EXECUTIVE', status: 'active' });
  assert.equal(service.submittedReports('other-finance', {}).total, 0);
  assert.throws(() => service.submittedReport('other-finance', sent.id));
  assert.throws(() => service.submittedReports('attendee', {}));
  assert.throws(() => service.reviewSubmittedReport('finance', sent.id, { notes: 'Self review' }));
  service.reviewSubmittedReport('admin', sent.id, { notes: 'Reviewed and accepted.' });
  const received = service.submittedReport('finance', sent.id);
  assert.equal(received.status, 'reviewed'); assert.equal(received.reviewNotes, 'Reviewed and accepted.');
  assert.equal(received.reviewedBy, 'admin');
  assert.equal(service.submittedReports('admin', { status: 'reviewed' }).total, 1);
  assert.equal(db.notifications[1].userId, 'finance');
  assert.throws(() => service.reviewSubmittedReport('admin', sent.id, { notes: 'Again' }));
  assert.equal(db.notifications.length, 2);
});
test('invalid, unsupported, and failed-to-persist submissions never appear delivered', () => {
  assert.throws(() => service.submitReport('finance', submission({ title: '' })));
  assert.throws(() => service.submitReport('finance', submission({ filters: { type: 'reconciliation' } })));
  assert.throws(() => service.submitReport('ops', submission()));
  const controller = new FinanceController(service);
  db.persist = () => { throw new Error('disk failure'); };
  assert.throws(() => controller.submitReport({ user: { userId: 'finance' } }, submission()), /disk failure/);
  assert.equal(db.financeReportSubmissions.length, 0); assert.equal(db.notifications.length, 0); assert.equal(db.financeAudit.length, 0);
  db.users[0].status = 'inactive';
  assert.throws(() => service.submitReport('finance', submission()), /No active Super Admin/);
});
test('finance collections survive the existing atomic snapshot and restore', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-finance-test-'));
  const file = path.join(directory, 'store.json'), previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = file;
  try {
    service.addPolicy('admin', { basisPoints: 250, effectiveDate: '2026-01-01' });
    service.createSettlement('finance', { eventId: 'event', from: '2026-10-01', to: '2026-10-31' });
    service.submitReport('finance', submission());
    Object.setPrototypeOf(db, DataStore.prototype);
    DataStore.prototype.persist.call(db);
    const restored = Object.create(DataStore.prototype);
    Object.assign(restored, { events: [], registrations: [], payments: [], refunds: [], attendance: [], notifications: [], activityLogs: [] });
    DataStore.prototype.restoreFromDisk.call(restored);
    assert.equal(restored.financeSettlements[0].amount, 12036);
    assert.equal(restored.commissionPolicies[0].basisPoints, 250);
    assert.equal(restored.financeAudit.length, 3);
    assert.equal(restored.financeReportSubmissions[0].snapshot.records.length, 2);
    assert.equal(restored.financeReportSubmissions[0].status, 'submitted');
    assert.equal(restored.payments.length, 2);
  } finally {
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    if (fs.existsSync(`${file}.tmp`)) fs.unlinkSync(`${file}.tmp`);
    fs.rmdirSync(directory);
  }
});
test('account preferences persist, current password is required, and changed passwords are hashed', () => {
  service.updateAccount('finance', { name: 'Updated', email: 'finance@test.invalid', phoneNo: '9876543210', bio: 'Finance', preferences: { emailNotifications: false, smsReminders: true, eventRecommendations: false } });
  assert.equal(service.account('finance').preferences.smsReminders, true);
  assert.throws(() => service.password('finance', { currentPassword: 'wrong', newPassword: 'Updated@123' }));
  service.password('finance', { currentPassword: 'Current@123', newPassword: 'Updated@123' });
  assert.ok(db.users[1].password.startsWith('scrypt$')); assert.ok(verifyPassword('Updated@123', db.users[1].password));
  assert.equal(verifyPassword('updated@123', db.users[1].password), false);
  assert.throws(() => minor(1.234));
});
test('HTTP endpoints validate JWT, persisted roles and mutation permissions', async () => {
  const { Module } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  const { AuthModule } = require('../src/modules/auth/auth.module');
  const { FinanceModule } = require('../src/modules/finance/finance.module');
  const { jwtConfig } = require('../src/config/jwt.config');
  const jwt = require('jsonwebtoken');
  db.users.forEach(u => { u.email ||= `${u.userId}@test.invalid`; });
  class TestApp {}
  const { ThrottlerModule } = require('@nestjs/throttler');
  Module({ imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), AuthModule, FinanceModule] })(TestApp);
  const app = await NestFactory.create(TestApp, { logger: ['error'], abortOnError: false });
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const token = id => jwt.sign({ userId: id, email: db.users.find(u => u.userId === id).email }, jwtConfig.secret, { expiresIn: '1m' });
    assert.equal((await fetch(`${base}/api/finance/dashboard`)).status, 401);
    assert.equal((await fetch(`${base}/api/finance/dashboard`, { headers: { Authorization: `Bearer ${token('attendee')}`, 'x-role': 'super_admin' } })).status, 403);
    const response = await fetch(`${base}/api/finance/dashboard`, { headers: { Authorization: `Bearer ${token('finance')}` } });
    assert.equal(response.status, 200); assert.equal((await response.json()).summary.gross, 12345);
    const rejected = await fetch(`${base}/api/finance/commission-policies`, { method: 'POST', headers: { Authorization: `Bearer ${token('finance')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ basisPoints: 100, effectiveDate: '2026-01-01' }) });
    assert.equal(rejected.status, 403);
    assert.equal((await fetch(`${base}/api/finance/transactions?page=-1`, { headers: { Authorization: `Bearer ${token('finance')}` } })).status, 400);
    const headers = id => ({ Authorization: `Bearer ${token(id)}`, 'Content-Type': 'application/json' });
    const sent = await fetch(`${base}/api/finance/submitted-reports`, { method: 'POST', headers: headers('finance'), body: JSON.stringify(submission()) });
    assert.equal(sent.status, 201); const report = await sent.json();
    const inbox = await fetch(`${base}/api/finance/submitted-reports`, { headers: headers('admin') });
    assert.equal(inbox.status, 200); assert.equal((await inbox.json()).records[0].id, report.id);
    const download = await fetch(`${base}/api/finance/submitted-reports/${report.id}/export?format=csv`, { headers: headers('admin') });
    assert.equal(download.status, 200); assert.match(await download.text(), /12345/);
    assert.equal((await fetch(`${base}/api/finance/submitted-reports/${report.id}/review`, { method: 'POST', headers: headers('finance'), body: JSON.stringify({ notes: 'Self review' }) })).status, 403);
    assert.equal((await fetch(`${base}/api/finance/submitted-reports/${report.id}/review`, { method: 'POST', headers: headers('admin'), body: JSON.stringify({ notes: 'Checked.' }) })).status, 201);
    const feedback = await fetch(`${base}/api/finance/submitted-reports/${report.id}`, { headers: headers('finance') });
    assert.equal((await feedback.json()).reviewNotes, 'Checked.');
  } finally { await app.close(); }
});
