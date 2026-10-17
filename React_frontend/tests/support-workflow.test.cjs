const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/shared/api/support.js'), 'utf8');
function node(extra = {}) {
  return { listeners: {}, dataset: {}, disabled: false, textContent: '', value: '',
    classList: { add() {} }, addEventListener(type, handler) { this.listeners[type] = handler; },
    async click() { return this.listeners.click?.({ currentTarget: this, target: this }); },
    focus() { this.focused = true; }, ...extra };
}
function harness() {
  const server = { tickets: [{ ticketId: 'SUP-2026-00001', concern: 'Profile details not saving', requestType: 'Account Related Problems', description: 'My phone <b>cannot</b> be saved.', requesterName: 'Michael Torres', requesterEmail: 'client@example.com', status: 'open', response: 'A previous reply.', messages: [], createdAt: '2026-10-17T09:00:00Z', updatedAt: '2026-10-17T09:00:00Z' }], calls: [], failPatch: false };
  let selectedId, markup = '', modalMarkup = '', views = [], renderedTickets = [];
  const fields = {};
  const modal = node({ hidden: true, querySelectorAll: () => [] });
  const modalContent = node({ querySelector(selector) {
    if (selector.startsWith('[data-support-response=')) return fields.reply;
    return ({ '[data-support-status-select]': fields.status, '[data-status-feedback]': fields.feedback })[selector] || null;
  }, querySelectorAll(selector) { return selector === '[data-support-status-update]' ? [fields.update] : []; } });
  Object.defineProperty(modalContent, 'innerHTML', { get: () => modalMarkup, set(value) {
    modalMarkup = value; fields.reply = node(); fields.status = node({ value: renderedTickets.find(ticket => ticket.ticketId === selectedId)?.status || 'open' });
    fields.feedback = node(); fields.update = node();
  } });
  const refresh = node(), operations = node();
  const container = node({ querySelector(selector) {
    if (selector === '.support-history') return { dataset: { supportTickets: JSON.stringify(renderedTickets) } };
    return ({ '#support-ticket-modal': modal, '#support-modal-content': modalContent, '[data-support-refresh]': refresh, '[data-support-operations]': operations, '[data-status-feedback]': fields.feedback })[selector] || null;
  }, querySelectorAll(selector) { return selector === '[data-ticket-view]' ? views : []; } });
  Object.defineProperty(container, 'innerHTML', { get: () => markup, set(value) {
    markup = value;
    const encoded = value.match(/data-support-tickets="([^"]*)"/)?.[1] || '[]';
    renderedTickets = JSON.parse(encoded.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    views = renderedTickets.map(ticket => node({ dataset: { ticketView: ticket.ticketId }, async click() { selectedId = ticket.ticketId; return this.listeners.click?.({ currentTarget: this }); } }));
  } });
  const context = vm.createContext({ window: {}, FormData, console,
    fetch: async (url, options = {}) => {
      server.calls.push({ url, options });
      assert.equal(options.headers.Authorization, 'Bearer support-token');
      if (options.method === 'PATCH') {
        if (server.failPatch) return { ok: false, status: 503, headers: { get: () => 'application/json' }, json: async () => ({ message: 'Update failed. Please try again.' }) };
        const body = JSON.parse(options.body), ticket = server.tickets[0];
        ticket.status = body.status; ticket.response = body.response;
        ticket.messages.push({ sender: 'support', senderName: 'Marcus Vance', message: body.response, createdAt: '2026-10-17T10:00:00Z' });
        return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ...ticket, emailNotificationSent: false }) };
      }
      return { ok: true, headers: { get: () => 'application/json' }, json: async () => structuredClone(server.tickets) };
    },
  });
  vm.runInContext(source, context);
  const support = context.window.EventFlowSupport;
  const user = { id: 'usr-emp-001', role: 'staff', employeeType: 'EVENT_OPERATIONS', token: 'support-token' };
  return { context, support, server, user, container, modal, modalContent, fields, refresh, operations };
}

