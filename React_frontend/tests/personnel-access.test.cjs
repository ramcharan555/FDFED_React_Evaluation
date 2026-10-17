const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policySource = fs.readFileSync(path.join(__dirname, '../src/shared/utils/account-policy.js'), 'utf8');
const apps = ['admin', 'attendee', 'client', 'employee1', 'employee2', 'landing', 'organizer', 'staff'];
const sourceFor = app => fs.readFileSync(path.join(__dirname, `../src/apps/${({ employee1: 'support-executive', employee2: 'finance-executive', staff: 'event-staff' })[app] || app}/app/runtime.js`), 'utf8');
function section(source, from, to, last = false) {
  const start = last ? source.lastIndexOf(from) : source.indexOf(from), end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, from);
  return source.slice(start, end);
}
function harness(app = 'employee1') {
  const source = sourceFor(app), calls = { saved: 0, opened: [], notices: [], confirmations: [] };
  const db = { users: [
    { id: 'admin', name: 'Admin Person', email: 'admin@example.com', role: 'superuser', status: 'active' },
    { id: 'employee', name: 'Finance Person', email: 'finance@example.com', role: 'staff', employeeType: 'FINANCE_EXECUTIVE', status: 'active' },
    { id: 'staff', name: 'Event Staff Person', email: 'staff@example.com', role: 'staff', status: 'active' },
    { id: 'customer', name: 'Customer Person', email: 'customer@example.com', role: 'client', status: 'active' },
  ], events: [], registrations: [] };
  const values = { 'edit-usr-name': 'Changed name', 'edit-usr-email': 'changed@example.com', 'edit-usr-role': 'client',
    'um-edit-name': 'Changed name', 'um-edit-email': 'changed@example.com', 'um-edit-role': 'client', 'um-edit-status': 'active' };
  const context = vm.createContext({ window: {}, DB: db, AppState: { users: db.users },
    CU: { id: 'support', role: 'staff', employeeType: 'SUPPORT_EXECUTIVE', email: 'support@example.com' },
    sessionStorage: { getItem: () => '' }, ROLE_LABELS: { superuser: 'Admin', staff: 'Staff', client: 'Client' }, ROLE_COLORS: {},
    v: id => values[id] || '', saveDB: () => calls.saved++, saveState: () => calls.saved++, closeModal() {}, renderPage() {},
    _currentPage: 'user-event-mgmt', toast: message => calls.notices.push(message),
    addNotification: (_id, message) => calls.notices.push(message),
    openModal: (_title, markup) => calls.opened.push(markup),
    confirm2: (_title, _message, callback) => calls.confirmations.push(callback),
  });
  vm.runInContext(policySource, context);
  for (const [from, to, last] of [
    ['function createUser(', 'function createEvent('],
    ['function openEditUserModal(', 'function saveEditUser('],
    ['function saveEditUser(', 'function toggleUserStatus('],
    ['function toggleUserStatus(', 'function deleteUserOps('],
    ['function deleteUserOps(', 'function pageAttendeeVerification('],
    ['function openEditUserModal(', 'function saveUser(', true],
    ['function saveUser(', 'function removeUser('],
    ['function removeUser(', 'function pageEvents('],
    ['function pageUserManagement()', 'function refreshUserManagement('],
    ['function buildUserManagementTable(', 'function refreshDirectoryUserManagement('],
  ]) vm.runInContext(section(source, from, to, last), context);
  return { context, source, db, values, calls };
}

test('support executives and legacy executive accounts cannot manage personnel or assign privileged roles', () => {
  const h = harness(), policy = h.context.window.EventFlowAccountPolicy;
  for (const actor of [h.context.CU, { role: 'event_staff', employeeType: 'EVENT_OPERATIONS' },
    { role: 'staff', employeeType: 'REGISTRATION_VERIFICATION' }, { role: 'support-executive' },
    { role: 'staff', email: 'employee@example.com' }]) {
    for (const target of [...h.db.users.slice(0, 3), { role: 'client', userRole: 'SUPER_ADMIN' },
      { role: 'attendee', employeeType: 'FINANCE_EXECUTIVE' }]) assert.equal(policy.canManageAccount(actor, target), false);
    assert.equal(policy.canManageAccount(actor, h.db.users[3]), true);
    assert.equal(policy.canApplyAccountUpdate(actor, h.db.users[3], { role: 'staff' }), false);
    assert.equal(policy.canApplyAccountUpdate(actor, h.db.users[3], { userRole: 'super_admin' }), false);
    assert.equal(policy.canApplyAccountUpdate(actor, h.db.users[3], { employeeType: 'SUPPORT_EXECUTIVE' }), false);
  }
  assert.equal(policy.canManageAccount({ role: 'superuser' }, h.db.users[1]), true);
});

test('every legacy account handler blocks employee and admin edits, activation, and deletion', () => {
  for (const app of apps) {
    const h = harness(app), before = JSON.stringify(h.db);
    for (const id of ['admin', 'employee', 'staff']) {
      for (const handler of ['openEditUserModal', 'saveEditUser', 'saveUser', 'toggleUserStatus', 'deleteUserOps', 'removeUser']) h.context[handler](id);
      h.context.updateUser(id, { name: 'Unauthorized change' });
      h.context.deleteUser(id);
    }
    h.context.createUser({ name: 'Unauthorized employee', role: 'staff', email: 'newemployee@example.com' });
    assert.equal(JSON.stringify(h.db), before, app);
    assert.equal(h.calls.saved, 0, app);
    assert.equal(h.calls.opened.length, 0, app);
    assert.equal(h.calls.confirmations.length, 0, app);
  }
});

