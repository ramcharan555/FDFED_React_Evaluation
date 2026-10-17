const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const shared = fs.readFileSync(path.join(__dirname, '../src/services/support-reports.js'), 'utf8');
const runtime = fs.readFileSync(path.join(__dirname, '../src/apps/employee1/runtime.js'), 'utf8');
function section(source, from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, from);
  return source.slice(start, end);
}
function element(extra = {}) {
  return { innerHTML: '', textContent: '', disabled: false, value: '', dataset: {}, listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    async click() { return this.listeners.click?.({ currentTarget: this }); }, ...extra };
}
function harness() {
  const user = { id: 'agent-1', role: 'staff', employeeType: 'SUPPORT_EXECUTIVE', token: 'agent-token', name: 'Support Agent' };
  const server = { reports: [], calls: [], fail: false };
  const fields = { 'ser-category': 'Support & Issue Summary', 'ser-title': 'October customer support', 'ser-scope': 'Platform Wide', 'ser-period': 'October 2026', 'ser-summary': 'Resolved 12 requests.' };
  const state = { closed: 0, saved: 0, toasts: [], modal: '' };
  const db = { users: [], events: [], regReports: [], eventOpsReports: [], supportExecReports: [] };
  const context = vm.createContext({ window: {}, FormData, Blob, console, CU: user, DB: db,
    v: id => fields[id] || '', saveDB: () => state.saved++, closeModal: () => state.closed++,
    toast: (...args) => state.toasts.push(args), renderPage: async () => {},
    openModal() {}, document: { getElementById: () => null },
    fetch: async (url, options = {}) => {
      server.calls.push({ url, options });
      assert.equal(options.headers.Authorization, 'Bearer agent-token');
      const response = (status, data) => ({ ok: status < 400, status, json: async () => structuredClone(data) });
      if (server.fail) return response(503, { message: 'Report service unavailable' });
      const route = url.slice('http://localhost:3001/api/reports/support'.length);
      if (options.method === 'POST' && route === '') {
        const form = options.body;
        assert.ok(form instanceof FormData);
        const sourceReference = form.get('sourceReference');
        let report = server.reports.find(report => report.sourceReference === sourceReference);
        if (!report) {
          report = { ...Object.fromEntries(form.entries()), reportId: `SER-server-${server.reports.length + 1}`, author: user.name,
            authorEmail: 'support@example.com', submittedBy: user.id, hasDocument: form.has('file'),
            documentName: form.get('file')?.name, updatedAt: '2026-10-17T10:00:00Z', submittedAt: '2026-10-17T10:00:00Z' };
          delete report.file;
          server.reports.push(report);
        }
        return response(201, report);
      }
      const report = server.reports.find(report => route.includes(report.reportId));
      if (options.method === 'POST') { report.status = 'submitted'; return response(200, report); }
      if (options.method === 'PATCH') { report.status = 'reviewed'; report.reviewFeedback = JSON.parse(options.body).feedback; return response(200, report); }
      return response(200, route ? report : server.reports);
    },
  });
  vm.runInContext(shared, context);
  vm.runInContext(section(runtime, '    function getAllReportsList()', '    function pageReportsAndAnalytics()'), context);
  vm.runInContext(section(runtime, '    function openCreateSupportExecutiveReportModal()', '    function dashRegistrationVerification()'), context);
  context.window.openModal = (_title, markup) => { state.modal = markup; };
  return { context, service: context.window.EventFlowSupportReports, user, db, fields, state, server };
}

test('Support Executive submits report details and the selected file to the backend before showing success', async () => {
  const h = harness();
  h.context.openCreateSupportExecutiveReportModal();
  const file = new Blob(['%PDF-1.4 report'], { type: 'application/pdf' });
  Object.defineProperty(file, 'name', { value: 'Support report.pdf' });
  h.context.handleSerFileSelect({ files: [file] });
  await h.context.saveSupportExecutiveReport(true);
  const call = h.server.calls[0];
  assert.equal(call.options.body.get('title'), h.fields['ser-title']);
  assert.equal(call.options.body.get('status'), 'submitted');
  assert.equal(await call.options.body.get('file').text(), '%PDF-1.4 report');
  assert.equal(h.db.supportExecReports[0].backendReportId, 'SER-server-1');
  assert.equal(h.db.supportExecReports[0].status, 'Submitted');
  assert.equal(h.state.closed, 1);
  assert.match(h.state.toasts.at(-1)[0], /Admin can now view/);
  const before = JSON.stringify(h.db);
  h.server.fail = true;
  h.context.openCreateSupportExecutiveReportModal();
  await h.context.saveSupportExecutiveReport(true);
  assert.equal(JSON.stringify(h.db), before);
  assert.equal(h.state.closed, 1, 'A failed request must leave the form open');
  assert.equal(h.fields['ser-summary'], 'Resolved 12 requests.');
  assert.match(h.state.toasts.at(-1)[0], /unavailable/);
});