test('the support queue recognizes current and legacy support executives while excluding finance and ordinary users', async () => {
  const h = harness();
  for (const employeeType of ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS']) {
    assert.equal(h.support.canManageSupport({ role: 'staff', employeeType }), true);
  }
  for (const user of [{ role: 'staff', employeeType: 'FINANCE_EXECUTIVE' }, { role: 'staff', employeeType: 'SUPPORT_FINANCE' }, { role: 'client' }, { role: 'attendee' }, { role: 'staff' }]) assert.equal(h.support.canManageSupport(user), false);
  const html = await h.support.render(h.user);
  assert.match(html, /Support &amp; Issue Management/);
  assert.match(html, /Received Support Requests/);
  assert.match(html, /Michael Torres/);
  assert.match(html, /client@example.com/);
  assert.match(html, /Review &amp; Respond/);
  assert.match(html, /Open: 1/);
  assert.match(html, /Refresh Requests/);
});

test('support agents send a reply and status together, preserve failed drafts, and refresh the saved conversation', async () => {
  const h = harness();
  const options = { management: true, queueTitle: 'Customer Requests' };
  h.container.innerHTML = await h.support.render(h.user, 'Back', options);
  h.support.bind(h.container, h.user, () => {}, 'Back', options);
  await h.container.querySelectorAll('[data-ticket-view]')[0].click();
  assert.equal(h.modal.hidden, false);
  assert.match(h.modalContent.innerHTML, /Requested by/);
  assert.match(h.modalContent.innerHTML, /My phone &lt;b&gt;cannot&lt;\/b&gt; be saved/);
  assert.equal(h.fields.reply.value, '', 'A previous reply is history, not a new draft');
  h.fields.status.value = 'resolved';
  await h.fields.update.click();
  assert.match(h.fields.feedback.textContent, /Add a reply before resolving/);
  assert.equal(h.server.calls.filter(call => call.options.method === 'PATCH').length, 0);
  h.fields.reply.value = '  Your issue has been resolved. Please try saving again.  ';
  h.server.failPatch = true;
  await h.fields.update.click();
  assert.match(h.fields.feedback.textContent, /Update failed/);
  assert.equal(h.fields.update.disabled, false);
  assert.equal(h.fields.reply.value, '  Your issue has been resolved. Please try saving again.  ');
  h.server.failPatch = false;
  await h.fields.update.click();
  const call = h.server.calls.filter(call => call.options.method === 'PATCH').at(-1);
  assert.match(call.url, /SUP-2026-00001\/status$/);
  assert.deepEqual(JSON.parse(call.options.body), { status: 'resolved', response: 'Your issue has been resolved. Please try saving again.' });
  assert.match(h.modalContent.innerHTML, /Your issue has been resolved. Please try saving again/);
  assert.match(h.fields.feedback.textContent, /Reply sent to the requester/);
  assert.equal(h.fields.status.value, 'resolved');
  assert.match(h.container.innerHTML, /Resolved: 1/);
  assert.match(h.container.innerHTML, /Customer Requests/);
  assert.doesNotMatch(h.container.innerHTML, /data-support-operations/);
  h.server.tickets.push({ ...h.server.tickets[0], ticketId: 'SUP-2026-00002', status: 'open' });
  await h.refresh.click();
  assert.match(h.container.innerHTML, /Open: 1/);
  assert.equal(h.container.querySelectorAll('[data-ticket-view]').length, 2);
});

