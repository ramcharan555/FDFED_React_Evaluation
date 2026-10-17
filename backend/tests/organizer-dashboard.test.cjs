const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { AnalyticsService } = require('../src/modules/analytics/analytics.service');
const { EventsService } = require('../src/modules/events/events.service');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-organizer-dashboard-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const now = new Date('2026-10-17T08:00:00.000Z');
  db.organizers = [{ organizerId: 'org-test', userId: 'usr-org-test', rating: 0, createdAt: now }];
  db.events = [
    { eventId: 'evt-upcoming', organizerId: 'org-test', name: 'Confirmed conference', category: 'Conference', date: '2099-11-01', time: '09:00', location: 'Hall A', capacity: 100, ticketPrice: 250, status: 'published', createdAt: now, updatedAt: now },
    { eventId: 'evt-draft', organizerId: 'org-test', name: 'Draft workshop', category: 'Workshop', date: '2099-12-01', time: '10:00', location: '', capacity: 30, ticketPrice: 100, status: 'draft', createdAt: now, updatedAt: now },
    { eventId: 'evt-other', organizerId: 'org-other', name: 'Other event', category: 'Other', date: '2099-10-01', time: '10:00', location: 'Elsewhere', capacity: 20, ticketPrice: 999, status: 'published', createdAt: now, updatedAt: now },
  ];
  db.registrations = [{ registrationId: 'reg-own', attendeeId: 'att-1', eventId: 'evt-upcoming', registrationDate: '2026-10-17', status: 'registered', ticketType: 'General', createdAt: now, updatedAt: now }];
  db.payments = [
    { paymentId: 'pay-complete', registrationId: 'reg-own', amount: 500, status: 'completed', paymentDate: '2026-10-17', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'pay-failed', registrationId: 'reg-own', amount: 900, status: 'failed', paymentDate: '2026-10-17', paymentMethod: 'DEMO_PROVIDER', createdAt: new Date(now.getTime() + 1000), updatedAt: now },
  ];
  db.refunds = [{ refundId: 'refund-complete', paymentId: 'pay-complete', registrationId: 'reg-own', amount: 125, status: 'completed', reason: 'Partial refund', requestedAt: now, processedAt: now }];
  db.eventWorkflowPayments = [{ paymentId: 'event-payment', eventId: 'evt-upcoming', requestId: 'req-confirmed', clientId: 'client-1', organizerId: 'org-test', amount: 1000, status: 'completed', paymentDate: '2026-10-17', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now }];
  db.eventRequests = [
    { requestId: 'req-action', clientId: 'client-1', organizerId: 'org-test', eventName: 'Action request', eventDate: '2099-12-01', budget: 1000, capacity: 20, requirements: '', status: 'submitted', agreementStatus: 'not_sent', paymentStatus: 'unpaid', createdAt: now, updatedAt: now },
    { requestId: 'req-confirmed', clientId: 'client-1', organizerId: 'org-test', eventId: 'evt-upcoming', eventName: 'Confirmed conference', eventDate: '2099-11-01', budget: 2000, capacity: 100, requirements: '', status: 'confirmed', agreementStatus: 'agreed', paymentStatus: 'fully_paid', createdAt: now, updatedAt: now },
  ];
  db.supportTickets = [{ ticketId: 'ticket-open', userId: 'usr-org-test', requestType: 'Event Related Issues', concern: 'Venue access', description: 'Door access is unresolved', attachments: [], status: 'open', createdAt: now, updatedAt: now }];
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return new AnalyticsService();
}

test('organizer dashboard uses scoped records, excludes failed payments, and subtracts completed refunds', t => {
  const result = fixture(t).getOrganizerDashboard(UserRole.EVENT_ORGANIZER, 'usr-org-test').data;
  assert.equal(result.totalEvents, 2);
  assert.equal(result.grossRevenue, 1500);
  assert.equal(result.refundedAmount, 125);
  assert.equal(result.totalRevenue, 1375);
  assert.equal(result.pendingRequests, 1);
  assert.deepEqual(result.eventStatusCounts, { upcoming: 1, inProgress: 0, completed: 0, cancelled: 0, needsAttention: 1 });
  assert.deepEqual(result.upcomingSchedule.map(item => item.eventId), ['evt-upcoming']);
  assert.ok(result.attentionEventIds.includes('evt-draft'));
  assert.ok(result.priorityActions.some(item => item.id === 'req-action' && item.type === 'request'));
  assert.ok(result.priorityActions.some(item => item.id === 'ticket-open' && item.type === 'issue'));
  assert.ok(result.financialRecords.every(item => item.id !== 'pay-failed'));
});

test('organizer dashboard enforces role and authenticated organizer ownership', t => {
  const service = fixture(t);
  assert.throws(() => service.getOrganizerDashboard(UserRole.CLIENT, 'usr-org-test'), /Access denied/);
  assert.equal(service.getOrganizerDashboard(UserRole.EVENT_ORGANIZER, 'missing-user').success, false);
});

test('development seed provides the complete, internally consistent organizer dashboard dataset', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-organizer-seed-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  const previousMode = process.env.NODE_ENV;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  process.env.NODE_ENV = 'development';
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const events = db.events.filter(event => event.demoScenario === 'organizer-dashboard-v3');
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(events.length, 15);
  assert.equal(events.filter(event => event.status === 'published' && event.date > today).length, 5);
  assert.equal(events.filter(event => event.status === 'ongoing' && event.date === today).length, 4);
  assert.equal(events.filter(event => event.status === 'completed' && event.date < today).length, 5);
  assert.equal(events.filter(event => event.status === 'cancelled').length, 1);
  assert.ok(events.find(event => event.status === 'cancelled')?.cancellationReason);
  assert.ok(events.every(event => Number(event.demoRegistrationCount || 0) <= event.capacity));
  const dashboard = new AnalyticsService().getOrganizerDashboard(UserRole.EVENT_ORGANIZER, 'usr-org-001').data;
  assert.equal(dashboard.totalEvents, 15);
  assert.equal(db.events.filter(event => event.organizerId === 'org-001').length, dashboard.totalEvents);
  assert.equal(dashboard.pendingRequests, 8);
  assert.equal(dashboard.totalRevenue, 10100);
  assert.equal(dashboard.eventsNeedingAttention, 3);
  assert.deepEqual(dashboard.eventStatusCounts, { upcoming: 5, inProgress: 4, completed: 5, cancelled: 1, needsAttention: 3 });
  assert.equal(dashboard.upcomingSchedule.length, 3);
  const listedEvents = new EventsService().findAll(UserRole.EVENT_ORGANIZER, undefined, undefined, 'usr-org-001');
  assert.equal(listedEvents.length, 15);
  assert.equal(listedEvents.filter(event => event.status === 'published').length, 5);
  assert.equal(listedEvents.filter(event => event.status === 'ongoing').length, 4);
  assert.equal(listedEvents.filter(event => event.status === 'completed').length, 5);
  assert.equal(listedEvents.filter(event => event.status === 'cancelled').length, 1);
  assert.equal(listedEvents.filter(event => event.needsAttention).length, 3);
  assert.ok(dashboard.priorityActions.some(item => item.type === 'request'));
  assert.ok(dashboard.priorityActions.some(item => item.type === 'preparation'));
  assert.ok(dashboard.priorityActions.some(item => item.type === 'issue'));
  assert.ok(dashboard.upcomingSchedule.every(item => item.status === 'published' && item.date > today));
  t.after(() => {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
