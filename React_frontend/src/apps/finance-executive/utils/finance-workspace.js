// Finance Executive pages. Loaded into the existing employee runtime so its shell,
// notifications, sign-out and visual system stay intact.
let financeFilters = { range: 'last30', from: '', to: '', search: '', status: '', eventId: '', organizerId: '', paymentMethod: '', sort: 'date', direction: 'desc', page: 1, reportType: 'transactions', granularity: 'daily' };
let financeRequestId = 0;
let financeSentReports = [];
let financeSentStatus = 'all';
let financeSentPage = 1;

function financeEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function financeMoney(value) { return value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value); }
function financeDate(value) { return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'; }
function financeQuery(extra = {}) {
  const f = { ...financeFilters, ...extra };
  const params = new URLSearchParams();
  const now = new Date();
  let from = f.from, to = f.to;
  if (f.range !== 'custom' && f.range !== 'all') {
    const start = new Date(now);
    if (f.range === 'today') start.setHours(0, 0, 0, 0);
    else if (f.range === 'last7') start.setDate(start.getDate() - 6);
    else if (f.range === 'last30') start.setDate(start.getDate() - 29);
    else if (f.range === 'thisMonth') start.setDate(1);
    from = start.toISOString(); to = now.toISOString();
  }
  if (f.range === 'all') { from = ''; to = ''; }
  for (const [key, value] of Object.entries({ ...f, from, to })) {
    if (['range', 'reportType', 'granularity'].includes(key) || value == null || value === '') continue;
    params.set(key, String(value));
  }
  return params.toString();
}
function financeSet(key, value) {
  financeFilters[key] = value;
  if (key === 'reportType') financeFilters.status = '';
  if (key !== 'page') financeFilters.page = 1;
  renderPage(_currentPage);
}
function financeNavigate(page, push = true) {
  if (!['dashboard', 'transactions', 'refunds', 'commissions', 'reconciliation', 'reports'].includes(page)) page = 'dashboard';
  if (push) {
    const url = new URL(location.href);
    url.searchParams.set('financePage', page);
    history.pushState({ financePage: page }, '', url);
  }
  _currentPage = page;
  document.querySelectorAll('.sb-item').forEach(el => el.classList.toggle('active', el.dataset.pg === page || (['transactions', 'refunds', 'commissions', 'reconciliation'].includes(page) && el.dataset.pg === 'finance')));
  updateHeaderUser();
  renderPage(page).catch(error => console.error(error));
}
window.addEventListener('popstate', () => {
  if (!CU || !['SUPPORT_FINANCE', 'FINANCE_EXECUTIVE'].includes(CU.employeeType)) return;
  financeNavigate(new URLSearchParams(location.search).get('financePage') || 'dashboard', false);
});
let financeMenuOpen = true;
function financeNav() {
  const children = [['transactions', '💳', 'Payment Transactions'], ['refunds', '↩️', 'Refund Management'], ['commissions', '📈', 'Commission & Revenue'], ['reconciliation', '🔍', 'Payment Reconciliation']];
  g('sb-nav').innerHTML = '<div class="sb-section-lbl">Main Menu</div>' +
    `<div class="sb-item" data-pg="dashboard" onclick="financeNavigate('dashboard')"><span class="ic">📊</span><span>Dashboard</span></div>` +
    `<div class="sb-item" data-pg="finance" onclick="financeToggleMenu()"><span class="ic">💳</span><span>Finance</span><span style="margin-left:auto">` + (financeMenuOpen ? '▾' : '▸') + '</span></div>' +
    (financeMenuOpen ? children.map(([pg, icon, label]) => `<div class="sb-item finance-subitem" data-pg="${pg}" onclick="financeNavigate('${pg}')"><span class="ic">${icon}</span><span>${label}</span></div>`).join('') : '') +
    `<div class="sb-item" data-pg="reports" onclick="financeNavigate('reports')"><span class="ic">📋</span><span>Reports</span></div>`;
  document.querySelectorAll('.sb-item').forEach(el => el.classList.toggle('active', el.dataset.pg === _currentPage || (['transactions','refunds','commissions','reconciliation'].includes(_currentPage) && el.dataset.pg === 'finance')));
}
function financeToggleMenu() { financeMenuOpen = !financeMenuOpen; financeNav(); }
function financeHeader(title, subtitle, refresh = true) {
  return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">${title}</div><div class="page-sub">${subtitle}</div></div>${refresh ? `<div class="page-hd-right"><button class="btn btn-ghost" onclick="renderPage(_currentPage)">↻ Refresh</button></div>` : ''}</div>`;
}
function financeRanges() {
  return `<div class="filter-row finance-filters"><label>Date range <select class="form-control" onchange="financeSet('range',this.value)">${[['today','Today'],['last7','Last 7 Days'],['last30','Last 30 Days'],['thisMonth','This Month'],['custom','Custom'],['all','All Time']].map(([value,label]) => `<option value="${value}" ${financeFilters.range === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${financeFilters.range === 'custom' ? `<label>From <input class="form-control" type="date" value="${financeEscape(financeFilters.from)}" onchange="financeSet('from',this.value)"></label><label>To <input class="form-control" type="date" value="${financeEscape(financeFilters.to)}" onchange="financeSet('to',this.value)"></label>` : ''}</div>`;
}
function financeStat(label, value) { return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`; }
function financeProviderBanner() { return '<div class="finance-provider-banner">Demo provider only. Payments are simulated; live gateway reconciliation and payouts are unavailable.</div>'; }
function financeReportPortal() {
  const filtered = financeSentReports.map((report, index) => ({ report, index })).filter(({ report }) => financeSentStatus === 'all' || report.status.toLowerCase() === financeSentStatus);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 5));
  financeSentPage = Math.min(financeSentPage, pageCount);
  const shown = filtered.slice((financeSentPage - 1) * 5, financeSentPage * 5);
  return `<div class="card finance-send-portal"><div class="h4 mb-12">Send this report to Super Admin</div><p class="small muted mb-16">Send all records matching the applied filters as a saved report. Review status and feedback appear below.</p><button class="btn btn-primary" onclick="financeOpenSubmitReport()">Send Report to Super Admin</button></div>
    <div class="card finance-sent-portal"><div class="flex justify-between items-center mb-16"><div><div class="h4">Sent Reports</div><p class="small muted">Track delivery and review feedback from Super Admin.</p></div><button class="btn btn-ghost btn-sm" onclick="renderPage('reports')">Refresh reports</button></div><label class="finance-sent-filter">Status <select class="form-control" onchange="financeSetSentStatus(this.value)"><option value="all" ${financeSentStatus === 'all' ? 'selected' : ''}>All reports</option><option value="submitted" ${financeSentStatus === 'submitted' ? 'selected' : ''}>Submitted</option><option value="reviewed" ${financeSentStatus === 'reviewed' ? 'selected' : ''}>Reviewed</option></select></label>
    ${shown.length ? `<div class="table-wrap"><table><thead><tr><th>Report</th><th>Type</th><th>Records</th><th>Sent</th><th>Status</th><th>Feedback</th><th></th></tr></thead><tbody>${shown.map(({ report, index }) => `<tr><td><strong>${financeEscape(report.title)}</strong><div class="small muted">${financeEscape(report.id)}</div></td><td>${financeEscape(report.reportType)}</td><td>${report.metrics.recordCount}</td><td>${financeDate(report.createdAt)}</td><td><span class="badge badge-${report.status === 'Reviewed' ? 'green' : 'purple'}">${financeEscape(report.status)}</span></td><td>${financeEscape(report.feedback || 'Awaiting review')}</td><td><button class="btn btn-ghost btn-xs" onclick="financeViewSentReport(${index})">View</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No submitted finance reports found.</div>'}
    <div class="finance-sent-pagination"><span>${filtered.length} reports · Page ${financeSentPage} of ${pageCount}</span><div><button class="btn btn-ghost btn-sm" ${financeSentPage <= 1 ? 'disabled' : ''} onclick="financeChangeSentPage(-1)">Previous</button><button class="btn btn-ghost btn-sm" ${financeSentPage >= pageCount ? 'disabled' : ''} onclick="financeChangeSentPage(1)">Next</button></div></div></div>`;
}
function financeSetSentStatus(value) { financeSentStatus = ['all', 'submitted', 'reviewed'].includes(value) ? value : 'all'; financeSentPage = 1; renderPage('reports'); }
function financeChangeSentPage(delta) { financeSentPage = Math.max(1, financeSentPage + delta); renderPage('reports'); }
function financeViewSentReport(index) {
  const report = financeSentReports[index];
  if (!report) return;
  openDrawer('Sent Finance Report', `<div class="info-row"><span class="info-label">Title</span><span class="info-value">${financeEscape(report.title)}</span></div><div class="info-row"><span class="info-label">Type</span><span class="info-value">${financeEscape(report.reportType)}</span></div><div class="info-row"><span class="info-label">Status</span><span class="info-value">${financeEscape(report.status)}</span></div><div class="info-row"><span class="info-label">Records sent</span><span class="info-value">${report.metrics.recordCount}</span></div><div class="info-row"><span class="info-label">Sent</span><span class="info-value">${financeDate(report.createdAt)}</span></div><div class="h4 mt-20 mb-8">Summary</div><p>${financeEscape(report.summary)}</p><div class="h4 mt-20 mb-8">Super Admin feedback</div><p>${financeEscape(report.feedback || 'Awaiting review.')}</p>`);
}
function financeAreaChart(rows) {
  if (!rows?.length) return '<div class="empty">No revenue in this date range.</div>';
  const points = rows.slice(-18);
  const max = Math.max(...points.map(row => Number(row.revenue) || 0), 1);
  const x = index => 36 + index * (648 / Math.max(points.length - 1, 1));
  const y = value => 198 - (Number(value) || 0) / max * 158;
  const line = points.map((row, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(row.revenue).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(points.length - 1)} 198 L 36 198 Z`;
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  return `<div class="finance-chart-scroll"><svg class="finance-area-chart" viewBox="0 0 720 240" role="img" aria-label="Revenue trend chart"><defs><linearGradient id="financeAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9d8cff" stop-opacity=".52"/><stop offset="100%" stop-color="#9d8cff" stop-opacity=".03"/></linearGradient></defs><line x1="36" y1="198" x2="684" y2="198" stroke="#566079" stroke-width="1"/><line x1="36" y1="119" x2="684" y2="119" stroke="#566079" stroke-opacity=".28" stroke-dasharray="4 5"/><path d="${area}" fill="url(#financeAreaFill)"/><path d="${line}" fill="none" stroke="#ae9fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map((row,index)=>`<circle cx="${x(index)}" cy="${y(row.revenue)}" r="4" fill="#c9c0ff"><title>${financeEscape(row.date)}: ${financeMoney(row.revenue)}</title></circle>`).join('')}${labels.map(index=>`<text x="${x(index)}" y="225" text-anchor="middle" fill="#aab2c4" font-size="11">${financeEscape(points[index].date)}</text>`).join('')}</svg></div>`;
}
function financeStatusDonut(rows) {
  const colors = { completed: '#32d5aa', pending: '#e8bd62', failed: '#f16e7d', refunded: '#9d8cff' };
  const total = (rows || []).reduce((sum,row)=>sum + Number(row.count || 0),0);
  if (!total) return '<div class="empty">No payment activity in this date range.</div>';
  let start = 0;
  const stops = rows.map(row=>{ const end = start + (Number(row.count || 0) / total * 100); const stop = `${colors[row.status] || '#76839f'} ${start}% ${end}%`; start = end; return stop; });
  return `<div class="finance-donut-layout"><div class="finance-donut" style="background:conic-gradient(${stops.join(',')})" role="img" aria-label="Payment status breakdown"><div><strong>${total}</strong><span>Payments</span></div></div><div class="finance-donut-legend">${rows.map(row=>`<div><i style="background:${colors[row.status] || '#76839f'}"></i><span>${financeEscape(row.status)}</span><strong>${row.count}</strong></div>`).join('')}</div></div>`;
}
function financeEventBars(rows) {
  if (!rows?.length) return '<div class="empty">No event revenue in this date range.</div>';
  const max = Math.max(...rows.map(row=>row.revenue),1);
  return `<div class="finance-event-bars">${rows.slice(0,8).map(row=>`<div><div class="finance-event-bar-label"><span>${financeEscape(row.eventName)}</span><strong>${financeMoney(row.revenue)}</strong></div><div class="finance-event-bar-track"><i style="width:${Math.max(2,Math.round(row.revenue/max*100))}%"></i></div></div>`).join('')}</div>`;
}
function financeBars(rows, labelKey, valueKey) {
  if (!rows || !rows.length) return '<div class="empty">No financial activity for this range.</div>';
  const max = Math.max(...rows.map(row => Number(row[valueKey]) || 0), 1);
  return `<div class="finance-bars">${rows.map(row => `<div class="finance-bar-row"><span>${financeEscape(row[labelKey])}</span><div class="finance-bar-track"><i style="width:${Math.max(2, Math.round((Number(row[valueKey]) || 0) / max * 100))}%"></i></div><strong>${financeMoney(row[valueKey])}</strong></div>`).join('')}</div>`;
}
function financeRefundTrend(rows) {
  if (!rows || !rows.length) return '<div class="empty">No refund activity for this range.</div>';
  const points = rows.slice(-12);
  const max = Math.max(...points.flatMap(row => [row.requested, row.completed]), 1);
  const step = 648 / points.length;
  const bar = (value, x, color, title) => `<rect x="${x.toFixed(1)}" y="${(198-value/max*160).toFixed(1)}" width="${Math.min(step*.28,22).toFixed(1)}" height="${(value/max*160).toFixed(1)}" rx="4" fill="${color}"><title>${financeEscape(title)}: ${financeMoney(value)}</title></rect>`;
  return `<div class="finance-chart-legend"><span><i style="background:#9d8cff"></i>Requested</span><span><i style="background:#32d5aa"></i>Completed</span></div><div class="finance-chart-scroll"><svg class="finance-area-chart" viewBox="0 0 720 240" role="img" aria-label="Refund requested and completed chart"><line x1="36" y1="198" x2="684" y2="198" stroke="#566079"/>${points.map((row,index)=>{const center=36+step*(index+.5);return bar(row.requested,center-Math.min(step*.3,24),'#9d8cff',row.date+' requested')+bar(row.completed,center+2,'#32d5aa',row.date+' completed')+`<text x="${center}" y="225" text-anchor="middle" fill="#aab2c4" font-size="10">${financeEscape(row.date.slice(5))}</text>`;}).join('')}</svg></div>`;
}
function financeTrend(rows) {
  const granularity = financeFilters.granularity;
  const groups = new Map();
  for (const row of rows || []) {
    const date = new Date(row.date + 'T00:00:00');
    const week = new Date(date); week.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const key = granularity === 'yearly' ? row.date.slice(0,4) : granularity === 'monthly' ? row.date.slice(0,7) : granularity === 'weekly' ? week.toISOString().slice(0,10) : row.date;
    groups.set(key, (groups.get(key) || 0) + row.revenue);
  }
  return [...groups].map(([date, revenue]) => ({ date, revenue }));
}
const financeCommissionDemo = [
  { event: 'Orion Music Night', organizer: 'Orion Events', tickets: 420, gross: 840000, refunds: 40000 },
  { event: 'Tech Frontiers Expo', organizer: 'Frontiers Collective', tickets: 300, gross: 600000, refunds: 20000 },
  { event: 'City Food Carnival', organizer: 'City Bites', tickets: 250, gross: 375000, refunds: 15000 },
  { event: 'Art Week Live', organizer: 'Canvas Studio', tickets: 180, gross: 270000, refunds: 10000 },
  { event: 'Startup Meetup', organizer: 'Launch Room', tickets: 150, gross: 150000, refunds: 0 },
].map(row => ({ ...row, net: row.gross - row.refunds, commission: Math.round((row.gross - row.refunds) * 12 / 100), organizerShare: Math.round((row.gross - row.refunds) * 88 / 100) }));
function financeDemoPage() {
  const rows = financeCommissionDemo;
  const sum = key => rows.reduce((total,row)=>total + row[key],0);
  return financeHeader('Commission & Revenue', 'Illustrative sample for previewing commission reporting.', false) + `<div class="finance-demo-banner"><strong>DEMO DATA</strong><span>These figures are examples only. They are not connected to EventFlow payments or an approved commission policy.</span></div><div class="grid-4 finance-stats mb-20">${financeStat('Sample Gross Revenue',financeMoney(sum('gross')))}${financeStat('Sample Refunds',financeMoney(sum('refunds')))}${financeStat('Sample Net Revenue',financeMoney(sum('net')))}${financeStat('Sample Commission · 12%',financeMoney(sum('commission')))}</div><div class="grid-2 mb-20"><div class="card"><div class="h4 mb-14">Net Revenue by Event</div>${financeEventBars(rows.map(row=>({eventName:row.event,revenue:row.net})))}</div><div class="card"><div class="h4 mb-14">Commission by Event</div>${financeEventBars(rows.map(row=>({eventName:row.event,revenue:row.commission})))}</div></div><div class="card"><div class="h4 mb-14">Illustrative Breakdown</div><div class="table-wrap"><table><thead><tr><th>Event</th><th>Organizer</th><th>Tickets</th><th>Gross</th><th>Refunds</th><th>Net</th><th>Demo Rate</th><th>Commission</th><th>Organizer Share</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${financeEscape(row.event)}</td><td>${financeEscape(row.organizer)}</td><td>${row.tickets}</td><td>${financeMoney(row.gross)}</td><td>${financeMoney(row.refunds)}</td><td>${financeMoney(row.net)}</td><td>12% (demo)</td><td>${financeMoney(row.commission)}</td><td>${financeMoney(row.organizerShare)}</td></tr>`).join('')}</tbody></table></div><p class="small muted mt-14">Demo formula: (gross revenue − refunds) × 12%. These sample figures do not initiate payments.</p></div>`;
}
async function financeRender(page) {
  const el = g('page-content');
  const id = ++financeRequestId;
  el.innerHTML = `<div class="finance-loading"><div class="finance-skeleton"></div><div class="finance-skeleton"></div><div class="finance-skeleton"></div></div>`;
  try {
    let html = '';
    if (page === 'dashboard') {
      const data = await apiRequest('/finance/overview?' + financeQuery());
      const t = data.totals;
        const activity = [...data.recentTransactions.map(row => ({ type: 'Payment', id: row.paymentId, date: row.createdAt, amount: row.amount, status: row.status, event: row.eventName, target: 'transactions' })), ...data.recentRefunds.map(row => ({ type: 'Refund', id: row.refundId, date: row.processedAt || row.requestedAt, amount: row.amount, status: row.status, event: row.eventName, target: 'refunds' }))].sort((a,b) => +new Date(b.date) - +new Date(a.date)).slice(0,10);
        html = financeHeader('Finance Dashboard', 'Amounts come from persisted payment and refund records.') + financeRanges() + `<div class="grid-4 finance-stats">${financeStat('Gross Ticket Revenue',financeMoney(t.grossRevenue))}${financeStat('Refunded Amount',financeMoney(t.refundedAmount))}${financeStat('Net Ticket Revenue',financeMoney(t.netRevenue))}${financeStat('Tickets Sold',t.ticketsSold)}${financeStat('Successful Payments',t.successfulPayments)}${financeStat('Failed Payments',t.failedPayments)}${financeStat('Pending Payments',t.pendingPayments)}${financeStat('Pending Refund Requests',t.pendingRefundRequests)}</div><div class="card mb-20"><div class="flex justify-between"><div class="h4">Revenue Trend</div><select class="form-control finance-granularity" onchange="financeSet('granularity',this.value)">${['daily','weekly','monthly','yearly'].map(x=>`<option ${financeFilters.granularity===x?'selected':''}>${x}</option>`).join('')}</select></div>${financeAreaChart(financeTrend(data.revenueTrend))}</div><div class="grid-2 mb-20"><div class="card"><div class="h4 mb-12">Payment Status</div>${financeStatusDonut(data.paymentStatuses)}</div><div class="card"><div class="h4 mb-12">Event Revenue</div>${financeEventBars(data.eventRevenue)}</div></div><div class="card mb-20"><div class="h4 mb-12">Refund Trend</div>${financeRefundTrend(data.refundTrend)}</div><div class="card"><div class="h4 mb-12">Recent Financial Activity</div>${activity.length ? activity.map(row=>`<button class="finance-activity" onclick="financeNavigate('${row.target}');financeDetail('${row.target}','${financeEscape(row.id)}')"><span><strong>${financeEscape(row.type)} · ${financeEscape(row.id)}</strong><small>${financeEscape(row.event)} · ${financeDate(row.date)}</small></span><span>${financeMoney(row.amount)} · ${financeEscape(row.status)}</span></button>`).join('') : '<div class="empty">No recent activity in this range.</div>'}</div><p class="small muted mt-14">The current payment provider is simulated. Revenue and refunds above reflect persisted demo-provider records.</p>`;
    } else if (page === 'commissions') {
      html = financeDemoPage();
    } else if (page === 'transactions' || page === 'refunds') {
      const data = await apiRequest(`/finance/${page}?` + financeQuery(page === 'refunds' ? { sort: 'newest' } : {}) + (page === 'refunds' ? '&range=custom' : ''));
      const rows = data.data || [];
      html = financeHeader(page === 'transactions' ? 'Payment Transactions' : 'Refund Management', page === 'transactions' ? 'Search and inspect persisted payment attempts.' : 'Review refund requests and their current processing status.') + financeRanges() + `<div class="filter-row finance-filters"><label>Search <input class="form-control" value="${financeEscape(financeFilters.search)}" placeholder="ID, attendee or event" onchange="financeSet('search',this.value)"></label><label>Status <select class="form-control" onchange="financeSet('status',this.value)"><option value="">All</option>${(page==='transactions'?['pending','completed','failed','refunded']:['pending','completed','failed','not_applicable']).map(x=>`<option value="${x}" ${financeFilters.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Event <select class="form-control" onchange="financeSet('eventId',this.value)"><option value="">All events</option>${(data.filters?.events||[]).map(x=>`<option value="${financeEscape(x.eventId)}" ${financeFilters.eventId===x.eventId?'selected':''}>${financeEscape(x.name)}</option>`).join('')}</select></label>${page==='transactions'?`<label>Method <select class="form-control" onchange="financeSet('paymentMethod',this.value)"><option value="">All methods</option>${(data.filters?.methods||[]).map(value=>`<option value="${financeEscape(value)}" ${financeFilters.paymentMethod===value?'selected':''}>${financeEscape(value)}</option>`).join('')}</select></label><label>Sort <select class="form-control" onchange="financeSet('sort',this.value)"><option value="date">Date</option><option value="amount" ${financeFilters.sort==='amount'?'selected':''}>Amount</option></select></label><label>Direction <select class="form-control" onchange="financeSet('direction',this.value)"><option value="desc">Newest / highest</option><option value="asc" ${financeFilters.direction==='asc'?'selected':''}>Oldest / lowest</option></select></label>`:''}<button class="btn btn-ghost" onclick="financeReset()">Reset</button></div><div class="card"><div class="table-wrap"><table><thead>${page==='transactions'?'<tr><th>Transaction</th><th>Booking</th><th>Event</th><th>Attendee</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th></th></tr>':'<tr><th>Refund</th><th>Booking</th><th>Event</th><th>Attendee</th><th>Payment</th><th>Requested</th><th>Reason</th><th>Status</th><th></th></tr>'}</thead><tbody>${rows.map(row=>page==='transactions'?`<tr><td class="mono">${financeEscape(row.paymentId)}</td><td>${financeEscape(row.registrationId)}</td><td>${financeEscape(row.eventName)}</td><td>${financeEscape(row.attendeeName)}</td><td>${financeMoney(row.amount)}</td><td>${financeEscape(row.paymentMethod)}</td><td>${financeEscape(row.status)}</td><td>${financeDate(row.createdAt)}</td><td><button class="btn btn-ghost btn-xs" onclick="financeDetail('transactions','${financeEscape(row.paymentId)}')">Details</button></td></tr>`:`<tr><td class="mono">${financeEscape(row.refundId)}</td><td>${financeEscape(row.registrationId)}</td><td>${financeEscape(row.eventName)}</td><td>${financeEscape(row.attendeeName)}</td><td>${financeMoney(row.originalPaymentAmount)}</td><td>${financeMoney(row.amount)}</td><td>${financeEscape(row.reason)}</td><td>${financeEscape(row.status)}</td><td><button class="btn btn-ghost btn-xs" onclick="financeDetail('refunds','${financeEscape(row.refundId)}')">Review</button></td></tr>`).join('') || `<tr><td colspan="9">No ${page} match these filters.</td></tr>`}</tbody></table></div><div class="finance-pager"><span>${data.pagination.total} records · page ${data.pagination.page} of ${data.pagination.totalPages || 1}</span><button class="btn btn-ghost btn-xs" ${data.pagination.page<=1?'disabled':''} onclick="financeSet('page',${data.pagination.page-1})">Previous</button><button class="btn btn-ghost btn-xs" ${data.pagination.page>=data.pagination.totalPages?'disabled':''} onclick="financeSet('page',${data.pagination.page+1})">Next</button></div></div>`;
    } else if (page === 'reconciliation') {
      const data = await apiRequest('/finance/' + page);
      html = financeHeader('Payment Reconciliation','Financial operations · INR · Asia/Kolkata') + financeProviderBanner() + financeRanges() + `<div class="card"><div class="h4 mb-12">Gateway reconciliation unavailable</div><p class="muted">${financeEscape(data.reason)} Checked, matched, and discrepancy totals require an independent payment source.</p></div>`;
    } else if (page === 'reports') {
      const params = new URLSearchParams(financeQuery()); params.set('type', financeFilters.reportType);
      const data = await apiRequest('/finance/reports?' + params);
      const keys = data.rows.length ? Object.keys(data.rows[0]).filter(x=>!['attendeeEmail','organizerId','eventId'].includes(x)) : [];
      html = financeHeader('Financial Reports','Reports are generated from all matching backend records.') + financeRanges() + `<div class="filter-row finance-filters"><label>Report <select class="form-control" onchange="financeSet('reportType',this.value)">${[['transactions','Payment Transactions'],['refunds','Refunds'],['events','Event Revenue'],['daily','Daily Revenue'],['monthly','Monthly Revenue']].map(([value,label])=>`<option value="${value}" ${financeFilters.reportType===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Event <select class="form-control" onchange="financeSet('eventId',this.value)"><option value="">All events</option>${data.options.events.map(row=>`<option value="${financeEscape(row.id)}" ${financeFilters.eventId===row.id?'selected':''}>${financeEscape(row.name)}</option>`).join('')}</select></label><label>Organizer <select class="form-control" onchange="financeSet('organizerId',this.value)"><option value="">All organizers</option>${data.options.organizers.map(row=>`<option value="${financeEscape(row.id)}" ${financeFilters.organizerId===row.id?'selected':''}>${financeEscape(row.name)}</option>`).join('')}</select></label>${['transactions','refunds'].includes(financeFilters.reportType)?`<label>Status <select class="form-control" onchange="financeSet('status',this.value)"><option value="">All statuses</option>${(financeFilters.reportType==='transactions'?['pending','completed','failed','refunded']:['pending','completed','failed','not_applicable']).map(value=>`<option value="${value}" ${financeFilters.status===value?'selected':''}>${value}</option>`).join('')}</select></label>`:''}<button class="btn btn-primary" onclick="financeDownloadCsv()">Download CSV</button><button class="btn btn-ghost" onclick="financeDownloadPdf()">Download PDF</button></div><div class="grid-4 mb-20">${financeStat('Gross Revenue',financeMoney(data.summary.grossRevenue))}${financeStat('Refunded',financeMoney(data.summary.refundedAmount))}${financeStat('Net Revenue',financeMoney(data.summary.netRevenue))}${financeStat('Matching Records',data.total)}</div><div class="card"><div class="small muted mb-12">Generated ${financeDate(data.generatedAt)} · ${data.total} rows</div><div class="table-wrap"><table><thead><tr>${keys.map(key=>`<th>${financeEscape(key)}</th>`).join('')}</tr></thead><tbody>${data.rows.slice(0,100).map(row=>`<tr>${keys.map(key=>`<td>${financeEscape(row[key])}</td>`).join('')}</tr>`).join('') || '<tr><td>No report records for these filters.</td></tr>'}</tbody></table></div>${data.total>100?'<div class="small muted">Showing first 100 rows. CSV includes all matching rows.</div>':''}</div>`;
      financeSentReports = await apiRequest('/finance/submissions');
      html += financeReportPortal();
    }
    if (id === financeRequestId && _currentPage === page) el.innerHTML = html;
  } catch (error) {
    if (id === financeRequestId && _currentPage === page) el.innerHTML = financeHeader('Finance', 'Unable to load current financial data.', false) + `<div class="card"><p>${financeEscape(error.message)}</p><button class="btn btn-primary" onclick="renderPage(_currentPage)">Retry</button></div>`;
  }
}
function financeReset() { financeFilters = { ...financeFilters, range: 'all', from: '', to: '', search: '', status: '', eventId: '', organizerId: '', paymentMethod: '', sort: 'date', direction: 'desc', page: 1 }; renderPage(_currentPage); }
function financeOpenSubmitReport() {
  openModal('Send Report to Super Admin', `<p class="small muted mb-16">This saves every record matching the current report type and filters for Super Admin review.</p><div class="form-group"><label class="form-label">Report title</label><input class="form-control" id="finance-report-title" placeholder="e.g. Monthly payment review"></div><div class="form-group"><label class="form-label">Summary for Super Admin</label><textarea class="form-control" id="finance-report-summary" rows="5" placeholder="Describe findings, exceptions, and follow-up actions"></textarea></div>`, [{ lbl: 'Send Report', cls: 'btn-primary', fn: 'financeSubmitReport()' }]);
}
let financeSubmitBusy = false;
async function financeSubmitReport() {
  if (financeSubmitBusy) return;
  const title = v('finance-report-title');
  const summary = v('finance-report-summary');
  if (title.length < 3) { toast('Enter a report title of at least 3 characters', 'error'); return; }
  if (summary.length < 10) { toast('Enter a summary of at least 10 characters', 'error'); return; }
  financeSubmitBusy = true;
  try {
    const filters = Object.fromEntries(new URLSearchParams(financeQuery()));
    await apiRequest('/finance/submissions', { method: 'POST', body: JSON.stringify({ title, summary, reportType: financeFilters.reportType, filters }) });
    closeModal();
    toast('Report sent to Super Admin', 'success');
    await renderPage('reports');
  } catch (error) { toast(error.message || 'Could not send report', 'error'); }
  finally { financeSubmitBusy = false; }
}
async function financeDetail(kind, id) {
  try {
    const row = await apiRequest(`/finance/${kind}/${encodeURIComponent(id)}`);
    const fields = kind === 'transactions' ? [['Transaction ID',row.paymentId],['Booking ID',row.registrationId],['Event',row.eventName],['Attendee',row.attendeeName],['Amount',financeMoney(row.amount)],['Method',row.paymentMethod],['Status',row.status],['Created',financeDate(row.createdAt)]] : [['Refund ID',row.refundId],['Payment ID',row.paymentId],['Booking ID',row.registrationId],['Event',row.eventName],['Attendee',row.attendeeName],['Original Payment',financeMoney(row.originalPaymentAmount)],['Requested Amount',financeMoney(row.amount)],['Reason',row.reason],['Status',row.status],['Requested',financeDate(row.requestedAt)],['Processed',financeDate(row.processedAt)]];
    openDrawer(kind === 'transactions' ? 'Payment Details' : 'Refund Review', fields.map(([label,value])=>`<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${financeEscape(value)}</span></div>`).join('') + (kind==='transactions' ? `<div class="h4 mt-20">Refund History</div>${row.refunds.length ? row.refunds.map(refund=>`<div class="info-row">${financeEscape(refund.refundId)} · ${financeEscape(refund.status)} · ${financeMoney(refund.amount)}</div>`).join('') : '<p>No refunds.</p>'}` : `<div class="h4 mt-20">Review History</div>${(row.reviews||[]).length ? row.reviews.map(item=>`<div class="info-row"><span>${financeEscape(item.note)}</span><small>${financeDate(item.at)}</small></div>`).join('') : '<p>No review notes yet.</p>'}${row.status==='pending'?`<label class="finance-review-label">Review note<textarea class="form-control" id="finance-review-note" maxlength="1000" placeholder="Record eligibility findings (10–1000 characters)"></textarea></label><button class="btn btn-primary" onclick="financeReviewRefund('${financeEscape(row.refundId)}')">Save Review</button>`:''}<p class="small muted mt-20">Only a Super Administrator can process a demo refund. Approval and real gateway processing are not configured.</p>`));
  } catch (error) { toast(error.message,'error'); }
}
let financeReviewBusy = false;
async function financeReviewRefund(id) {
  if (financeReviewBusy) return;
  financeReviewBusy = true;
  try {
    await apiRequest(`/finance/refunds/${encodeURIComponent(id)}/reviews`, { method: 'POST', body: JSON.stringify({ note: v('finance-review-note') }) });
    toast('Review note saved', 'success');
    await financeDetail('refunds', id);
    renderPage('refunds');
  } catch (error) { toast(error.message, 'error'); }
  finally { financeReviewBusy = false; }
}
async function financeDownloadCsv() {
  try {
    const params = new URLSearchParams(financeQuery()); params.set('type',financeFilters.reportType);
    const response = await fetch(`${API_BASE_URL}/finance/reports.csv?${params}`, { headers: { Authorization: getAuthHeader() } });
    if (!response.ok) throw new Error((await response.json()).message || 'Export failed');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `eventflow-${financeFilters.reportType}-report.csv`; anchor.click(); URL.revokeObjectURL(url);
  } catch (error) { toast(error.message,'error'); }
}
async function financeDownloadPdf() {
  try {
    const params = new URLSearchParams(financeQuery()); params.set('type', financeFilters.reportType);
    const response = await fetch(`${API_BASE_URL}/finance/reports.pdf?${params}`, { headers: { Authorization: getAuthHeader() } });
    if (!response.ok) throw new Error((await response.json()).message || 'PDF export failed');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `eventflow-${financeFilters.reportType}-report.pdf`; anchor.click(); URL.revokeObjectURL(url);
  } catch (error) { toast(error.message, 'error'); }
}