test('support directories omit staff records and keep admin rows read-only', () => {
  for (const app of apps) {
    const h = harness(app);
    for (const markup of [h.context.pageUserManagement(), h.context.buildUserManagementTable(h.db.users)]) {
      for (const name of ['Admin Person']) {
        const row = markup.match(/<tr[\s\S]*?<\/tr>/g).find(row => row.includes(name));
        assert.match(row, /Admin managed/, `${app}: ${name}`);
        assert.doesNotMatch(row, /onclick=/, `${app}: ${name}`);
      }
      const customer = markup.match(/<tr[\s\S]*?<\/tr>/g).find(row => row.includes('Customer Person'));
      assert.match(customer, /openEditUserModal/);
      assert.doesNotMatch(markup, /Finance Person|Event Staff Person|<option value="staff"/);
    }
  }
  const h = harness();
  vm.runInContext(section(h.source, 'function pageUserAndEventManagement()', 'function supportExecutiveEventRequests('), h.context);
  const unified = h.context.pageUserAndEventManagement();
  assert.equal((unified.match(/Admin managed/g) || []).length, 1);
  assert.match(unified, /Users \(2\)/);
  assert.doesNotMatch(unified, /Finance Person|Event Staff Person|<option value="staff"/);
});

test('support dashboard counts, event details, notifications and profile dialogs exclude staff data', () => {
  const h = harness();
  Object.assign(h.db, { eventOperationsTasks: [], userQueries: [], supportRequests: [],
    events: [{ id: 'event', title: 'Customer event', date: '2099-12-01', status: 'upcoming', capacity: 10, registered: 1, price: 0 }],
    staffAssignments: [{ id: 'assignment', eventId: 'event', staffId: 'staff' }],
    notifications: [{ id: 'normal', title: 'New customer request', type: 'support_ticket_received' },
      { id: 'staff', title: 'Staff assignment received', type: 'info' },
      { id: 'finance', title: 'Finance update', employeeType: 'FINANCE_EXECUTIVE' }] });
  h.context.evStatBadge = () => 'blue';
  h.context.eventOpsStatusBadge = () => 'blue';
  h.context.formatEventStatus = value => value;
  h.context.openDrawer = (_title, markup) => h.calls.opened.push(markup);
  for (const [from, to] of [
    ['function dashSupportExecutive()', 'function pageUserAndEventManagement()'],
    ['function openViewEventDrawer(', 'function viewPublicEventDetails('],
    ['function viewOngoingEventDetail(', 'function openNewRequestForm('],
    ['function visibleNotifications()', 'function pageNotifications()'],
    ['function viewStaffProfile(', 'function assignStaffToEvent('],
    ['function pageFindStaff()', 'function searchStaff('],
  ]) vm.runInContext(section(h.source, from, to), h.context);
  const before = JSON.stringify(h.db);
  const dashboard = h.context.dashSupportExecutive();
  assert.match(dashboard, /id="se-stat-users"[^>]*>2</);
  h.context.openViewEventDrawer('event');
  assert.match(h.calls.opened[0], /Customer event|Registrations/);
  assert.doesNotMatch(h.calls.opened[0], /staff|assignment/i);
  h.context.viewOngoingEventDetail('event');
  assert.doesNotMatch(h.calls.opened[1], /staff|assignment/i);
  const opened = h.calls.opened.length;
  h.context.viewStaffProfile('staff');
  assert.equal(h.calls.opened.length, opened);
  assert.doesNotMatch(h.context.pageFindStaff(), /Event Staff Person|Finance Person/);
  assert.equal(h.context.visibleNotifications().length, 1);
  assert.equal(h.context.visibleNotifications()[0].id, 'normal');
  assert.equal(JSON.stringify(h.db), before, 'Removing staff from a workspace must not delete shared records');
  h.context.CU = { role: 'superuser' };
  assert.equal(h.context.window.EventFlowAccountPolicy.visibleAccounts(h.context.CU, h.db.users).length, 4);
  h.context.openViewEventDrawer('event');
  assert.match(h.calls.opened.at(-1), /Staff Assigned/);
});

test('customer edits keep their role, and a pending removal rechecks the account before deleting', () => {
  const h = harness();
  h.context.openEditUserModal('customer');
  assert.match(h.calls.opened[0], /id="um-edit-role" disabled/);
  h.values['um-edit-role'] = 'staff';
  h.context.saveUser('customer');
  assert.equal(h.db.users[3].name, 'Customer Person');
  assert.equal(h.db.users[3].role, 'client');
  h.values['um-edit-role'] = 'client';
  h.context.saveUser('customer');
  assert.equal(h.db.users[3].name, 'Changed name');
  h.context.removeUser('customer');
  h.db.users[3].role = 'staff';
  h.calls.confirmations[0]();
  assert.ok(h.db.users.some(user => user.id === 'customer'), 'A newly protected account must survive an old confirmation');
  h.context.CU = { id: 'admin', role: 'superuser' };
  h.values['um-edit-role'] = 'staff';
  h.values['um-edit-email'] = 'finance-updated@example.com';
  h.context.saveUser('employee');
  assert.equal(h.db.users[1].name, 'Changed name', 'Admin retains employee management');
});