function eventRequestHarness() {
  const h = harness();
  const runtime = fs.readFileSync(path.join(__dirname, '../src/apps/support-executive/app/runtime.js'), 'utf8');
  const start = runtime.indexOf('    function supportExecutiveEventRequests(');
  const end = runtime.indexOf('    // ─── PAGE 4:', start);
  assert.ok(start >= 0 && end > start);
  const event = { id: 'event-1', title: 'Customer conference' };
  const request = { id: 'EOR-1', eventId: event.id, userId: 'client-1', issue: 'Please correct the <venue>.', status: 'Pending', priority: 'High', date: '2026-10-16', notes: 'Internal staff note', response: 'We are checking the venue.' };
  const task = { id: 'EOP-1', eventId: event.id, type: 'Venue review', description: 'Check room capacity.', status: 'In Progress', priority: 'Low' };
  const db = { users: [{ id: 'client-1', name: 'Customer One', email: 'customer@example.com' }], events: [event], eventOpsRequests: [request], eventOperationsTasks: [task, { ...request }] };
  let persisted;
  Object.assign(h.context, { DB: db, CU: { ...h.user, name: 'Support Agent' }, isSupportExecutive: () => true, saveDB: () => { persisted = structuredClone(db); } });
  vm.runInContext(runtime.slice(start, end), h.context);
  const options = h.context.supportExecutiveRequestOptions();
  return { ...h, db, request, task, options, get persisted() { return persisted; } };
}

test('customer requests combine server tickets and event issues without priority or a second event queue', async () => {
  const h = eventRequestHarness();
  h.container.innerHTML = await h.support.render(h.user, 'Back', h.options);
  const html = h.container.innerHTML;
  assert.match(html, /Customer Requests/);
  assert.match(html, /Customer conference/);
  assert.match(html, /Customer One/);
  assert.match(html, /customer@example.com/);
  assert.match(html, /Venue review/);
  assert.match(html, /Open: 2/);
  assert.match(html, /In progress: 1/);
  assert.doesNotMatch(html, /priority|data-support-operations|Internal staff note/i);
  assert.deepEqual(h.container.querySelectorAll('[data-ticket-view]').map(button => button.dataset.ticketView), ['SUP-2026-00001', 'EOR-1', 'EOP-1']);
  // A server record takes precedence if a legacy copy uses the same ID.
  h.server.tickets.push({ ...h.server.tickets[0], ticketId: 'EOR-1', concern: 'Server copy' });
  const merged = await h.support.render(h.user, 'Back', h.options);
  assert.equal((merged.match(/data-ticket-view="EOR-1"/g) || []).length, 1);
  assert.match(merged, /Server copy/);
});

test('event issue replies and statuses persist and refresh inside Customer Requests', async () => {
  const h = eventRequestHarness();
  h.container.innerHTML = await h.support.render(h.user, 'Back', h.options);
  h.support.bind(h.container, h.user, () => {}, 'Back', h.options);
  await h.container.querySelectorAll('[data-ticket-view]').find(button => button.dataset.ticketView === 'EOR-1').click();
  assert.match(h.modalContent.innerHTML, /Please correct the &lt;venue&gt;/);
  assert.doesNotMatch(h.modalContent.innerHTML, /priority|Internal staff note/i);
  h.fields.status.value = 'resolved';
  await h.fields.update.click();
  assert.equal(h.persisted, undefined, 'Resolving requires a reply');
  h.fields.reply.value = '  The venue is now correct.  ';
  await h.fields.update.click();
  assert.equal(h.request.status, 'Resolved');
  assert.equal(h.persisted.eventOpsRequests[0].response, 'The venue is now correct.');
  assert.deepEqual(Array.from(h.request.messages, message => message.message), ['We are checking the venue.', 'The venue is now correct.']);
  assert.equal(h.db.eventOperationsTasks[1].status, 'Resolved', 'Duplicate legacy copies stay in sync');
  assert.equal(h.server.calls.some(call => call.options.method === 'PATCH'), false, 'Legacy event issues must use their own storage');
  assert.match(h.modalContent.innerHTML, /The venue is now correct/);
  assert.match(h.fields.feedback.textContent, /Reply saved/);
  assert.match(h.container.innerHTML, /Resolved: 1/);
  await h.refresh.click();
  assert.match(h.container.innerHTML, /Customer Requests/);
  assert.equal(h.container.querySelectorAll('[data-ticket-view]').length, 3);
  h.context.updateSupportExecutiveEventRequest('EOP-1', { status: 'open', response: '' });
  assert.equal(h.task.status, 'Pending', 'Status-only updates work for operational tasks');
});
