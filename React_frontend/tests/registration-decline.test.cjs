const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frontend = path.join(__dirname, '..');
const organizerSource = fs.readFileSync(path.join(frontend, 'src/apps/organizer/app/runtime.js'), 'utf8');
const attendeeSource = fs.readFileSync(path.join(frontend, 'src/apps/attendee/app/runtime.js'), 'utf8');
const event = { eventId: 'evt-review-test', organizerUserId: 'usr-org-001', organizerId: 'org-001', name: 'Workshop', date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'published', capacity: 20, ticketPrice: 0, location: 'Workshop Hall' };
const registration = { registrationId: 'reg-review-test', eventId: event.eventId, attendeeId: 'att-001', attendee: { userId: 'usr-attendee-001', name: 'Test Attendee', email: 'attendee@example.com' }, event, status: 'registered', ticketType: 'General Admission' };
const reason = 'The required <training> certificate was not attached & needs to be provided.';
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function section(source, from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Missing runtime section ${from}`);
  return source.slice(start, end);
}

function organizerHarness() {
  const storage = new Map();
  const elements = new Map([
    ['registration-decline-reason', { value: '' }],
    ['registration-decline-error', { textContent: '' }],
    ['at-q', { value: '' }], ['at-status', { value: '' }],
    ['modal-foot', { querySelector: () => button }],
  ]);
  const button = { disabled: false };
  const calls = [];
  let saves = 0;
  let closes = 0;
  let modal;
  const context = vm.createContext({
    CU: { id: 'usr-org-001', userId: 'usr-org-001', role: 'organizer' },
    DB: { users: [], events: [], registrations: [] },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, String(value)) },
    g: id => elements.get(id), v: id => elements.get(id)?.value || '', escapeHtml,
    apiGetEvents: async () => [event], apiGetAttendeeRegistrations: async () => [registration],
    apiReviewRegistration: async (...args) => { calls.push(args); return { data: { ...registration, status: 'rejected', reviewStatus: 'rejected', rejectionReason: args[2] } }; },
    openModal: (title, html) => { modal = { title, html }; }, closeModal: () => closes++, closeDrawer() {},
    saveDB: () => saves++, renderPage: async () => {}, toast() {},
  });
  vm.runInContext(section(organizerSource, '    let organizerRegistrationEvents = [];', '    function viewAttendeeProfile('), context);
  return { context, calls, elements, button, storage, get saves() { return saves; }, get closes() { return closes; }, get modal() { return modal; } };
}

test('organizer loads real registrations, selects string event IDs and requires a reason before sending a decline', async () => {
  const h = organizerHarness();
  await h.context.syncOrganizerAttendees();
  const html = h.context.pageAttendees();
  assert.match(html, /evt-review-test/);
  assert.match(html, /Test Attendee/);
  assert.match(html, /Decline/);
  assert.equal(h.storage.get('org_attendees_event'), event.eventId);
  h.context.organiserRejectAttendee(registration.registrationId);
  assert.equal(h.modal.title, 'Decline Registration');
  assert.match(h.modal.html, /attendee will see this reason/);
  for (const invalid of ['', '           ', 'Too short']) {
    h.elements.get('registration-decline-reason').value = invalid;
    await h.context.submitOrganizerRegistrationDecline(registration.registrationId);
    assert.match(h.elements.get('registration-decline-error').textContent, /10 to 1000/);
  }
  assert.equal(h.calls.length, 0);
  assert.equal(h.saves, 0);
  assert.equal(h.context.DB.registrations[0].status, 'registered');
  h.elements.get('registration-decline-reason').value = `  ${reason}  `;
  await h.context.submitOrganizerRegistrationDecline(registration.registrationId);
  assert.deepEqual(h.calls[0], [registration.registrationId, 'rejected', reason]);
  assert.equal(h.context.DB.registrations.length, 1);
  assert.equal(h.context.DB.registrations[0].rejectionReason, reason);
  assert.equal(h.saves, 1);
  const declined = h.context.buildOrganizerAttendeesTbl(h.context.DB.registrations, event, false);
  assert.match(declined, /Declined/);
  assert.match(declined, /&lt;training&gt;/);
  assert.doesNotMatch(declined, /onclick="organiserRejectAttendee/);
});

test('failed declines preserve the registration and keep the reason available for retry', async () => {
  const h = organizerHarness();
  await h.context.syncOrganizerAttendees();
  h.context.apiReviewRegistration = async () => { throw new Error('Server unavailable'); };
  h.elements.get('registration-decline-reason').value = reason;
  await h.context.submitOrganizerRegistrationDecline(registration.registrationId);
  assert.equal(h.context.DB.registrations[0].status, 'registered');
  assert.equal(h.elements.get('registration-decline-reason').value, reason);
  assert.equal(h.elements.get('registration-decline-error').textContent, 'Server unavailable');
  assert.equal(h.button.disabled, false);
  assert.equal(h.closes, 0);
  assert.equal(h.saves, 0);
});

function attendeeHarness() {
  const storage = new Map();
  const calls = [];
  let saves = 0;
  let modal;
  const serverRegistration = { ...registration, status: 'rejected', reviewStatus: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() };
  const context = vm.createContext({
    CU: { id: 'usr-attendee-001', name: 'Test Attendee' },
    DB: { events: [], registrations: [] }, attendeeEventCatalog: [],
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, String(value)) },
    escapeHtml, renderPage() {}, evStatBadge: () => 'blue',
    _currentPage: 'my-tickets', saveDB: () => saves++, toast() {},
    apiGetRegistration: async () => ({ ...serverRegistration }),
    apiMarkDeclineViewed: async id => { calls.push(id); serverRegistration.declineViewedAt = new Date().toISOString(); return { ...serverRegistration }; },
    openModal: (title, html) => { modal = { title, html }; },
    renderTicketQRCode: () => { throw new Error('Declined tickets must not render a QR'); },
  });
  context.window = context;
  vm.runInContext(section(attendeeSource, '    function normalizeAttendeeEvent(', '    function getRegisteredEventIdSet(')
    + section(attendeeSource, '    let attendeeRegistrationCatalog = [];', '    function completeDemoPayment(')
    + section(attendeeSource, '    async function openViewTicketModal(', '    window.openViewTicketModal ='), context);
  const normalized = context.normalizeAttendeeRegistration({ ...registration, status: 'rejected', reviewStatus: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString(), verificationId: 'stale-qr' });
  vm.runInContext('attendeeRegistrationCatalog = DB.registrations;', context);
  return { context, normalized, calls, get saves() { return saves; }, get modal() { return modal; } };
}

test('declined tickets stay in Upcoming until their details are viewed, then move to Other Tickets', async () => {
  const h = attendeeHarness();
  const { context, normalized } = h;
  const upcoming = context.pageMyTickets();
  assert.match(upcoming, /Upcoming Tickets \(1\)/);
  assert.match(upcoming, /Other Tickets \(0\)/);
  assert.match(upcoming, /View Details to move this ticket to Other Tickets/);
  assert.equal(h.calls.length, 0, 'Listing the ticket must not mark it viewed');
  await context.openViewTicketModal(normalized.registrationId);
  assert.equal(h.calls.length, 1);
  assert.equal(h.saves, 1);
  assert.match(h.modal.html, /Reason from organizer/);
  assert.match(h.modal.html, /&lt;training&gt; certificate was not attached &amp; needs/);
  assert.doesNotMatch(h.modal.html, /<training>/);
  assert.match(h.modal.html, /QR Disabled/);
  assert.doesNotMatch(h.modal.html, /onclick="cancelTicket|onclick="completeDemoPayment/);
  assert.match(context.pageMyTickets(), /Upcoming Tickets \(0\)/);
  context.showTicketTab('other');
  assert.match(context.pageMyTickets(), /Other Tickets \(1\)/);
  assert.match(context.pageMyTickets(), /Reason from organizer/);
  await context.openViewTicketModal(normalized.registrationId);
  assert.equal(h.calls.length, 1, 'Reopening a viewed decline must not save another view');
  const refreshed = context.normalizeAttendeeRegistration({ ...registration, status: 'rejected', rejectionReason: reason, declineViewedAt: normalized.declineViewedAt });
  assert.equal(refreshed.declineViewedAt, normalized.declineViewedAt);
  assert.equal(refreshed.rejectionReason, reason);
  assert.match(context.pageMyTickets(), /&lt;training&gt; certificate was not attached &amp; needs/);
  context.showTicketTab('upcoming');
  assert.match(context.pageMyTickets(), /Upcoming Tickets \(0\)/);
});

test('a failed view update still shows the reason and keeps the declined ticket available for retry', async () => {
  const h = attendeeHarness();
  h.context.apiMarkDeclineViewed = async () => { throw new Error('Server unavailable'); };
  await h.context.openViewTicketModal(h.normalized.registrationId);
  assert.match(h.modal.html, /Reason from organizer/);
  assert.equal(h.normalized.declineViewedAt, undefined);
  assert.equal(h.saves, 0);
  assert.match(h.context.pageMyTickets(), /Upcoming Tickets \(1\)/);
});

test('opening an old confirmed ticket fetches the latest rejection and displays its reason', async () => {
  const h = attendeeHarness();
  h.normalized.status = 'confirmed';
  h.normalized.rejectionReason = '';
  await h.context.openViewTicketModal(h.normalized.registrationId);
  assert.equal(h.normalized.status, 'rejected');
  assert.equal(h.normalized.rejectionReason, reason);
  assert.match(h.modal.html, /Reason from organizer/);
  assert.match(h.modal.html, /&lt;training&gt; certificate/);
  assert.equal(h.calls.length, 1);
});

test('organizer profiles show the event, review, reviewer name and rating', async () => {
  const source = fs.readFileSync(path.join(frontend, 'src/apps/client/app/runtime.js'), 'utf8');
  let html;
  const context = vm.createContext({
    DB: { users: [{ id: 'usr-org-001', name: 'Sarah Chen' }] },
    apiGetOrganizerProfileReviews: async () => ({ data: { totalReviews: 1, averageRating: 5, reviews: [{ eventName: 'Global AI Summit 2024', reviewerName: 'Michael Torres', rating: 5, comment: 'Clear planning & great coordination.', createdAt: '2024-06-20T00:00:00Z' }] } }),
    escapeHtml, toast() {}, openModal: (title, content) => { html = content; },
  });
  vm.runInContext(section(source, '    async function viewOrganizerProfile(', '    function contactOrganizer('), context);
  await context.viewOrganizerProfile('usr-org-001');
  assert.match(html, /Global AI Summit 2024/);
  assert.match(html, /By <strong>Michael Torres<\/strong>/);
  assert.match(html, /Clear planning &amp; great coordination\./);
  assert.match(html, /5\/5/);
});
