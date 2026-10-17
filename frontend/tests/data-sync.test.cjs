const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/services/data-sync.js'), 'utf8');
const policy = fs.readFileSync(path.join(__dirname, '../src/services/account-policy.js'), 'utf8');
const runtime = fs.readFileSync(path.join(__dirname, '../src/apps/employee1/runtime.js'), 'utf8');

function harness() {
  const user = { userId: 'agent', id: 'agent', name: 'Support Agent', userRole: 'event_staff', role: 'staff', employeeType: 'SUPPORT_EXECUTIVE', token: 'token' };
  const customer = { userId: 'customer', name: 'Customer One', email: 'customer@example.com', userRole: 'attendee', status: 'active', createdAt: '2026-10-01' };
  const event = { eventId: 'event', name: 'Live conference', status: 'published', date: '2099-11-01', ticketPrice: 100, registered: 1, capacity: 20, organizerId: 'org', organizerUserId: 'organizer', location: 'Live Hall' };
  const server = { version: 1, currentUser: structuredClone(user), users: [customer], events: [event],
    registrations: [{ registrationId: 'registration', attendeeId: 'attendee-profile', attendee: customer, eventId: 'event', event, status: 'registered', registrationDate: '2026-10-17', payment: { status: 'completed', amount: 100 } }],
    eventRequests: [], eventPlans: [], staffAssignments: [], staffProfiles: [], payments: [{ paymentId: 'payment', registrationId: 'registration', amount: 100, status: 'completed', paymentDate: '2026-10-17' }],
    refunds: [], eventWorkflowPayments: [], notifications: [], supportTickets: [], staffReports: [], supportReports: [], fail: false, hold: null, calls: [] };
  const elements = new Map([['page-content', { innerHTML: '', querySelector: () => null }]]);
  const listeners = {}, intervals = [], storage = new Map(), toasts = [];
  const context = vm.createContext({ console, FormData, crypto: require('node:crypto').webcrypto,
    CU: user, DB: { users: [{ id: 'stale', name: 'Browser-only user' }], events: [], registrations: [] },
    _currentPage: 'dashboard', renderCalls: [], renderers: {}, closed: 0,
    document: { hidden: false, activeElement: null, getElementById: id => elements.get(id) || null,
      querySelector: () => null, addEventListener: (name, listener) => { listeners[name] = listener; } },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    localStorage: { setItem() {} }, setInterval: fn => intervals.push(fn), addEventListener: (name, fn) => { listeners[name] = fn; },
    toast: (...args) => toasts.push(args), closeModal() { context.closed++; },
    updateNotifDot() {}, updateHeaderUser() {},
    saveSettings() {}, saveUser() {}, toggleUserStatus() {}, approveRegistrationDirect() {}, confirmRejectRegistration() {},
    setEventOpsStatus() {}, respondAssign() {},
    fetch: async (url, options = {}) => {
      server.calls.push({ url, options });
      const result = (status, body) => ({ ok: status < 400, json: async () => structuredClone(body) });
      if (server.hold && !options.method) {
        const { hold, calls, fail, ...snapshot } = server;
        const copy = structuredClone(snapshot);
        await hold;
        return result(200, copy);
      }
      if (server.fail) return result(503, { message: 'Server unavailable' });
      if (!options.method) { const { hold, calls, fail, ...snapshot } = server; return result(200, snapshot); }
      const body = options.body ? JSON.parse(options.body) : {};
      if (url.endsWith('/review')) {
        server.registrations[0].reviewStatus = body.decision;
        if (body.decision === 'rejected') { server.registrations[0].status = 'rejected'; server.registrations[0].rejectionReason = body.reason; }
      } else if (url.includes('/workspace/events/')) Object.assign(server.events[0], body);
      else if (url.includes('/users/agent')) Object.assign(server.currentUser, body);
      else if (url.includes('/customers/customer')) Object.assign(server.users[0], body);
      server.version++;
      return result(200, { success: true, data: body });
    },
  });
  context.window = context;
  vm.runInContext(policy, context);
  vm.runInContext(runtime.slice(runtime.indexOf('    function dashSupportExecutive()'), runtime.indexOf('    function pageUserAndEventManagement()')), context);
  vm.runInContext('async function renderPage(pg) { renderCalls.push(pg); document.getElementById("page-content").innerHTML = renderers[pg] ? renderers[pg]() : pg === "dashboard" ? dashSupportExecutive() : pg; }', context);
  vm.runInContext(source, context);
  return { context, server, elements, listeners, intervals, storage, toasts, content: elements.get('page-content'),
    field(id, value) { elements.set(id, { value }); } };
}

