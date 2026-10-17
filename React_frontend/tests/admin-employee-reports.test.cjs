const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../src/apps');
const admin = fs.readFileSync(path.join(root, 'admin/app/runtime.js'), 'utf8');

test('Super Admin settings and employee inbox have explicit routes', () => {
  assert.match(admin, /pg === 'settings' \|\| pg === 'profile'/);
  assert.match(admin, /pg === 'employee-reports'/);
  assert.match(admin, /lbl: 'Employee Reports', pg: 'employee-reports'/);
  const superuserNav = admin.slice(admin.indexOf('superuser: ['), admin.indexOf('organizer: [', admin.indexOf('superuser: [')));
  assert.doesNotMatch(superuserNav, /lbl: 'Settings'/);
});

test('employee inbox receives submitted reports, excludes drafts, and saves review state', () => {
  const source = admin.slice(admin.indexOf('let employeeReportFilter ='), admin.indexOf('function dashEmployee()'));
  const db = {
    regReports: [{ id: 'r1', title: 'Registrations', owner: 'Arjun', status: 'Submitted' }, { id: 'r2', title: 'Draft', status: 'Draft' }],
    eventOpsReports: [{ id: 'e1', title: 'Event activity', owner: 'Elena', status: 'Pending Review' }],
    operationalReports: [{ id: 'f1', title: 'Finance review', owner: 'Marcus', status: 'Submitted' }],
    supportExecReports: [],
  };
  let saved = 0;
  const context = vm.createContext({ DB: db, adminChartText: String, saveDB: () => saved++, closeModal() {}, renderPage() {}, toast() {}, today: () => '2026-10-17', openModal() {}, v: () => '' });
  vm.runInContext(source, context);
  const html = context.pageEmployeeReports();
  assert.match(html, /Registrations/);
  assert.match(html, /Event activity/);
  assert.match(html, /Finance review/);
  assert.doesNotMatch(html, />Draft</);
  context.markEmployeeReportReviewed(0);
  assert.equal(db.regReports[0].status, 'Reviewed');
  assert.equal(saved, 1);
});

test('Finance Executive sends selected report filters to the persistent portal', async () => {
  const finance = fs.readFileSync(path.join(root, 'finance-executive/utils/finance-workspace.js'), 'utf8');
  const source = finance.slice(finance.indexOf('function financeOpenSubmitReport()'), finance.indexOf('async function financeDetail('));
  let request;
  const context = vm.createContext({ v: id => id.endsWith('title') ? 'October review' : 'Payments reconciled with no exceptions.', apiRequest: async (path, options) => { request = { path, body: JSON.parse(options.body) }; }, financeQuery: () => 'from=2026-10-01&eventId=evt-1', financeFilters: { reportType: 'transactions' }, URLSearchParams, closeModal() {}, toast() {}, renderPage() {}, openModal() {} });
  vm.runInContext(source, context);
  await context.financeSubmitReport();
  assert.equal(request.path, '/finance/submissions');
  assert.equal(request.body.reportType, 'transactions');
  assert.equal(request.body.filters.eventId, 'evt-1');
});

test('Finance Executive sent reports portal shows status and review feedback', () => {
  const finance = fs.readFileSync(path.join(root, 'finance-executive/utils/finance-workspace.js'), 'utf8');
  const source = `let financeSentReports=[{id:'fin-1',title:'October review',reportType:'transactions',metrics:{recordCount:3},createdAt:'2026-10-17',status:'Reviewed',feedback:'Approved.'}];let financeSentStatus='all';let financeSentPage=1;\n` + finance.slice(finance.indexOf('function financeReportPortal()'), finance.indexOf('function financeSetSentStatus('));
  const context = vm.createContext({ financeEscape: String, financeDate: String });
  vm.runInContext(source, context);
  const html = context.financeReportPortal();
  assert.match(html, /Send Report to Super Admin/);
  assert.match(html, /Sent Reports/);
  assert.match(html, /Approved\./);
});
