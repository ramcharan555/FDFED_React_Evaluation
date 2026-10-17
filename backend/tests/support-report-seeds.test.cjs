const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('sample reports populate the admin inbox and upgrade saved data without replacing reports or reviews', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-report-seeds-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  const file = path.join(directory, 'store.json');
  process.env.EVENTFLOW_DATA_FILE = file;
  const { DataStore } = require('../src/common/data-store');
  const { UserRole } = require('../src/common/constants');
  const { SupportReportsService } = require('../src/modules/reports/support-reports.service');
  DataStore.instance = undefined;
  t.after(() => {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-report-seeds-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const inbox = new SupportReportsService().list('usr-admin-001', UserRole.SUPER_ADMIN);
  assert.equal(inbox.length, 6);
  assert.equal(new Set(inbox.map(report => report.category)).size, 3);
  assert.equal(inbox.filter(report => report.status === 'submitted').length, 4);
  assert.equal(inbox.filter(report => report.status === 'reviewed').length, 2);
  for (const report of inbox) {
    assert.match(report.title, /\(Sample\)/);
    assert.ok(report.authorEmail);
    assert.ok(report.submittedAt instanceof Date);
    assert.equal(report.hasDocument, false);
  }

  // Simulate an older installation with a real report and an already reviewed sample.
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  const reviewedSample = { ...saved.supportExecutiveReports[0], status: 'reviewed',
    reviewedBy: 'usr-admin-001', reviewFeedback: 'Keep this review.', reviewedAt: '2026-10-17T08:00:00Z' };
  const authoredReport = { ...reviewedSample, reportId: 'SER-user-authored', sourceReference: 'form:custom',
    title: 'Actual customer support findings', summary: 'Keep these findings.' };
  saved.supportExecutiveReports = [authoredReport, reviewedSample];
  delete saved.supportReportSeedVersion;
  fs.writeFileSync(file, JSON.stringify(saved));
  DataStore.instance = undefined;
  const upgraded = DataStore.getInstance();
  assert.equal(upgraded.supportExecutiveReports.length, 7);
  assert.equal(upgraded.supportExecutiveReports.find(report => report.reportId === authoredReport.reportId).summary, authoredReport.summary);
  assert.equal(upgraded.supportExecutiveReports.find(report => report.reportId === reviewedSample.reportId).reviewFeedback, reviewedSample.reviewFeedback);
  assert.equal(upgraded.supportExecutiveReports.find(report => report.reportId === reviewedSample.reportId).status, 'reviewed');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).supportReportSeedVersion, 1);

  const beforeReload = JSON.stringify(upgraded.supportExecutiveReports);
  DataStore.instance = undefined;
  assert.equal(JSON.stringify(DataStore.getInstance().supportExecutiveReports), beforeReload, 'Reloading must not duplicate samples or reset reviews');
});