test('dashboard renders server registrations and stable IDs instead of browser samples', async () => {
  const h = harness();
  await h.context.renderPage('dashboard');
  assert.match(h.content.innerHTML, /Customer One · Live conference/);
  assert.doesNotMatch(h.content.innerHTML, /Browser-only user/);
  assert.equal(h.context.DB.registrations[0].attendeeId, 'customer');
  assert.equal(h.context.DB.registrations[0].eventId, 'event');
  assert.equal(h.context.DB.registrations[0].payment, 'paid');
  assert.equal(h.context.DB.financeTransactions[0].amount, 100);
  assert.equal(h.context.DB.users.length, 1);
});

test('background updates render changed data, leave unchanged pages alone, and preserve an edited form', async () => {
  const h = harness();
  await h.context.renderPage('dashboard');
  await h.intervals[0]();
  assert.equal(h.context.renderCalls.length, 1);
  h.server.users[0].name = 'Changed Customer'; h.server.version++;
  await h.intervals[0]();
  assert.match(h.content.innerHTML, /Changed Customer/);
  const input = { id: 'st-name', isConnected: true, closest: selector => selector === '#page-content' ? {} : null };
  h.listeners.input({ target: input });
  h.server.users[0].name = 'Newest Customer'; h.server.version++;
  const count = h.context.renderCalls.length;
  await h.intervals[0]();
  assert.equal(h.context.renderCalls.length, count);
  input.isConnected = false;
  await h.intervals[0]();
  assert.match(h.content.innerHTML, /Newest Customer/);
});

test('registration reviews and event status changes are saved before rendering updated records', async () => {
  const h = harness();
  await h.context.renderPage('dashboard');
  await h.context.approveRegistrationDirect('registration');
  assert.equal(h.server.registrations[0].reviewStatus, 'approved');
  assert.equal(h.context.DB.registrations[0].verificationStatus, 'Verified');
  assert.doesNotMatch(h.content.innerHTML, /Customer One · Live conference/);
  await h.context.setEventOpsStatus('event', 'Cancelled');
  assert.equal(h.server.events[0].status, 'cancelled');
  assert.equal(h.context.DB.events[0].status, 'cancelled');
  const call = h.server.calls.find(call => call.url.endsWith('/workspace/events/event'));
  assert.equal(call.options.method, 'PATCH');
});

test('failed saves preserve the server-backed record and form without showing success', async () => {
  const h = harness();
  await h.context.renderPage('dashboard');
  h.field('um-edit-name', 'Edited customer'); h.field('um-edit-email', 'edited@example.com');
  h.field('um-edit-role', 'attendee'); h.field('um-edit-status', 'active');
  h.server.fail = true;
  await h.context.saveUser('customer');
  assert.equal(h.context.DB.users[0].name, 'Customer One');
  assert.equal(h.elements.get('um-edit-name').value, 'Edited customer');
  assert.equal(h.context.closed, 0);
  assert.deepEqual(h.toasts.at(-1), ['Server unavailable', 'error']);
});

test('profile saves refresh the session and protected personnel cannot be changed', async () => {
  const h = harness();
  await h.context.renderPage('dashboard');
  h.field('st-name', 'New name'); h.field('st-email', 'new@example.com'); h.field('st-phone', '9876543210'); h.field('st-bio', 'New biography');
  await h.context.saveSettings();
  assert.equal(h.context.CU.name, 'New name');
  assert.equal(JSON.parse(h.storage.get('ef_cu')).email, 'new@example.com');
  h.context.DB.users.push({ id: 'admin', role: 'superuser', name: 'Admin' });
  const count = h.server.calls.length;
  await h.context.toggleUserStatus('admin');
  assert.equal(h.server.calls.length, count);
  assert.match(h.toasts.at(-1)[0], /Only an admin/);
});

