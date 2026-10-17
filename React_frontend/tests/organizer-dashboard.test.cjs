const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/apps/organizer/app/runtime.js'), 'utf8');
const start = source.indexOf('    function dashOrganizer()');
const end = source.indexOf('    function searchOrganizerEvents(query)', start);
assert.ok(start >= 0 && end > start);

function harness() {
  const navigated = [];
  const session = new Map();
  const dashboard = {
    totalEvents: 15, pendingRequests: 8, totalRevenue: 10100, grossRevenue: 11000, refundedAmount: 900,
    eventsNeedingAttention: 3, attentionEventIds: ['evt-attention-1', 'evt-attention-2', 'evt-attention-3'],
    eventStatusCounts: { upcoming: 5, inProgress: 4, completed: 5, cancelled: 1, needsAttention: 3 },
    priorityActions: [
      { type: 'request', id: 'req-1', title: 'Client launch', detail: 'Client request needs your response' },
      { type: 'preparation', id: 'prep-1', eventId: 'evt-1', title: 'Prepare hall', detail: 'Preparation task is overdue' },
      { type: 'issue', id: 'ticket-1', title: 'Venue access', detail: 'Door access is unresolved' },
    ],
    upcomingSchedule: [
      { eventId: 'evt-1', title: 'Confirmed conference', date: '2099-11-01', time: '09:00', location: 'Hall A', status: 'published' },
      { eventId: 'evt-2', title: 'Design summit', date: '2099-11-02', time: '10:00', location: 'Hall B', status: 'published' },
      { eventId: 'evt-3', title: 'Community night', date: '2099-11-03', time: '17:30', location: 'Hall C', status: 'published' },
    ],
    financialRecords: [{ id: 'pay-1', type: 'Event payment', amount: 1500, status: 'completed', date: '2026-10-17', eventId: 'evt-1' }],
  };
  const context = vm.createContext({
    organizerDashboardData: dashboard, _workflowEventTab: 'ongoing',
    CU: { id: 'usr-org', role: 'organizer', name: 'Organizer' },
    DB: { events: [{ id: 'evt-1', title: 'Confirmed conference' }] },
    workflowHtml: value => String(value ?? ''), openAddEventModal() {}, viewWorkflowRequestDrawer() {}, openViewEventDrawer: id => navigated.push(`event:${id}`),
    goNav: page => navigated.push(page),
    sessionStorage: { setItem: (key, value) => session.set(key, value) },
    Intl, Date,
  });
  vm.runInContext(source.slice(start, end), context);
  return { context, navigated, session };
}

test('organizer dashboard renders the four backend summary cards without the duplicate event grid', () => {
  const { context } = harness();
  const html = context.dashOrganizer();
  for (const label of ['My Events', 'Pending Event Requests', 'Event Revenue', 'Events Needing Attention', 'Priority Actions', 'Upcoming Schedule']) assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /id="org-events-grid"/);
  assert.match(html, /₹10,100/);
  for (const total of ['Upcoming <strong>5', 'In Progress <strong>4', 'Completed <strong>5', 'Cancelled <strong>1', 'Needs Attention <strong>3']) assert.match(html, new RegExp(total));
});

test('attention card never renders undefined when an older response omits its count', () => {
  const { context } = harness();
  context.organizerDashboardData.eventsNeedingAttention = undefined;
  const html = context.dashOrganizer();
  assert.doesNotMatch(html, /undefined/);
  assert.match(html, /Events Needing Attention/);
});

test('summary navigation preserves matching destination filters', () => {
  const { context, navigated, session } = harness();
  context.openOrganizerRequests();
  assert.equal(session.get('org_reqs_tab'), 'actionable');
  assert.equal(navigated.at(-1), 'event-requests');
  context.openOrganizerEvents('attention');
  assert.equal(context._workflowEventTab, 'attention');
  assert.equal(navigated.at(-1), 'my-events');
  context.openOrganizerEvents('ongoing');
  assert.equal(context._workflowEventTab, 'ongoing');
  assert.equal(navigated.at(-1), 'my-events');
  context.openOrganizerIssue('ticket-1');
  assert.equal(session.get('organizer_issue_focus'), 'ticket-1');
  assert.equal(navigated.at(-1), 'customer-support');
});

test('preparation and upcoming schedule actions open their linked event records', () => {
  const { context } = harness();
  const html = context.dashOrganizer();
  assert.match(html, /openViewEventDrawer\('evt-1'\)/);
  assert.match(html, /organizerEventSection\('evt-1','preparation'\)/);
  assert.match(html, /published/);
});

test('organizer financial record page exposes only supplied authorized records', () => {
  const { context } = harness();
  const html = context.pageOrganizerFinancialRecords();
  assert.match(html, /Net Revenue/);
  assert.match(html, /pay-1/);
  assert.doesNotMatch(html, /pay-failed/);
});
