const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const supportSource = fs.readFileSync(path.join(__dirname, '../src/shared/api/support.js'), 'utf8');
function element() {
  return { children: [], listeners: {}, className: '', innerHTML: '',
    appendChild(child) { this.children.push(child); child.parent = this; },
    querySelector(selector) { return selector === '.support-settings-entry' ? this.children.find(child => child.className.includes('support-settings-entry')) || null : null; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
  };
}
function supportHarness() {
  const context = vm.createContext({ window: {}, document: { createElement: element }, FormData });
  vm.runInContext(supportSource, context);
  return { context, support: context.window.EventFlowSupport };
}

test('Customer Support settings are absent for admins, support executives, and finance executives', () => {
  const { support } = supportHarness();
  const excluded = [
    { role: 'superuser' }, { userRole: 'super_admin' }, { role: 'super-admin' }, { role: 'admin' },
    { role: 'staff', employeeType: 'SUPPORT_EXECUTIVE' },
    { userRole: 'event_staff', employeeType: 'support_executive' },
    { role: 'staff', employeeType: 'FINANCE_EXECUTIVE' },
    { role: 'staff', employeeType: 'SUPPORT_FINANCE' },
    { role: 'staff', employeeType: 'REGISTRATION_VERIFICATION' },
    { role: 'staff', employeeType: 'EVENT_OPERATIONS' },
    { role: 'finance-executive' }, { role: 'support_executive' },
    { role: 'staff' }, { userRole: 'event_staff' }, { role: 'event-staff' },
    { role: 'employee' }, { role: 'unknown' },
  ];
  for (const user of excluded) {
    const settings = element();
    support.addSettingsEntry(settings, () => assert.fail('Hidden help must not be clickable'), user);
    assert.equal(settings.children.length, 0, JSON.stringify(user));
    assert.equal(support.canRequestSupport(user), false);
  }
});

test('only clients, organizers, and attendees can submit Customer Support requests', () => {
  const { support } = supportHarness();
  for (const role of ['client', 'organizer', 'event_organizer', 'event-organizer', 'attendee']) {
    const settings = element();
    let opened = 0;
    support.addSettingsEntry(settings, () => opened++, { role });
    support.addSettingsEntry(settings, () => opened++, { role });
    assert.equal(settings.children.length, 1);
    assert.match(settings.children[0].children[0].innerHTML, /Customer Support/);
    settings.children[0].children[0].listeners.click();
    assert.equal(opened, 1);
    support.addSettingsEntry(settings, () => {}, { role: 'superuser' });
    assert.equal(settings.children.length, 0, 'A stale shortcut must be removed if the account changes');
  }
});

function runtimeHarness(app, user) {
  const { context, support } = supportHarness();
  const content = element();
  let queueRenders = 0;
  let queueBindings = 0;
  support.render = async () => { queueRenders++; return 'Support ticket management queue'; };
  support.bind = () => queueBindings++;
  Object.assign(context, {
    CU: user, _currentPage: 'dashboard', g: () => content,
    isDepartmentEmployee: () => !!user.employeeType,
    isSupportExecutive: () => user.employeeType === 'SUPPORT_EXECUTIVE',
    sessionStorage: { getItem: () => 'support' },
    pageSettings: () => '<h1>Account Settings</h1>',
  });
  const source = fs.readFileSync(path.join(__dirname, `../src/apps/${({ employee1: 'support-executive', employee2: 'finance-executive', staff: 'event-staff' })[app] || app}/app/runtime.js`), 'utf8');
  const start = source.indexOf('    async function renderPageContent(');
  const end = source.indexOf('    function dashAdmin(', start);
  assert.ok(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), context);
  const queueStart = source.indexOf('    function supportExecutiveEventRequests(');
  const queueEnd = source.indexOf('    // ─── PAGE 4:', queueStart);
  if (queueStart >= 0 && queueEnd > queueStart) {
    Object.assign(context, { DB: {}, sessionStorage: { getItem: () => null, removeItem() {} } });
    vm.runInContext(source.slice(queueStart, queueEnd), context);
  }
  return { context, content, get queueRenders() { return queueRenders; }, get queueBindings() { return queueBindings; } };
}

test('direct help navigation returns excluded roles to Settings across role runtimes', async () => {
  for (const [app, user] of [
    ['admin', { role: 'superuser' }],
    ['employee1', { role: 'staff', employeeType: 'SUPPORT_EXECUTIVE' }],
    ['employee2', { role: 'staff', employeeType: 'FINANCE_EXECUTIVE' }],
    ['employee2', { role: 'staff', employeeType: 'SUPPORT_FINANCE' }],
  ]) {
    const h = runtimeHarness(app, user);
    await h.context.renderPageContent('customer-support');
    assert.match(h.content.innerHTML, /Account Settings/);
    assert.equal(h.queueRenders, 0);
    assert.equal(h.queueBindings, 0);
    assert.equal(h.content.children.length, 0);
  }
});

test('all support and legacy event request routes open the customer queue', async () => {
  for (const route of ['support-issue-mgmt', 'event-requests', 'staff-event-requests', 'support-center']) {
    const h = runtimeHarness('employee1', { role: 'staff', employeeType: 'SUPPORT_EXECUTIVE' });
    await h.context.renderPageContent(route);
    assert.equal(h.content.innerHTML, 'Support ticket management queue', route);
    assert.equal(h.queueRenders, 1);
    assert.equal(h.queueBindings, 1);
  }
});

test('the standalone help page redirects excluded roles to their own workspace', () => {
  const esbuild = require('esbuild');
  const component = fs.readFileSync(path.join(__dirname, '../src/apps/customer-support/pages/CustomerSupportPage.jsx'), 'utf8');
  const compiled = esbuild.transformSync(component, { loader: 'jsx', format: 'cjs', jsx: 'automatic' }).code;
  for (const [user, home] of [
    [{ role: 'superuser', token: 'test-token' }, '/admin'],
    [{ role: 'staff', employeeType: 'SUPPORT_EXECUTIVE', token: 'test-token' }, '/employee1'],
    [{ role: 'staff', employeeType: 'FINANCE_EXECUTIVE', token: 'test-token' }, '/employee2'],
    [{ role: 'staff', employeeType: 'SUPPORT_FINANCE', token: 'test-token' }, '/employee2'],
  ]) {
    const h = supportHarness();
    const calls = [];
    const exports = {};
    h.context.module = { exports };
    h.context.document.body = { appendChild() {} };
    h.context.sessionStorage = { getItem: () => JSON.stringify(user) };
    h.context.exports = exports;
    h.context.require = name => {
      if (name === 'react') return { useEffect: callback => callback(), useRef: () => ({ current: element() }) };
      if (name === 'react-router-dom') return { useNavigate: () => (url, options) => calls.push([url, options.replace]) };
      if (name === 'react/jsx-runtime') return { jsx: () => null };
      if (name.endsWith('?raw')) return { default: supportSource };
      return {};
    };
    vm.runInContext(compiled, h.context);
    h.context.module.exports.default();
    assert.deepEqual(calls, [[home, true]]);
  }
});