test('a failed initial load shows a retry state instead of rendering browser demo data', async () => {
  const h = harness(); h.server.fail = true;
  await h.context.renderPage('dashboard');
  assert.equal(h.context.renderCalls.length, 0);
  assert.match(h.content.innerHTML, /Data could not be loaded/);
  assert.match(h.content.innerHTML, /Server unavailable/);
});

test('overlapping navigation shares one fetch and renders only the latest destination', async () => {
  const h = harness();
  let release; h.server.hold = new Promise(resolve => { release = resolve; });
  const first = h.context.renderPage('dashboard');
  const second = h.context.renderPage('settings');
  release(); await Promise.all([first, second]);
  assert.deepEqual(Array.from(h.context.renderCalls), ['settings']);
  assert.equal(h.server.calls.length, 1);
});

test('a read started before a save cannot overwrite the saved registration', async () => {
  const h = harness(); await h.context.renderPage('dashboard');
  let release; h.server.hold = new Promise(resolve => { release = resolve; });
  const oldRead = h.context.EventFlowData.sync();
  h.server.hold = null;
  await h.context.approveRegistrationDirect('registration');
  assert.equal(h.context.DB.registrations[0].verificationStatus, 'Verified');
  release(); await oldRead;
  assert.equal(h.context.DB.registrations[0].verificationStatus, 'Verified');
});

test('an in-flight load cannot restore a signed-out session or render its private dashboard', async () => {
  const h = harness();
  let release; h.server.hold = new Promise(resolve => { release = resolve; });
  const loading = h.context.renderPage('dashboard');
  h.context.CU = null;
  release(); await loading;
  assert.equal(h.storage.has('ef_cu'), false);
  assert.equal(h.context.renderCalls.length, 0);
  assert.equal(h.context.DB.users[0].id, 'stale');
});

test('admin revenue charts use actual ticket and client payments without estimates, padding or double counting', async () => {
  const h = harness(); await h.context.renderPage('dashboard');
  const admin = fs.readFileSync(path.join(__dirname, '../src/apps/admin/runtime.js'), 'utf8');
  const start = admin.indexOf('    function pageRevenueReports()');
  const end = admin.indexOf('    function ', start + '    function pageRevenueReports()'.length);
  const charts = [];
  for (const name of ['buildAnalyticsBars', 'buildAnalyticsLine', 'buildAnalyticsProgress', 'buildAnalyticsRings']) {
    h.context[name] = rows => { charts.push(rows); return ''; };
  }
  vm.runInContext(admin.slice(start, end), h.context);
  let markup = h.context.pageRevenueReports();
  assert.match(markup, /₹0\.1K/);
  const streams = charts.find(rows => rows.some(row => row.label === 'Ticket Sales'));
  assert.equal(streams.find(row => row.label === 'Ticket Sales').value, 0.1);
  h.server.eventWorkflowPayments.push({ paymentId: 'client-payment', eventId: 'event', amount: 900, status: 'completed', paymentDate: '2026-10-17' });
  h.server.version++; await h.context.EventFlowData.sync();
  assert.match(h.context.pageRevenueReports(), /₹1\.0K/);
  h.server.payments = []; h.server.eventWorkflowPayments = []; h.server.version++;
  await h.context.EventFlowData.sync();
  markup = h.context.pageRevenueReports();
  assert.match(markup, /₹0\.0K/);
  assert.doesNotMatch(markup, /134\.7K|18\.4%|Corporate Sponsors/);
});

test('staff assignment cards render canonical server identities, roles and fees', async () => {
  const h = harness();
  h.server.currentUser.employeeType = undefined;
  h.server.staffProfiles = [{ staffId: 'staff-profile', userId: 'agent', availableDates: [], rating: 0 }];
  h.server.staffAssignments = [{ assignmentId: 'assignment', staffId: 'staff-profile', eventId: 'event', organizerId: 'org', status: 'accepted', role: 'Check-in desk', fee: 1250, notes: 'Arrive at 09:00' }];
  await h.context.EventFlowData.sync();
  const staff = fs.readFileSync(path.join(__dirname, '../src/apps/staff/runtime.js'), 'utf8');
  const start = staff.indexOf('    function staffAssignCard('), end = staff.indexOf('    function respondAssign(', start);
  vm.runInContext(staff.slice(start, end), h.context);
  const assignment = h.context.DB.staffAssignments[0];
  assert.equal(assignment.staffId, 'agent');
  assert.equal(assignment.backendStaffId, 'staff-profile');
  const card = h.context.staffAssignCard(assignment, false);
  assert.match(card, /Live conference/); assert.match(card, /Check-in desk/); assert.match(card, /₹1250/);
});

