const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function workspace() {
  const source = fs.readFileSync(path.join(__dirname, '../src/apps/employee3/finance-workspace.js'), 'utf8');
  const nav = { innerHTML: '' };
  const ui = vm.createContext({
    window: { addEventListener() {} },
    document: { querySelectorAll: () => [] },
    g: id => id === 'sb-nav' ? nav : null,
    _currentPage: 'dashboard',
  });
  vm.runInContext(source, ui);
  return { ui, nav };
}

test('finance menu excludes settlements and account settings', () => {
  const { ui, nav } = workspace();
  ui.financeNav();
  assert.match(nav.innerHTML, /Commission & Revenue/);
  assert.doesNotMatch(nav.innerHTML, /Organizer Settlements|Account Settings/);
});

test('commission page labels all sample figures as demo data', () => {
  const { ui } = workspace();
  const page = ui.financeDemoPage();
  assert.match(page, /DEMO DATA/);
  assert.match(page, /12% \(demo\)/);
  assert.match(page, /Orion Music Night/);
  assert.doesNotMatch(page, /Account Settings|Organizer Settlements/);
});

test('dashboard charts render supplied financial values and empty states', () => {
  const { ui } = workspace();
  assert.match(ui.financeAreaChart([{ date: '2026-10-01', revenue: 100 }, { date: '2026-10-02', revenue: 200 }]), /<svg/);
  assert.match(ui.financeStatusDonut([{ status: 'completed', count: 3 }, { status: 'failed', count: 1 }]), /conic-gradient/);
  assert.match(ui.financeRefundTrend([{ date: '2026-10-02', requested: 100, completed: 50 }]), /Requested/);
  assert.match(ui.financeAreaChart([]), /No revenue/);
});
