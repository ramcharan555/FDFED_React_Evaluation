const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/apps/employee3/finance.js'), 'utf8');
function setup(fail = false) {
  const calls = [], handlers = {};
  const form = { querySelector(selector) { return selector.includes('preset') ? {} : null; } };
  const el = { innerHTML: '', isConnected: true, querySelector(s) { return s === '#finance-filters' ? form : {}; }, querySelectorAll() { return []; } };
  const summary = { gross: 12345, refunded: 2345, net: 10000, successful: 1, failed: 0, pending: 0, commission: null, pendingRefunds: 0, pendingSettlements: 0, completedSettlements: 0, tickets: 1, organizerPayables: null, outstanding: null };
  const context = { window: { addEventListener(name, handler) { handlers[name] = handler; }, EventFlowReportInbox: { async mount() { calls.push({ mountedSentReports: true }); } } }, document: { getElementById() { return {}; } }, API_BASE_URL: 'http://test/api', getAuthHeader: () => 'Bearer fixture', AbortController, URLSearchParams, Date, Intl, console,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (fail) return { ok: false, status: 503, json: async () => ({ message: 'Backend unavailable' }) };
      if (url.includes('/reports?')) return { ok: true, json: async () => ({ type: 'transactions', generatedAt: new Date().toISOString(), totals: { recordCount: 1, amount: 12345 }, chart: [{ label: 'completed', value: 12345 }], records: [], page: 1, total: 1, totalPages: 1 }) };
      return { ok: true, json: async () => url.includes('/config') ? { provider: 'Demo provider', events: [], organizers: [], policies: [] } : { summary, trends: [{ label: '2026-10-10', revenue: 12345, commission: null, requested: 0, completed: 2345 }], paymentStatus: [{ label: 'completed', value: 1 }], events: [{ eventName: 'Fixture', organizerId: 'org', gross: 12345, net: 10000 }], activity: [] } };
    } };
  vm.createContext(context); vm.runInContext(source, context);
  return { context, el, calls };
}
test('finance dashboard renders backend values, accessible graphs and unavailable commission', async () => {
  const { context, el, calls } = setup();
  await context.window.EventFlowFinance.render(el, 'dashboard');
  assert.match(el.innerHTML, /123\.45/); assert.match(el.innerHTML, /100\.00/);
  assert.match(el.innerHTML, /Not configured/); assert.match(el.innerHTML, /role="img"/);
  assert.match(el.innerHTML, /Revenue trend/); assert.match(el.innerHTML, /Payment status/);
  assert.match(calls[1].url, /from=\d{4}-\d{2}-\d{2}/);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer fixture');
});
test('API failure displays unavailable state with retry instead of zero metrics', async () => {
  const { context, el } = setup(true);
  await context.window.EventFlowFinance.render(el, 'dashboard');
  assert.match(el.innerHTML, /Backend unavailable/); assert.match(el.innerHTML, /Retry/);
  assert.doesNotMatch(el.innerHTML, /finance-metric/);
});
test('reports provide a Super Admin send action and load the sender history', async () => {
  const { context, el, calls } = setup();
  await context.window.EventFlowFinance.render(el, 'reports');
  assert.match(el.innerHTML, /data-send-report/);
  assert.match(el.innerHTML, /Send Report to Super Admin/);
  assert.match(el.innerHTML, /finance-sent-reports/);
  assert.ok(calls.some(c => c.mountedSentReports));
});
test('navigation includes finance sections and reports without Account Settings', () => {
  const { context } = setup();
  const html = context.window.EventFlowFinance.nav();
  assert.match(html, /<details/);
  for (const name of ['Payment Transactions', 'Refund Management', 'Organizer Settlements', 'Commission &amp;', 'Payment Reconciliation', 'Reports']) assert.ok(html.includes(name), name);
  assert.doesNotMatch(html, /Account Settings|data-pg="settings"/);
});
test('combined runtime parses and historical finance filters bypass event-creation date restrictions', () => {
  const runtime = fs.readFileSync(path.join(__dirname, '../src/apps/employee3/runtime.js'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(source + '\n' + runtime));
  assert.match(runtime, /if \(target\.closest\('\.finance-workspace'\)\) return true;/);
});
