/* Shared submitted-report viewer. Authorization is enforced by the finance API. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '—';
  const money = value => value == null ? 'Unavailable' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100);
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}/finance/submitted-reports${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() } });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || `Request failed (${response.status})`); }
    return response;
  }
  const json = async (path, options) => (await request(path, options)).json();
  async function mount(host, { admin = false } = {}) {
    let page = 1, status = '', generation = 0;
    async function load() {
      const ticket = ++generation;
      host.innerHTML = '<div class="finance-report-inbox" role="status">Loading submitted finance reports…</div>';
      try {
        const result = await json(`?${new URLSearchParams({ page, pageSize: 10, status })}`);
        if (!host.isConnected || ticket !== generation) return;
        host.innerHTML = `<section class="finance-report-inbox"><header><div><h2>${admin ? 'Received Finance Reports' : 'Sent Reports'}</h2><p>${admin ? 'Reports submitted by Finance Executives. Open a report to review the original snapshot and download it.' : 'Track reports sent to Super Admin and view review feedback.'}</p></div><button class="btn btn-ghost" data-refresh>Refresh reports</button></header><label>Status <select data-status><option value="">All reports</option><option value="submitted" ${status === 'submitted' ? 'selected' : ''}>Submitted</option><option value="reviewed" ${status === 'reviewed' ? 'selected' : ''}>Reviewed</option></select></label>${result.records.length ? `<div class="finance-report-table"><table><thead><tr><th>Report</th><th>Type</th>${admin ? '<th>From</th>' : ''}<th>Sent</th><th>Status</th><th>Action</th></tr></thead><tbody>${result.records.map(r => `<tr><td><strong>${esc(r.title)}</strong><small>${esc(r.id)}</small></td><td>${esc(r.type)}</td>${admin ? `<td>${esc(r.submittedByName)}</td>` : ''}<td>${esc(date(r.submittedAt))}</td><td>${esc(r.status)}</td><td><button class="btn btn-ghost btn-xs" data-report="${esc(r.id)}">Open report</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="finance-report-empty">No submitted finance reports found.</p>'}<footer><span>${result.total} reports · Page ${result.page} of ${Math.max(1, result.totalPages)}</span><button class="btn btn-ghost" data-prev ${page <= 1 ? 'disabled' : ''}>Previous</button><button class="btn btn-ghost" data-next ${page >= result.totalPages ? 'disabled' : ''}>Next</button></footer><div data-inbox-error role="status"></div><dialog class="finance-report-dialog"></dialog></section>`;
        host.querySelector('[data-refresh]').onclick = load;
        host.querySelector('[data-status]').onchange = event => { status = event.target.value; page = 1; load(); };
        host.querySelector('[data-prev]').onclick = () => { page--; load(); };
        host.querySelector('[data-next]').onclick = () => { page++; load(); };
        host.querySelectorAll('[data-report]').forEach(button => button.onclick = () => open(button.dataset.report));
      } catch (error) {
        if (!host.isConnected || ticket !== generation) return;
        host.innerHTML = `<section class="finance-report-inbox"><h2>${admin ? 'Received Finance Reports' : 'Sent Reports'}</h2><p role="alert">${esc(error.message)}</p><button class="btn btn-ghost" data-retry>Retry</button></section>`;
        host.querySelector('[data-retry]').onclick = load;
      }
    }
    async function open(id) {
      const ticket = generation;
      try {
        const report = await json(`/${encodeURIComponent(id)}`);
        if (!host.isConnected || ticket !== generation) return;
        const dialog = host.querySelector('dialog');
        const snapshot = report.snapshot;
        dialog.innerHTML = `<header><h2>${esc(report.title)}</h2><button class="btn btn-ghost" data-close>Close</button></header><p>From ${esc(report.submittedByName)} · Sent ${esc(date(report.submittedAt))} · ${esc(report.status)}</p><p>${esc(report.notes || 'No sender notes.')}</p><h3>Original submitted report</h3><p>Type: ${esc(snapshot.type)} · Generated ${esc(date(snapshot.generatedAt))}</p><p>Applied filters: ${esc(JSON.stringify(snapshot.filters))}</p><p>${snapshot.totals.recordCount} records · Filtered total: ${esc(money(snapshot.totals.amount))}</p><p>Money columns in the snapshot and CSV use integer INR paise. This snapshot remains unchanged when live data changes.</p><div data-snapshot-table></div><div data-snapshot-pages></div><div class="finance-report-actions"><button class="btn btn-primary" data-download="csv">Download CSV</button><button class="btn btn-ghost" data-download="pdf">Download PDF</button></div>${report.status === 'reviewed' ? `<h3>Super Admin review</h3><p>${esc(report.reviewedByName)} · ${esc(date(report.reviewedAt))}</p><p>${esc(report.reviewNotes || 'Reviewed without additional notes.')}</p>` : admin ? '<form data-review><label>Review notes<textarea name="notes" maxlength="2000" placeholder="Optional feedback for the Finance Executive"></textarea></label><button class="btn btn-primary" type="submit">Mark reviewed & send feedback</button></form>' : '<p>Awaiting Super Admin review.</p>'}<div data-report-error role="status"></div>`;
        let snapshotPage = 1;
        const renderRecords = () => {
          const rows = snapshot.records.slice((snapshotPage - 1) * 50, snapshotPage * 50), keys = [...new Set(snapshot.records.flatMap(r => Object.keys(r)))];
          dialog.querySelector('[data-snapshot-table]').innerHTML = rows.length ? `<div class="finance-report-table"><table><thead><tr>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${esc(typeof r[k] === 'object' && r[k] !== null ? JSON.stringify(r[k]) : r[k] ?? 'Unavailable')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p>No records in this submitted report.</p>';
          dialog.querySelector('[data-snapshot-pages]').innerHTML = `<div class="finance-report-actions"><span>Snapshot page ${snapshotPage} of ${Math.max(1, Math.ceil(snapshot.records.length / 50))}</span><button class="btn btn-ghost" data-snapshot-prev ${snapshotPage <= 1 ? 'disabled' : ''}>Previous rows</button><button class="btn btn-ghost" data-snapshot-next ${snapshotPage * 50 >= snapshot.records.length ? 'disabled' : ''}>Next rows</button></div>`;
          dialog.querySelector('[data-snapshot-prev]').onclick = () => { snapshotPage--; renderRecords(); };
          dialog.querySelector('[data-snapshot-next]').onclick = () => { snapshotPage++; renderRecords(); };
        };
        renderRecords(); dialog.showModal(); dialog.querySelector('[data-close]').onclick = () => dialog.close();
        dialog.querySelectorAll('[data-download]').forEach(button => button.onclick = async () => {
          button.disabled = true;
          try { const response = await request(`/${encodeURIComponent(id)}/export?format=${button.dataset.download}`); const url = URL.createObjectURL(await response.blob()); const a = document.createElement('a'); a.href = url; a.download = `eventflow-${id}.${button.dataset.download}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
          catch (error) { dialog.querySelector('[data-report-error]').textContent = error.message; }
          finally { button.disabled = false; }
        });
        const review = dialog.querySelector('[data-review]');
        if (review) review.onsubmit = async event => {
          event.preventDefault(); const button = review.querySelector('button'); if (button.disabled) return;
          button.disabled = true;
          try { await json(`/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify({ notes: review.elements.notes.value }) }); dialog.close(); await load(); }
          catch (error) { dialog.querySelector('[data-report-error]').textContent = error.message; }
          finally { button.disabled = false; }
        };
      } catch (error) { const target = host.querySelector('[data-inbox-error]'); if (target) target.textContent = error.message; }
    }
    await load();
  }
  window.EventFlowReportInbox = { mount };
})();
