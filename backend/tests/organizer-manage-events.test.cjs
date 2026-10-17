const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { EventsService } = require('../src/modules/events/events.service');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-manage-events-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const now = new Date('2026-10-17T08:00:00Z');
  db.organizers = [
    { organizerId: 'org-own', userId: 'usr-own', rating: 0, createdAt: now },
    { organizerId: 'org-other', userId: 'usr-other', rating: 0, createdAt: now },
  ];
  db.events = [
    { eventId: 'evt-own', organizerId: 'org-own', name: 'Owned summit', category: 'Technology', date: '2099-11-20', time: '10:00', location: 'Hall A', capacity: 20, ticketPrice: 125, status: 'published',
      preparationTasks: [{ taskId: 'prep-1', title: 'Confirm AV', deadline: '2020-01-01', status: 'pending', updatedAt: now }], createdAt: now, updatedAt: now },
    { eventId: 'evt-past', organizerId: 'org-own', name: 'Past workshop', category: 'Workshop', date: '2020-01-01', time: '10:00', location: 'Hall B', capacity: 10, ticketPrice: 0, status: 'ongoing', createdAt: now, updatedAt: now },
    { eventId: 'evt-other', organizerId: 'org-other', name: 'Other event', category: 'Other', date: '2099-11-20', time: '10:00', location: 'Hall C', capacity: 30, ticketPrice: 500, status: 'published', createdAt: now, updatedAt: now },
  ];
  db.registrations = [
    { registrationId: 'reg-confirmed', attendeeId: 'att-1', eventId: 'evt-own', registrationDate: '2026-10-17', status: 'registered', ticketType: 'General', qrCode: 'qr', verificationId: 'verify', createdAt: now, updatedAt: now },
    { registrationId: 'reg-wait', attendeeId: 'att-2', eventId: 'evt-own', registrationDate: '2026-10-17', status: 'waitlisted', ticketType: 'General', createdAt: now, updatedAt: now },
  ];
  db.payments = [{ paymentId: 'pay-1', registrationId: 'reg-confirmed', amount: 125, status: 'completed', paymentDate: '2026-10-17', paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now }];
  db.refunds = []; db.eventChanges = []; db.supportTickets = [];
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { db, service: new EventsService() };
}

test('organizer event listing is ownership-scoped and returns real management summaries', t => {
  const { service } = fixture(t);
  const events = service.findAll(UserRole.EVENT_ORGANIZER, undefined, undefined, 'usr-own');
  assert.deepEqual(events.map(event => event.eventId).sort(), ['evt-own', 'evt-past']);
  const event = events.find(item => item.eventId === 'evt-own');
  assert.equal(event.registered, 1);
  assert.equal(event.remainingCapacity, 19);
  assert.equal(event.registrationSummary.confirmed, 1);
  assert.equal(event.registrationSummary.waitlisted, 1);
  assert.equal(event.registrationSummary.payments.successful, 1);
  assert.equal(event.needsAttention, true);
});

test('organizer updates enforce ownership, conflicts, transitions and completion timing', t => {
  const { service } = fixture(t);
  assert.throws(() => service.update('evt-other', { location: 'No access' }, UserRole.EVENT_ORGANIZER, 'usr-own'), /own events/);
  assert.throws(() => service.create({ name: 'Conflict', category: 'Technology', date: '2099-11-20', time: '10:00', location: 'Hall D', capacity: 5, ticketPrice: 0, status: 'published' }, UserRole.EVENT_ORGANIZER, 'usr-own'), /already scheduled/);
  assert.throws(() => service.update('evt-own', { status: 'completed' }, UserRole.EVENT_ORGANIZER, 'usr-own'), /future event/);
  const completed = service.update('evt-past', { status: 'completed' }, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.equal(completed.status, 'completed');
  assert.throws(() => service.update('evt-past', { status: 'published' }, UserRole.EVENT_ORGANIZER, 'usr-own'), /Cannot change/);
});

test('authorized draft create, edit and delete stay synchronized with the organizer listing', t => {
  const { service } = fixture(t);
  const created = service.create({ name: 'New organizer event', category: 'Conference', date: '2099-12-15', time: '09:30', location: 'Hall D', capacity: 50, ticketPrice: 250, status: 'draft' }, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.ok(service.findAll(UserRole.EVENT_ORGANIZER, 'new organizer', 'draft', 'usr-own').some(event => event.eventId === created.eventId));
  const edited = service.update(created.eventId, { name: 'Updated organizer event', capacity: 60 }, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.equal(edited.capacity, 60);
  assert.ok(edited.changes.some(change => change.type === 'details_updated'));
  service.delete(created.eventId, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.equal(service.findAll(UserRole.EVENT_ORGANIZER, undefined, undefined, 'usr-own').some(event => event.eventId === created.eventId), false);
});

test('preparation and cancellation persist history, ticket invalidation and refund workflow', t => {
  const { db, service } = fixture(t);
  const prepared = service.update('evt-own', { preparationTasks: [{ title: 'Confirm catering', deadline: '2099-11-01', status: 'in_progress' }] }, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.equal(prepared.preparationSummary.total, 1);
  assert.ok(prepared.changes.some(change => change.type === 'preparation_updated'));
  assert.throws(() => service.update('evt-own', { status: 'cancelled', changeReason: 'short' }, UserRole.EVENT_ORGANIZER, 'usr-own'), /at least 10/);
  const cancelled = service.update('evt-own', { status: 'cancelled', changeReason: 'Venue access was withdrawn' }, UserRole.EVENT_ORGANIZER, 'usr-own');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(db.registrations.find(item => item.registrationId === 'reg-confirmed').status, 'cancelled');
  assert.equal(db.registrations.find(item => item.registrationId === 'reg-confirmed').qrCode, undefined);
  assert.equal(db.refunds[0].status, 'pending');
  assert.ok(cancelled.changes.some(change => change.type === 'cancelled'));
});
