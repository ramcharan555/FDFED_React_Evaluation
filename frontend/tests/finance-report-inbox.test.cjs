const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/services/financeReportInbox.js'), 'utf8');
function setup(admin) {
  const calls = [], elements = new Map(), dialogElements = new Map();
  const element = () => ({ innerHTML: '', disabled: false });
  const view = { dataset: { report: 'report-1' } };
  const download = { dataset: { download: 'csv' } };
  const reviewButton = element();
  const review = { elements: { notes: { value: 'Checked totals.' } }, querySelector: () => reviewButton };
  const dialog = { ...element(), showModal() { this.open = true; }, close() { this.open = false; },
    querySelector(selector) { if (selector === '[data-review]') return admin ? review : null; if (!dialogElements.has(selector)) dialogElements.set(selector, element()); return dialogElements.get(selector); },
    querySelectorAll(selector) { return selector === '[data-download]' ? [download] : []; } };
  const host = { ...element(), isConnected: true,
    querySelector(selector) { if (selector === 'dialog') return dialog; if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); },
    querySelectorAll(selector) { return selector === '[data-report]' ? [view] : []; } };
  const report = { id: 'report-1', title: '<Unsafe> October report', type: 'transactions', submittedByName: 'Finance Executive', submittedAt: '2026-10-16T00:00:00Z', status: 'submitted', notes: 'Review requested', snapshot: { type: 'transactions', generatedAt: '2026-10-16T00:00:00Z', filters: { from: '2026-10-01' }, totals: { recordCount: 1, amount: 12345 }, records: [{ id: 'payment', amount: 12345 }] } };
  const context = { window: {}, API_BASE_URL: 'http://test/api', getAuthHeader: () => 'Bearer test', URLSearchParams, Intl, Date, console,
    URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL() {} }, setTimeout: callback => callback(),
    document: { createElement: () => ({ click() { calls.push({ downloaded: true }); } }) },
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/review')) report.status = 'reviewed';
      const data = url.includes('?page=') ? { records: [report], page: 1, total: 1, totalPages: 1 } : report;
      return { ok: true, json: async () => data, blob: async () => 'saved report CSV' };
    } };
  vm.createContext(context); vm.runInContext(source, context);
  return { context, host, view, dialog, download, review, calls };
}
test('Super Admin inbox opens the submitted snapshot, downloads it, and sends review feedback', async () => {
  const { context, host, view, dialog, download, review, calls } = setup(true);
  await context.window.EventFlowReportInbox.mount(host, { admin: true });
  assert.match(host.innerHTML, /Received Finance Reports/);
  assert.match(host.innerHTML, /&lt;Unsafe&gt;/); assert.doesNotMatch(host.innerHTML, /<Unsafe>/);
  await view.onclick();
  assert.equal(dialog.open, true); assert.match(dialog.innerHTML, /Original submitted report/);
  assert.match(dialog.querySelector('[data-snapshot-table]').innerHTML, /12345/);
  await download.onclick();
  assert.ok(calls.some(c => c.url?.includes('/report-1/export?format=csv')));
  assert.ok(calls.some(c => c.downloaded));
  await review.onsubmit({ preventDefault() {} });
  const posted = calls.find(c => c.url?.endsWith('/report-1/review'));
  assert.equal(JSON.parse(posted.options.body).notes, 'Checked totals.');
  assert.equal(posted.options.headers.Authorization, 'Bearer test');
  assert.equal(dialog.open, false); assert.match(host.innerHTML, /reviewed/);
});
test('Finance Executive history opens sent reports without admin review controls', async () => {
  const { context, host, view, dialog } = setup(false);
  await context.window.EventFlowReportInbox.mount(host);
  assert.match(host.innerHTML, /Sent Reports/);
  await view.onclick();
  assert.match(dialog.innerHTML, /Awaiting Super Admin review/);
  assert.doesNotMatch(dialog.innerHTML, /data-review/);
});
test('admin runtime loads the inbox in Revenue Reports and combined scripts parse', () => {
  const adminSource = fs.readFileSync(path.join(__dirname, '../src/apps/admin/runtime.js'), 'utf8');
  assert.match(adminSource, /EventFlowReportInbox\.mount\(inbox, \{ admin: true \}\)/);
  assert.doesNotThrow(() => new vm.Script(source + '\n' + adminSource));
});