test('draft submission updates the actual stored report only after the server succeeds', async () => {
  const h = harness();
  h.context.openCreateSupportExecutiveReportModal();
  await h.context.saveSupportExecutiveReport(false);
  const draft = h.db.supportExecReports[0];
  assert.equal(draft.status, 'Draft');
  h.server.fail = true;
  await h.context.submitReportToAdminDirect(draft.id);
  assert.equal(draft.status, 'Draft');
  h.server.fail = false;
  await h.context.submitReportToAdminDirect(draft.id);
  assert.equal(draft.status, 'Submitted');
  assert.ok(h.server.calls.some(call => call.url.endsWith('/SER-server-1/submit')));
  h.server.reports[0].status = 'reviewed';
  h.server.reports[0].reviewFeedback = 'Reviewed by admin.';
  await h.context.syncSupportExecutiveReports();
  assert.equal(h.db.supportExecReports[0].reviewFeedback, 'Reviewed by admin.');
});

test('previously sent browser reports migrate once while other users and demo reports are preserved', async () => {
  const h = harness();
  h.db.supportExecReports.push({ id: 'SER-old', title: 'Earlier report', category: 'Support & Issue Summary', summary: 'Existing report findings', status: 'Submitted', author: h.user.name },
    { id: 'SER-other', title: 'Another user report', status: 'Submitted', author: 'Other Support Agent' });
  h.db.regReports.push({ id: 'demo-1', title: 'Demo registration audit', status: 'Submitted' });
  await h.context.syncSupportExecutiveReports();
  await h.context.syncSupportExecutiveReports();
  assert.equal(h.server.reports.length, 1);
  assert.equal(h.server.reports[0].sourceReference, 'legacy:SER-old');
  assert.equal(h.server.reports[0].hasDocument, false, 'Old filenames must not be presented as uploaded files');
  assert.ok(h.db.supportExecReports.some(report => report.id === 'SER-other'));
  assert.ok(h.db.regReports.some(report => report.id === 'demo-1'));
  assert.equal(h.context.getAllReportsList().some(report => report.id === 'SER-other'), false);
});

test('admin report cards filter submissions and open the real report and review controls', async () => {
  const h = harness();
  h.context.openCreateSupportExecutiveReportModal();
  await h.context.saveSupportExecutiveReport(true);
  h.server.reports.push({ ...h.server.reports[0], reportId: 'SER-reviewed', title: 'Venue report', status: 'reviewed' });
  const nodes = {};
  for (const selector of ['[data-reports-refresh]', '[data-reports-content]', '[data-reports-notice]', '[data-reports-search]', '[data-reports-status]', '[data-report-grid]']) nodes[selector] = element();
  let views = [];
  Object.defineProperty(nodes['[data-report-grid]'], 'innerHTML', { get() { return this.markup; }, set(markup) {
    this.markup = markup;
    views = Array.from(markup.matchAll(/data-report-view="([^"]+)"/g), match => element({ dataset: { reportView: match[1] } }));
  } });
  const container = element({ querySelector: selector => nodes[selector], querySelectorAll: selector => selector === '[data-report-view]' ? views : [] });
  const modalNodes = { '[data-report-feedback]': element(), '[data-report-review]': element(), '#admin-report-feedback': element() };
  h.context.document.getElementById = () => ({ querySelector: selector => modalNodes[selector] || null });
  await h.service.renderAdmin(container, h.user);
  assert.match(container.innerHTML, /Reports submitted by Support Executives/);
  assert.match(nodes['[data-report-grid]'].innerHTML, /October customer support/);
  assert.match(nodes['[data-report-grid]'].innerHTML, /Venue report/);
  nodes['[data-reports-status]'].value = 'submitted';
  nodes['[data-reports-status]'].listeners.change();
  assert.equal(views.length, 1);
  await views[0].click();
  assert.match(h.state.modal, /Resolved 12 requests/);
  assert.match(h.state.modal, /No document attached/);
  assert.match(h.state.modal, /Mark Reviewed/);
  modalNodes['#admin-report-feedback'].value = 'Thanks, reviewed.';
  await modalNodes['[data-report-review]'].click();
  assert.equal(h.server.reports[0].status, 'reviewed');
  assert.equal(h.server.reports[0].reviewFeedback, 'Thanks, reviewed.');
  assert.match(modalNodes['[data-report-feedback]'].textContent, /Review saved/);
  nodes['[data-reports-search]'].value = 'unmatched';
  nodes['[data-reports-search]'].listeners.input();
  assert.match(nodes['[data-report-grid]'].innerHTML, /No submitted reports match/);
});
