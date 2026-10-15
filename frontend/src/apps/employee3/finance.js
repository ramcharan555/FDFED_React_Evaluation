/* Finance UI uses backend aggregates exclusively. All amounts are integer paise. */
(() => {
  const titles = { dashboard: 'Financial overview', finance: 'Payment Transactions', 'finance-refunds': 'Refund Management', 'finance-settlements': 'Organizer Settlements', 'finance-revenue': 'Commission & Revenue', 'finance-reconciliation': 'Payment Reconciliation', reports: 'Financial Reports', settings: 'Account Settings' };
  let controller, version = 0, config, current = 'dashboard', filters = { preset: '30', interval: 'daily', page: 1 }, busy = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => n == null ? 'Not configured' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n / 100);
  const date = v => v ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(v)) : 'Unavailable';
  const label = s => String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const badge = s => `<span class="finance-badge ${['completed', 'approved'].includes(s) ? 'good' : ['failed', 'rejected'].includes(s) ? 'bad' : ''}">${esc(label(s))}</span>`;
  const day = d => new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
  function query(extra = {}) {
    const q = { ...filters, ...extra }; delete q.preset;
    if (filters.preset !== 'custom') {
      const now = new Date(), end = day(now), start = new Date(now);
      if (filters.preset === 'month') { const local = new Date(now.getTime() + 330 * 60000); q.from = `${local.toISOString().slice(0, 7)}-01`; }
      else { start.setUTCDate(start.getUTCDate() - (Number(filters.preset) - 1)); q.from = day(start); }
      q.to = end;
    }
    return new URLSearchParams(Object.entries(q).filter(([, v]) => v !== '' && v != null)).toString();
  }
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}/finance/${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader(), ...options.headers } });
    if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || `Request failed (${response.status})`); }
    return response;
  }
  const json = async (path, options) => (await request(path, options)).json();
  const options = (items, selected) => items.map(([value, text]) => `<option value="${esc(value)}" ${String(value) === String(selected || '') ? 'selected' : ''}>${esc(text)}</option>`).join('');
  function controls() {
    const type = filters.type || 'transactions';
    const statuses = current === 'finance-refunds' || (current === 'reports' && type === 'refunds') ? ['pending', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'failed', 'not_applicable'] : current === 'finance-settlements' || (current === 'reports' && type === 'settlements') ? ['pending_review', 'approved', 'completed', 'on_hold'] : ['pending', 'completed', 'failed', 'refunded'];
    const transactional = ['finance', 'finance-refunds', 'finance-settlements'].includes(current) || current === 'reports' && ['transactions', 'refunds', 'settlements'].includes(type);
    return `<form id="finance-filters" class="finance-filters">
      ${current === 'reports' ? `<label>Report<select name="type">${options(['transactions', 'daily', 'monthly', 'events', 'refunds', 'settlements', 'commission', 'reconciliation'].map(v => [v, label(v)]), type)}</select></label>` : ''}
      <label>Date range<select name="preset">${options([['1', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['custom', 'Custom range']], filters.preset)}</select></label>
      ${filters.preset === 'custom' ? `<label>From<input type="date" name="from" value="${esc(filters.from)}" required></label><label>To<input type="date" name="to" value="${esc(filters.to)}" required></label>` : ''}
      <label>Event<select name="eventId">${options([['', 'All events'], ...config.events.map(e => [e.id, e.name])], filters.eventId)}</select></label>
      <label>Organizer<select name="organizerId">${options([['', 'All organizers'], ...config.organizers.map(e => [e.id, e.name])], filters.organizerId)}</select></label>
      ${transactional ? `<label>Status<select name="status">${options([['', 'All statuses'], ...statuses.map(v => [v, label(v)])], filters.status)}</select></label><label>Search<input name="search" value="${esc(filters.search)}" placeholder="Reference, booking, attendee"></label><label>Sort<select name="sort">${options([['date_desc', 'Newest first'], ['date_asc', 'Oldest first'], ['amount_desc', 'Amount: high to low'], ['amount_asc', 'Amount: low to high']], filters.sort || 'date_desc')}</select></label>` : ''}
      ${current === 'finance' || current === 'reports' && type === 'transactions' ? `<label>Method<select name="method">${options([['', 'All methods'], ['DEMO_PROVIDER', 'Demo provider']], filters.method)}</select></label>` : ''}
      ${current === 'dashboard' || current === 'finance-revenue' ? `<label>Group by<select name="interval">${options(['daily', 'weekly', 'monthly', 'yearly'].map(v => [v, label(v)]), filters.interval)}</select></label>` : ''}
      <button class="btn btn-primary" type="submit">Apply filters</button><button class="btn btn-ghost" type="button" data-action="reset">Reset</button>
    </form>`;
  }
  const empty = text => `<div class="finance-empty">${esc(text || 'No matching financial records for this period.')}</div>`;
  const metrics = summary => `<div class="finance-metrics">${[['Gross ticket revenue', 'gross'], ['Completed refunds', 'refunded'], ['Net revenue', 'net'], ['Successful payments', 'successful', true], ['Failed payments', 'failed', true], ['Pending payments', 'pending', true], ['Platform commission', 'commission'], ['Pending refunds', 'pendingRefunds', true], ['Pending settlements', 'pendingSettlements', true], ['Completed settlements', 'completedSettlements'], ['Tickets sold', 'tickets', true], ['Organizer payable', 'organizerPayables'], ['Outstanding settlements', 'outstanding']].map(([title, key, count]) => `<article class="finance-metric"><span>${title}</span><strong>${count ? esc(summary[key]) : esc(money(summary[key]))}</strong></article>`).join('')}</div>`;
  function chart(title, rows, series, count = false, bars = false) {
    const usable = rows.filter(r => series.some(s => r[s.key] != null));
    if (!usable.length || !usable.some(r => series.some(s => r[s.key] > 0))) return `<article class="finance-chart"><h3>${title}</h3>${empty('No chart data for this period.')}</article>`;
    const width = Math.max(600, rows.length * 38), height = 220, max = Math.max(1, ...usable.flatMap(r => series.map(s => r[s.key] || 0)));
    const x = i => 64 + i * (width - 94) / Math.max(1, rows.length - 1), y = v => 170 - (v || 0) / max * 142;
    const graph = series.map((s, si) => bars ? rows.map((r, i) => `<rect x="${70 + i * ((width - 100) / rows.length) + si * 10}" y="${y(r[s.key])}" width="${Math.max(5, (width - 100) / rows.length / series.length - 8)}" height="${170 - y(r[s.key])}" fill="${s.color}"><title>${esc(r.label)}: ${esc(count ? r[s.key] : money(r[s.key]))}</title></rect>`).join('') : `<polyline fill="none" stroke="${s.color}" stroke-width="3" points="${rows.filter(r => r[s.key] != null).map(r => `${x(rows.indexOf(r))},${y(r[s.key])}`).join(' ')}"/>${rows.map((r, i) => r[s.key] == null ? '' : `<circle cx="${x(i)}" cy="${y(r[s.key])}" r="4" fill="${s.color}"><title>${esc(r.label)} · ${esc(s.name)}: ${esc(count ? r[s.key] : money(r[s.key]))}</title></circle>`).join('')}`).join('');
    return `<article class="finance-chart"><h3>${title}</h3><div class="finance-chart-scroll"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${[0, .5, 1].map(f => `<line x1="60" x2="${width - 20}" y1="${170 - f * 142}" y2="${170 - f * 142}" stroke="#30334c"/><text x="2" y="${174 - f * 142}" fill="#a8acc5" font-size="10">${esc(count ? Math.round(max * f) : (max * f / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 }))}</text>`).join('')}${graph}${rows.map((r, i) => i % Math.max(1, Math.ceil(rows.length / 6)) === 0 ? `<text x="${bars ? 70 + i * (width - 100) / rows.length : x(i)}" y="196" fill="#a8acc5" font-size="10">${esc(String(r.label).slice(0, 20))}</text>` : '').join('')}</svg></div><div class="finance-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}<span>${count ? 'Count' : 'INR'} · Hover for values</span></div></article>`;
  }
  const series = (key, name, color = '#a78bfa') => ({ key, name, color });
  function table(rows, columns, kind) {
    if (!rows.length) return empty();
    return `<div class="finance-table-wrap"><table class="finance-table"><thead><tr>${columns.map(([key, name]) => `<th>${esc(name || label(key))}</th>`).join('')}${kind ? '<th>Actions</th>' : ''}</tr></thead><tbody>${rows.map(r => `<tr>${columns.map(([key, , format]) => `<td>${format === 'money' ? esc(money(r[key])) : format === 'date' ? esc(date(r[key])) : key === 'status' ? badge(r[key]) : esc(r[key] ?? 'Unavailable')}</td>`).join('')}${kind ? `<td><button class="btn btn-ghost btn-xs" data-detail="${esc(r.id)}" data-kind="${kind}">View details</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
  }
  const paymentColumns = [['id', 'Transaction'], ['bookingId', 'Booking'], ['eventName', 'Event'], ['attendeeName', 'Attendee'], ['amount', 'Amount', 'money'], ['currency'], ['method'], ['gateway'], ['status'], ['date', 'Payment date', 'date']];
  const refundColumns = [['id', 'Refund request'], ['bookingId', 'Booking'], ['eventName', 'Event'], ['attendeeName', 'Attendee'], ['originalAmount', 'Original payment', 'money'], ['amount', 'Requested amount', 'money'], ['reason'], ['status'], ['date', 'Requested', 'date']];
  const settlementColumns = [['id', 'Settlement'], ['organizerName', 'Organizer'], ['eventName', 'Event'], ['from'], ['to'], ['gross', 'Gross', 'money'], ['refunds', 'Refunds', 'money'], ['commission', 'Commission', 'money'], ['amount', 'Net payable', 'money'], ['status'], ['paidAt', 'Paid', 'date']];
  const eventColumns = [['eventName', 'Event'], ['organizerName', 'Organizer'], ['tickets'], ['gross', 'Gross', 'money'], ['refunds', 'Refunds', 'money'], ['net', 'Net', 'money'], ['commission', 'Commission', 'money'], ['payable', 'Organizer share', 'money']];
  function pager(data) { return `<div class="finance-pager"><span>${data.total} records · Page ${data.page} of ${Math.max(1, data.totalPages)}</span><button class="btn btn-ghost" data-page="${data.page - 1}" ${data.page <= 1 ? 'disabled' : ''}>Previous</button><button class="btn btn-ghost" data-page="${data.page + 1}" ${data.page >= data.totalPages ? 'disabled' : ''}>Next</button></div>`; }
  function nav() {
    const link = (pg, text) => `<button class="sb-item ${current === pg ? 'active' : ''}" data-pg="${pg}" onclick="goNav('${pg}')">${esc(text)}</button>`;
    return `<div class="sb-section-lbl">Main Menu</div>${link('dashboard', '◈ Dashboard')}<details ${current.startsWith('finance') ? 'open' : ''}><summary class="sb-item">▣ Finance</summary><div class="finance-subnav">${Object.entries(titles).filter(([pg]) => pg.startsWith('finance')).map(([pg, text]) => link(pg, text)).join('')}</div></details>${link('reports', '▤ Reports')}`;
  }
  async function render(el, pg) {
    current = pg; const ticket = ++version;
    controller?.abort(); controller = new AbortController();
    document.getElementById('sb-nav').innerHTML = nav();
    el.innerHTML = '<div class="finance-workspace"><div class="finance-skeleton" aria-label="Loading finance data" role="status">Loading financial records…</div></div>';
    try {
      config = await json('config', { signal: controller.signal });
      let body = '', result;
      if (pg === 'settings') {
        result = await json('account', { signal: controller.signal });
        body = `<div class="finance-charts"><article class="finance-panel"><h3>Personal Information</h3><form id="finance-account"><label>Full Name<input name="name" value="${esc(result.name)}" required maxlength="120"></label><label>Email Address<input name="email" type="email" value="${esc(result.email)}" required></label><label>Phone Number<input name="phoneNo" value="${esc(result.phoneNo)}" placeholder="10-digit Indian mobile"></label><label>Bio<textarea name="bio" maxlength="2000">${esc(result.bio)}</textarea></label><h3>Preferences</h3>${Object.entries(result.preferences).map(([k, value]) => `<label><span><input type="checkbox" name="${k}" ${value ? 'checked' : ''}> ${esc(label(k.replace(/([A-Z])/g, ' $1')))}</span></label>`).join('')}<p>Preferences are saved to your account. Email changes require signing in again.</p><button class="btn btn-primary" type="submit">Save Changes</button></form></article><article class="finance-panel"><h3>Change Password</h3><form id="finance-password"><label>Current Password<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>New Password<input name="newPassword" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm New Password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn btn-primary" type="submit">Update Password</button></form><div class="finance-actions"><button class="btn btn-ghost" onclick="goNav('customer-support')">Customer Support</button><button class="btn btn-danger" onclick="doLogout()">Sign Out</button></div></article></div>`;
      } else if (pg === 'dashboard' || pg === 'finance-revenue') {
        result = await json(`dashboard?${query()}`, { signal: controller.signal });
        const s = result.trends;
        body = metrics(result.summary) + `<div class="finance-charts">${chart('Revenue trend', s, [series('revenue', 'Gross revenue')])}${chart('Payment status', result.paymentStatus, [series('value', 'Payments', '#38bdf8')], true, true)}${chart('Revenue by event', result.events.map(e => ({ ...e, label: e.eventName })), [series('gross', 'Gross revenue'), series('net', 'After refunds', '#34d399')], false, true)}${chart('Commission trend', s, [series('commission', 'Commission', '#fbbf24')])}${chart('Refund trend', s, [series('requested', 'Requested', '#fb7185'), series('completed', 'Completed', '#34d399')])}${pg === 'finance-revenue' ? chart('Revenue by organizer', Object.values(result.events.reduce((all, e) => { const key = e.organizerId; all[key] ||= { label: e.organizerName || key, gross: 0 }; all[key].gross += e.gross; return all; }, {})), [series('gross', 'Gross revenue')], false, true) : ''}</div>`;
        body += pg === 'finance-revenue' ? `<article class="finance-panel"><h3>Event revenue breakdown</h3>${table(result.events, eventColumns)}<h3>Commission policies (read only)</h3>${table(config.policies, [['id', 'Policy'], ['eventId', 'Event override'], ['basisPoints', 'Rate (basis points)'], ['effectiveDate', 'Effective from']])}<p>100 basis points = 1%. Finalized settlement lines retain their policy version.</p></article>` : `<article class="finance-panel"><h3>Recent financial activity</h3>${table(result.activity, [['id', 'Reference'], ['eventName', 'Event'], ['amount', 'Amount', 'money'], ['status'], ['date', 'Timestamp', 'date']])}${result.activity.map(r => `<button class="btn btn-ghost btn-xs" data-detail="${esc(r.id)}" data-kind="${r.kind}">Open ${esc(r.id)}</button>`).join(' ')}</article>`;
      } else if (pg === 'finance-reconciliation') {
        result = await json(`reconciliation?${query()}`, { signal: controller.signal });
        body = `<article class="finance-panel"><h3>Gateway reconciliation unavailable</h3><p>${esc(result.reason)}</p><p>Checked, matched, and discrepancy totals are unavailable until an independent source is connected.</p></article>`;
      } else if (pg === 'reports') {
        result = await json(`reports?${query({ type: filters.type || 'transactions' })}`, { signal: controller.signal });
        const type = filters.type || 'transactions';
        const cols = type === 'transactions' ? paymentColumns : type === 'refunds' ? refundColumns : type === 'settlements' ? settlementColumns : ['daily', 'monthly'].includes(type) ? [['label', 'Period'], ['revenue', 'Gross revenue', 'money'], ['commission', 'Commission', 'money'], ['requested', 'Refund requests', 'money'], ['completed', 'Completed refunds', 'money']] : eventColumns;
        body = `<div class="finance-metrics"><article class="finance-metric"><span>Matching report records</span><strong>${result.totals.recordCount}</strong></article><article class="finance-metric"><span>Filtered ${type === 'commission' ? 'commission' : ['events', 'daily', 'monthly'].includes(type) ? 'gross revenue' : 'record amounts'}</span><strong>${esc(money(result.totals.amount))}</strong></article></div>${result.unavailable ? '' : chart('Filtered report amounts', result.chart, [series('value', 'Amount')], false, true)}<article class="finance-panel"><div class="finance-actions"><button class="btn btn-primary" data-export="csv">Download CSV</button><button class="btn btn-ghost" data-export="pdf">Download PDF</button></div><p>Generated ${esc(date(result.generatedAt))} · Applied filters: ${esc(query({ type }))}</p><p>Exports contain all filtered records. CSV money columns use integer paise.</p>${result.unavailable ? empty(result.unavailable) : table(result.records, cols)}${pager(result)}</article>`;
      } else {
        const kind = pg === 'finance-refunds' ? 'refunds' : pg === 'finance-settlements' ? 'settlements' : 'transactions';
        result = await json(`${kind}?${query()}`, { signal: controller.signal });
        body = `<article class="finance-panel">${kind === 'settlements' ? '<button class="btn btn-primary" data-action="calculate">Calculate settlement</button><p>Uses the selected event and date range. Missing policy or unresolved refunds prevent calculation. Demo settlements cannot be paid.</p>' : ''}${table(result.records, kind === 'transactions' ? paymentColumns : kind === 'refunds' ? refundColumns : settlementColumns, kind)}${pager(result)}</article>`;
      }
      if (pg === 'reports') body += `<article class="finance-panel"><h3>Send this report to Super Admin</h3><p>Send all records matching the applied filters as a saved report. Track delivery and review feedback below.</p><button class="btn btn-primary" data-send-report ${result.unavailable ? 'disabled' : ''}>Send Report to Super Admin</button></article><div id="finance-sent-reports"></div>`;
      if (ticket !== version || !el.isConnected) return;
      el.innerHTML = `<section class="finance-workspace"><header class="page-hd"><div><h1>${titles[pg]}</h1><p class="muted">Financial operations · INR · Asia/Kolkata</p></div><button class="btn btn-ghost" data-action="refresh">Refresh</button></header>${pg === 'settings' ? '' : `<div class="finance-notice">${esc(config.provider)} No live refunds or payouts are available.${!config.policies.length ? ' Commission policy is not configured; related amounts remain unavailable.' : ''}</div>${controls()}`}${body}<div id="finance-feedback" role="status"></div><dialog id="finance-dialog"></dialog></section>`;
      bind(el);
      if (pg === 'reports') await window.EventFlowReportInbox.mount(el.querySelector('#finance-sent-reports'));
    } catch (error) {
      if (error.name === 'AbortError' || ticket !== version) return;
      el.innerHTML = `<section class="finance-workspace"><h1>${titles[pg]}</h1><div class="finance-error" role="alert">Financial data unavailable: ${esc(error.message)}</div><button class="btn btn-primary" id="finance-retry">Retry</button></section>`;
      el.querySelector('#finance-retry').onclick = () => render(el, pg);
    }
  }
  async function mutate(path, body, el) {
    if (busy) return;
    busy = true; el.querySelectorAll('button').forEach(b => b.disabled = true);
    try { await json(path, { method: 'POST', body: JSON.stringify(body) }); await render(el, current); }
    catch (error) { const target = el.querySelector('#finance-dialog[open] .finance-dialog-error') || el.querySelector('#finance-feedback'); target.textContent = error.message; }
    finally { busy = false; el.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  async function detail(kind, id, el) {
    const ticket = version;
    try {
      const data = await json(`${kind}/${encodeURIComponent(id)}`);
      if (!el.isConnected || ticket !== version) return;
      const dialog = el.querySelector('#finance-dialog');
      const actions = kind === 'refunds' && ['pending', 'under_review'].includes(data.status) ? `<button class="btn btn-ghost" data-refund="review">Mark under review</button>${config.canApproveRefund ? '<button class="btn btn-primary" data-refund="approve">Approve request</button><label>Rejection reason<textarea id="finance-reason" maxlength="2000"></textarea></label><button class="btn btn-danger" data-refund="reject">Reject request</button>' : '<p>Approval and rejection require explicit administrator-granted permission.</p>'}<p>Approval records eligibility only. A live gateway integration is required to process and confirm completion.</p>` : kind === 'settlements' && data.status === 'pending_review' && config.canApproveSettlement ? '<button class="btn btn-primary" data-settlement="approve">Approve settlement</button>' : '';
      const scalar = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v === null);
      dialog.innerHTML = `<div class="finance-actions"><h2>${esc(id)}</h2><button class="btn btn-ghost" id="finance-close">Close</button></div><dl>${scalar.map(([k, v]) => `<dt>${esc(label(k))}</dt><dd>${esc(['amount', 'gross', 'refunds', 'commission', 'originalAmount'].includes(k) ? money(v) : v ?? 'Unavailable')}</dd>`).join('')}</dl>${data.lines ? `<h3>Frozen settlement allocation (money in paise)</h3>${table(data.lines, [['paymentId', 'Payment'], ['gross', 'Gross', 'money'], ['refunds', 'Refunds', 'money'], ['commission', 'Commission', 'money'], ['payable', 'Payable', 'money'], ['policyId', 'Policy'], ['basisPoints', 'Rate (bp)']])}` : ''}<h3>Refund history</h3>${table(data.refunds || [], refundColumns)}<h3>Audit history</h3>${table((data.audit || []).map(a => ({ ...a, metadata: JSON.stringify(a.metadata) })), [['actorId', 'Actor'], ['action'], ['previousStatus', 'Before'], ['newStatus', 'After'], ['timestamp', 'Time', 'date'], ['metadata', 'Details']])}<div class="finance-dialog-error" role="alert"></div>${actions}`;
      dialog.showModal(); dialog.querySelector('#finance-close').onclick = () => dialog.close();
      dialog.querySelectorAll('[data-refund]').forEach(b => b.onclick = () => { if (confirm(`Confirm refund ${b.dataset.refund}? This does not transfer money.`)) mutate(`refunds/${encodeURIComponent(id)}/review`, { action: b.dataset.refund, reason: dialog.querySelector('#finance-reason')?.value }, el); });
      dialog.querySelectorAll('[data-settlement]').forEach(b => b.onclick = () => { if (confirm('Approve this settlement calculation? No payout will be initiated.')) mutate(`settlements/${encodeURIComponent(id)}/action`, { action: 'approve' }, el); });
    } catch (error) { el.querySelector('#finance-feedback').textContent = error.message; }
  }
  function sendReport(el) {
    if (busy) return;
    const ticket = version, dialog = el.querySelector('#finance-dialog');
    const appliedFilters = Object.fromEntries(new URLSearchParams(query({ type: filters.type || 'transactions' })));
    delete appliedFilters.page;
    dialog.innerHTML = `<header class="finance-actions"><h2>Send Report to Super Admin</h2><button class="btn btn-ghost" type="button" data-close-send>Cancel</button></header><p>All records matching the applied filters will be saved and sent to Super Admin.</p><p>${esc(JSON.stringify(appliedFilters))}</p><form class="finance-report-send" id="finance-send-form"><label>Report title<input name="title" required maxlength="160" value="${esc(label(filters.type || 'transactions') + ' financial report')}"></label><label>Notes for Super Admin<textarea name="notes" maxlength="2000" placeholder="Optional context or findings"></textarea></label><button class="btn btn-primary" type="submit">Send report</button><div role="alert" data-send-error></div></form>`;
    dialog.showModal(); dialog.querySelector('[data-close-send]').onclick = () => dialog.close();
    const form = dialog.querySelector('form');
    form.onsubmit = async event => {
      event.preventDefault(); if (busy) return;
      const fields = Object.fromEntries(new FormData(form));
      const signature = JSON.stringify({ ...fields, filters: appliedFilters });
      let attempt;
      try { attempt = JSON.parse(sessionStorage.getItem('ef_finance_pending_report') || 'null'); } catch {}
      if (attempt?.signature !== signature) attempt = { signature, key: crypto.randomUUID() };
      try { sessionStorage.setItem('ef_finance_pending_report', JSON.stringify(attempt)); } catch {}
      busy = true; form.querySelector('button').disabled = true;
      try {
        const response = await json('submitted-reports', { method: 'POST', body: JSON.stringify({ ...fields, filters: appliedFilters, idempotencyKey: attempt.key }) });
        try { sessionStorage.removeItem('ef_finance_pending_report'); } catch {}
        if (ticket !== version || !el.isConnected) return;
        dialog.close(); await render(el, 'reports');
        el.querySelector('#finance-feedback').textContent = `Report ${response.id} sent to Super Admin.`;
      } catch (error) { if (ticket === version && el.isConnected) dialog.querySelector('[data-send-error]').textContent = error.message; }
      finally { busy = false; if (form.isConnected) form.querySelector('button').disabled = false; }
    };
  }
  function bind(el) {
    const form = el.querySelector('#finance-filters');
    if (!form) {
      el.querySelector('[data-action="refresh"]').onclick = () => render(el, current);
      const account = el.querySelector('#finance-account'), password = el.querySelector('#finance-password');
      account.onsubmit = async event => {
        event.preventDefault(); if (busy) return; busy = true;
        const button = account.querySelector('button'); button.disabled = true;
        try {
          const fields = Object.fromEntries(new FormData(account));
          const preferences = Object.fromEntries(['emailNotifications', 'smsReminders', 'eventRecommendations'].map(k => [k, account.elements[k].checked]));
          const result = await json('account', { method: 'POST', body: JSON.stringify({ ...fields, preferences }) });
          if (result.reauthenticate) { alert('Account saved. Please sign in with your updated email.'); doLogout(); return; }
          CU.name = result.name; CU.email = result.email; setCurrentUser(CU); updateHeaderUser();
          el.querySelector('#finance-feedback').textContent = 'Account changes saved.';
        } catch (error) { el.querySelector('#finance-feedback').textContent = error.message; }
        finally { busy = false; button.disabled = false; }
      };
      password.onsubmit = async event => {
        event.preventDefault(); if (busy) return;
        const fields = Object.fromEntries(new FormData(password));
        if (fields.newPassword !== fields.confirmPassword) { el.querySelector('#finance-feedback').textContent = 'Passwords do not match.'; return; }
        busy = true; const button = password.querySelector('button'); button.disabled = true;
        try { await json('account/password', { method: 'POST', body: JSON.stringify(fields) }); password.reset(); el.querySelector('#finance-feedback').textContent = 'Password updated.'; }
        catch (error) { el.querySelector('#finance-feedback').textContent = error.message; }
        finally { busy = false; button.disabled = false; }
      };
      return;
    }
    form.onsubmit = event => { event.preventDefault(); filters = { ...Object.fromEntries(new FormData(form)), page: 1 }; render(el, current); };
    const send = el.querySelector('[data-send-report]'); if (send) send.onclick = () => sendReport(el);
    form.querySelector('[name="preset"]').onchange = event => { filters = { ...Object.fromEntries(new FormData(form)), preset: event.target.value, page: 1 }; if (filters.preset === 'custom') { filters.from ||= day(new Date()); filters.to ||= day(new Date()); } render(el, current); };
    const type = form.querySelector('[name="type"]'); if (type) type.onchange = () => { filters.type = type.value; delete filters.status; delete filters.method; filters.page = 1; render(el, current); };
    el.querySelectorAll('[data-action]').forEach(b => b.onclick = () => {
      if (b.dataset.action === 'reset') filters = { preset: '30', interval: 'daily', page: 1 };
      if (b.dataset.action === 'calculate') {
        const values = Object.fromEntries(new URLSearchParams(query()));
        if (!values.eventId) { el.querySelector('#finance-feedback').textContent = 'Select an event and apply filters before calculating a settlement.'; return; }
        if (confirm('Calculate an internal settlement for the selected event and dates?')) mutate('settlements', values, el);
      } else render(el, current);
    });
    el.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { filters.page = Number(b.dataset.page); render(el, current); });
    el.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => detail(b.dataset.kind, b.dataset.detail, el));
    el.querySelectorAll('[data-export]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try { const response = await request(`reports/export?${query({ type: filters.type || 'transactions', format: b.dataset.export })}`); const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = `eventflow-${filters.type || 'transactions'}.${b.dataset.export}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      catch (error) { el.querySelector('#finance-feedback').textContent = error.message; }
      finally { b.disabled = false; }
    });
  }
  window.EventFlowFinance = { render, nav, handles: pg => !!titles[pg], navigate(pg) { controller?.abort(); version++; if (current !== pg) { filters.page = 1; delete filters.status; delete filters.method; delete filters.search; } current = pg; }, stop() { controller?.abort(); version++; } };
  window.addEventListener('popstate', () => {
    if (typeof CU !== 'undefined' && CU && ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].includes(CU.employeeType)) goNav(location.hash.slice(1) || 'dashboard');
  });
})();
