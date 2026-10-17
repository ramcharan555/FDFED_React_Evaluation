const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const runtime = fs.readFileSync(path.join(__dirname, '../src/apps/organizer/app/runtime.js'), 'utf8');
const sync = fs.readFileSync(path.join(__dirname, '../src/shared/api/data-sync.js'), 'utf8');

test('Manage Events exposes all required backend-driven views and filter controls', () => {
  const start = runtime.indexOf('    function pageWorkflowEvents()');
  const end = runtime.indexOf('    function pageCompletedEvents', start);
  const source = runtime.slice(start, end);
  for (const label of ['All Events', 'Upcoming', 'In Progress', 'Completed', 'Cancelled', 'Needs Attention', 'Clear filters', 'Soonest first']) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /event\.needsAttention === true/);
  assert.match(source, /event\.backendStatus \|\| event\.status/);
});

test('Manage Events renders the requested status totals from its event records', () => {
  const start = runtime.indexOf('    function pageWorkflowEvents()');
  const end = runtime.indexOf('    function setOrganizerEventFilter', start);
  const source = runtime.slice(start, end);
  const statuses = [
    ...Array(5).fill('published'),
    ...Array(4).fill('ongoing'),
    ...Array(5).fill('completed'),
    'cancelled',
  ];
  const events = statuses.map((status, index) => ({
    id: `event-${index}`,
    title: `Event ${index}`,
    organizer: 'organizer-1',
    backendStatus: status,
    date: status === 'published' ? '2099-11-01' : '2026-10-17',
    time: '09:00',
    needsAttention: index < 3,
  }));
  const context = vm.createContext({
    _workflowEventTab: 'all',
    CU: { id: 'organizer-1' },
    DB: { events },
    localDateKey: () => '2026-10-17',
    sessionStorage: { getItem: () => '' },
    escapeHtml: value => String(value ?? ''),
    evCard: event => event.title,
  });
  vm.runInContext(source, context);

  const html = context.pageWorkflowEvents();
  for (const total of [
    'Upcoming (5)',
    'In Progress (4)',
    'Completed (5)',
    'Cancelled (1)',
    'Needs Attention (3)',
  ]) assert.ok(html.includes(total), `Expected Events page to render ${total}`);
});

test('Event Requests tabs, dynamic filters, search, overdue states, and details render from workflow data', () => {
  const start = runtime.indexOf('    function normalizeEventRequest(');
  const end = runtime.indexOf('    function workflowPayload(', start);
  const source = runtime.slice(start, end);
  const requests = [
    {
      id: 'req-new', requestId: 'req-new', organizer: 'organizer-1', organizerUserId: 'organizer-1',
      title: 'Northstar Product Reveal', eventType: 'Product Launch', eventDate: '2099-11-20', budget: 180000,
      capacity: 260, status: 'submitted', agreementStatus: 'not_sent', paymentStatus: 'unpaid',
      clientDetails: { name: 'Aisha Rao', companyName: 'Northstar Technology' }, demoScenario: 'event-request-workflow-v1',
    },
    {
      id: 'req-proposal', requestId: 'req-proposal', organizer: 'organizer-1', organizerUserId: 'organizer-1',
      title: 'Mosaic Health Summit', eventType: 'Conference', eventDate: '2099-12-10', budget: 95000,
      capacity: 120, status: 'proposal_sent', agreementStatus: 'not_sent', paymentStatus: 'failed',
      clientDetails: { name: 'Daniel Kim', email: 'daniel@example.test' },
    },
  ];
  const stored = new Map();
  const notices = [];
  const context = vm.createContext({
    CU: { id: 'organizer-1', role: 'organizer' },
    DB: { eventRequests: requests, users: [] },
    sessionStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, String(value)),
      removeItem: key => stored.delete(key),
    },
    g: () => null,
    renderPage: async () => {},
    toast: (...args) => notices.push(args),
    localDateKey: () => '2026-10-17',
    escapeHtml: value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    workflowHtml: value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    reqBadge: () => 'blue',
  });
  vm.runInContext(source, context);

  const all = context.pageEventRequests();
  for (const label of ['All Requests (2)', 'Actionable (1)', 'Needs Review (1)', 'Proposals & Client (1)', 'DEMO DATA', 'View Details']) {
    assert.ok(all.includes(label), `Expected Event Requests to render ${label}`);
  }
  assert.match(all, /viewWorkflowRequestDrawer\('req-new'\)/);
  stored.set('org_reqs_status', 'proposal_sent');
  stored.set('org_reqs_type', 'Conference');
  stored.set('org_reqs_payment', 'failed');
  stored.set('org_reqs_date_from', '2099-12-01');
  stored.set('org_reqs_date_to', '2099-12-31');
  assert.match(context.pageEventRequests(), /Showing 1 of 2 requests/);
  stored.set('org_reqs_search', 'daniel@example.test');
  assert.match(context.pageEventRequests(), /Showing 1 of 2 requests/);
  stored.set('org_reqs_search', 'no matching client');
  assert.match(context.pageEventRequests(), /Showing 0 of 2 requests/);

  stored.set('org_reqs_date_from', '2099-11-20');
  stored.set('org_reqs_date_to', '2099-12-20');
  context.setOrganizerRequestFilter('date_to', '2099-11-01');
  assert.equal(stored.get('org_reqs_date_to'), '2099-12-20');
  assert.match(notices[0][0], /date range start must be on or before its end/);
});

test('organizer detail workspace includes the five sections and backend lifecycle mutations', () => {
  const start = runtime.indexOf('    function openOrganizerEventWorkspace');
  const end = runtime.indexOf('    function openViewEventDrawer', start);
  const source = runtime.slice(start, end);
  for (const section of ['overview', 'preparation', 'registrations', 'issues', 'history']) assert.match(source, new RegExp(section));
  for (const action of ['Postpone', 'Cancel', 'Mark Completed', 'Update Preparation']) assert.match(source, new RegExp(action));
  assert.match(source, /apiUpdateEvent/);
  assert.match(source, /EventFlowData\.mutate/);
  assert.doesNotMatch(source, /saveDB\(/);
});

test('normal event editing does not change lifecycle status implicitly', () => {
  const editPatch = sync.slice(sync.indexOf("patch('saveEditEvent'"), sync.indexOf("for (const name of ['deleteEvent'", sync.indexOf("patch('saveEditEvent'")));
  assert.match(editPatch, /field\('ee-status'\) \? \{ status:/);
  assert.match(editPatch, /category: field\('ee-category'\)/);
});