test('restored admin bar graphs render refreshed server records and keep role and stage filters', async () => {
  const h = harness();
  const admin = fs.readFileSync(path.join(__dirname, '../src/apps/admin/runtime.js'), 'utf8');
  h.context.escapeHtml = value => String(value).replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);
  h.context.ROLE_LABELS = { attendee: 'Attendee', staff: 'Staff', client: 'Client', organizer: 'Organizer', superuser: 'Super Admin' };
  h.server.currentUser.userRole = 'super_admin';
  h.server.currentUser.employeeType = undefined;
  h.server.users[0].createdAt = new Date().toISOString();
  const helperStart = admin.indexOf('    function adminChartText(');
  const helperEnd = admin.indexOf('    async function pageEmployeeStats(', helperStart);
   vm.runInContext(admin.slice(admin.indexOf('    let adminChartSequence = 0;'), helperEnd), h.context);
  vm.runInContext(admin.slice(admin.indexOf('    function filterEventReportsStage('), admin.indexOf('    function pageEventReports(')), h.context);
  for (const [page, name] of [['user-reports', 'pageUserReports'], ['event-reports', 'pageEventReports'], ['revenue-reports', 'pageRevenueReports']]) {
    const start = admin.indexOf(`    function ${name}(`);
    const end = admin.indexOf('    function ', start + `    function ${name}(`.length);
    vm.runInContext(admin.slice(start, end), h.context);
    h.context.renderers[page] = () => h.context[name]();
  }

  await h.context.renderPage('user-reports');
   assert.match(h.content.innerHTML, /Monthly Registrations/);
  assert.match(h.content.innerHTML, /filterUserReports\('attendee'\)/);
   assert.match(h.content.innerHTML, /admin-chart--line/);
   assert.match(h.content.innerHTML, /admin-chart--bar/);
   assert.match(h.content.innerHTML, /admin-chart--rings/);
  const beforeUsers = h.content.innerHTML;
  h.server.users.push({ ...h.server.users[0], userId: 'customer-two', name: 'Customer Two', email: 'two@example.com' });
  h.server.version++;
  await h.context.EventFlowData.refresh();
  assert.notEqual(h.content.innerHTML, beforeUsers);
  assert.equal(h.context.DB.users.length, 2);

  await h.context.renderPage('event-reports');
  assert.match(h.content.innerHTML, /filterEventReportsStage\('upcoming'\)/);
  const beforeEvents = h.content.innerHTML;
  h.server.events[0].registered = 9; h.server.version++;
  await h.context.EventFlowData.refresh();
  assert.notEqual(h.content.innerHTML, beforeEvents);
   assert.equal(h.context.DB.events[0].registered, 9);
  await h.context.filterEventReportsStage('completed');
  assert.equal(h.storage.get('admin_event_reports_stage'), 'completed');
  assert.match(h.content.innerHTML, /class="btn btn-xs btn-primary" onclick="filterEventReportsStage\('completed'\)"/);

  await h.context.renderPage('revenue-reports');
   assert.match(h.content.innerHTML, /Platform Revenue/);
  assert.match(h.content.innerHTML, /₹0\.1K/);
  h.server.payments[0].amount = 250; h.server.version++;
  await h.context.EventFlowData.refresh();
  assert.match(h.content.innerHTML, /₹0\.3K/);
   assert.doesNotMatch(h.content.innerHTML, /134\.7K|Corporate Sponsors/);
  const zero = h.context.buildAnalyticsBars([{ label: 'Zero', value: 0 }], 145);
   assert.match(zero, /Zero/);
});
