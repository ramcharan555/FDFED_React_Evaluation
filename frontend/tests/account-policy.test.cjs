const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policy = fs.readFileSync(path.join(__dirname, '../src/services/account-policy.js'), 'utf8');
const apps = ['admin', 'attendee', 'client', 'employee1', 'employee2', 'employee3', 'landing', 'organizer', 'staff'];
function harness(extra = {}) {
  const context = vm.createContext({ window: {}, CU: { role: 'staff', employeeType: 'SUPPORT_EXECUTIVE' }, ...extra });
  vm.runInContext(policy, context);
  return context;
}
function section(source, startText, endText) {
  const start = source.indexOf(startText), end = source.indexOf(endText, start);
  assert.ok(start >= 0 && end > start, startText);
  return source.slice(start, end);
}

test('saved sample cleanup removes only the retired demo account and updates canned requests and reports', () => {
  const context = harness();
  const db = { users: [
    { id: 'usr-dup-001', name: 'Priya Patel (Secondary)', email: 'attendee@example.com' },
    { id: 'usr-attendee-001', name: 'Priya Patel', email: 'attendee@example.com' },
    { id: 'user-custom', name: 'Other user', email: 'attendee@example.com' },
  ], userQueries: [{ id: 'UQR-501', subject: 'Request to delete duplicate attendee account', status: 'Pending' },
    { id: 'UQR-505', subject: 'Duplicate ticket registration merge inquiry' },
    { id: 'custom-query', subject: 'Keep this request' }],
  regReports: [{ id: 'RVR-002', title: 'Duplicate Account Detection & Resolution Summary — Q2 2026' },
    { id: 'custom-report', title: 'User-authored report' }],
  supportExecReports: [{ id: 'SER-server', backendReportId: 'SER-server', sourceReference: 'legacy:RVR-002',
    title: 'Duplicate Account Detection & Resolution Summary — Q2 2026' }] };
  context.window.EventFlowAccountPolicy.migrateLegacyDemoData(db);
  assert.equal(db.users.length, 2);
  assert.ok(db.users.some(user => user.id === 'user-custom'), 'Never delete an actual account based on a matching email');
  assert.equal(db.userQueries[0].subject, 'Request permanent account deletion');
  assert.equal(db.userQueries[0].status, 'Pending');
  assert.equal(db.userQueries[1].userId, 'usr-attendee-001');
  assert.equal(db.regReports[0].title, 'Account Access & Verification Summary — Q2 2026');
  assert.equal(db.regReports[1].title, 'User-authored report');
  assert.equal(db.supportExecReports[0].title, 'Account Access & Verification Summary — Q2 2026');
  assert.equal(db.supportExecReports[0].fileName, 'No document attached');
  const before = JSON.stringify(db);
  context.window.EventFlowAccountPolicy.migrateLegacyDemoData(db);
  assert.equal(JSON.stringify(db), before, 'The saved-data update must be repeatable');
});

test('the shared email check blocks another account and permits the current account email', () => {
  const { window } = harness();
  const users = [{ id: '1', email: 'Attendee@Example.com' }, { id: '2', email: 'other@example.com' }];
  assert.equal(window.EventFlowAccountPolicy.isEmailInUse(users, ' attendee@EXAMPLE.COM '), true);
  assert.equal(window.EventFlowAccountPolicy.isEmailInUse(users, 'attendee@example.com', '2'), true);
  assert.equal(window.EventFlowAccountPolicy.isEmailInUse(users, 'attendee@example.com', '1'), false);
});

test('user management keeps its account filters and actions with no duplicate account feature in any role runtime', () => {
  for (const app of apps) {
    const source = fs.readFileSync(path.join(__dirname, `../src/apps/${app}/runtime.js`), 'utf8');
    assert.doesNotMatch(source, /Duplicate Account|duplicate-account|openDuplicateUsersModal|usr-dup-001|Priya Patel \(Secondary\)/i, app);
    assert.match(source, /EventFlowAccountPolicy\.migrateLegacyDemoData\(DB\)/, app);
    const context = harness({ DB: { users: [{ id: '1', name: 'Sample user', email: 'user@example.com', phone: '12345', role: 'attendee', status: 'active' }] },
      sessionStorage: { getItem: () => '' }, ROLE_COLORS: { attendee: 'blue' }, ROLE_LABELS: { attendee: 'Attendee' } });
    vm.runInContext(section(source, 'function pageUserManagement()', 'function refreshUserManagement('), context);
    const html = context.pageUserManagement();
    assert.match(html, /Sample user/);
    assert.match(html, /usrmgt-role/);
    assert.match(html, /openEditUserModal/);
    assert.doesNotMatch(html, /duplicate|secondary|merge/i);
  }
});

test('account edits reject a used email before changing the stored profile', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/apps/employee1/runtime.js'), 'utf8');
  const db = { users: [{ id: '1', name: 'First', email: 'first@example.com', role: 'attendee' }, { id: '2', name: 'Second', email: 'second@example.com', role: 'attendee' }] };
  const values = { 'edit-usr-name': 'Changed', 'edit-usr-email': ' SECOND@EXAMPLE.COM ' };
  const notices = [];
  const context = harness({ DB: db, v: id => values[id], toast: message => notices.push(message),
    saveDB() { assert.fail('The rejected profile must not be saved'); }, closeModal() {}, renderPage() {} });
  vm.runInContext(section(source, 'function saveEditUser(', 'function toggleUserStatus('), context);
  context.saveEditUser('1');
  assert.equal(db.users[0].name, 'First');
  assert.equal(db.users[0].email, 'first@example.com');
  assert.match(notices[0], /Email already registered/);
});
