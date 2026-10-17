(() => {
  const base = 'http://localhost:3001/api/reports/support';
  const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const statusLabel = value => ({ draft: 'Draft', submitted: 'Submitted', reviewed: 'Reviewed' })[value] || value;
  const dateLabel = value => value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

  async function request(user, route = '', options = {}) {
    if (!user?.token) throw new Error('Sign in again to access reports.');
    const response = await fetch(base + route, { ...options, headers: {
      Authorization: `Bearer ${user.token}`,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    } });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message || 'Reports could not be loaded. Please try again.');
    }
    if (route.endsWith('/file')) return response.blob();
    if (options.method && options.method !== 'GET') window.EventFlowData?.invalidate();
    const result = await response.json();
    return result.data ?? result;
  }

  const list = user => request(user);
  const get = (user, id) => request(user, `/${encodeURIComponent(id)}`);
  const submit = (user, id) => request(user, `/${encodeURIComponent(id)}/submit`, { method: 'POST' });
  async function create(user, report, file) {
    const form = new FormData();
    Object.entries(report).forEach(([key, value]) => { if (value != null) form.append(key, value); });
    if (file) form.append('file', file);
    return request(user, '', { method: 'POST', body: form });
  }
  async function download(user, report) {
    const blob = await request(user, `/${encodeURIComponent(report.reportId)}/file`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.documentName || 'report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toWorkspaceReport(report) {
    return { id: report.reportId, backendReportId: report.reportId, authorUserId: report.submittedBy,
      title: report.title, category: report.category, scope: report.scope, period: report.period,
      summary: report.summary, status: statusLabel(report.status), author: report.author,
      fileName: report.documentName || 'No document attached', hasDocument: report.hasDocument,
      updated: dateLabel(report.updatedAt), reviewFeedback: report.reviewFeedback || '', sourceReference: report.sourceReference };
  }

  async function showReport(user, reportId, { admin = false, onReviewed } = {}) {
    const report = await get(user, reportId);
    window.openModal('Executive Report', `
      <div class="submitted-report-detail">
        <div class="flex items-center justify-between gap-12"><h3>${html(report.title)}</h3><span class="badge badge-${report.status === 'reviewed' ? 'green' : 'purple'}">${html(statusLabel(report.status))}</span></div>
        <p class="small muted mono">${html(report.reportId)}</p>
        <dl class="submitted-report-facts">
          <div><dt>Submitted by</dt><dd>${html(report.author)}<small>${html(report.authorEmail)}</small></dd></div>
          <div><dt>Category</dt><dd>${html(report.category)}</dd></div>
          <div><dt>Scope</dt><dd>${html(report.scope)}</dd></div>
          <div><dt>Reporting period</dt><dd>${html(report.period)}</dd></div>
          <div><dt>Submitted</dt><dd>${html(dateLabel(report.submittedAt))}</dd></div>
        </dl>
        <h4>Summary &amp; Key Findings</h4><p class="submitted-report-summary">${html(report.summary)}</p>
        ${report.hasDocument ? `<button class="btn btn-ghost btn-sm" type="button" data-report-download>Download ${html(report.documentName)}</button>` : '<p class="small muted">No document attached.</p>'}
        ${report.reviewFeedback ? `<div class="submitted-report-feedback"><strong>Admin feedback</strong><p>${html(report.reviewFeedback)}</p></div>` : ''}
        ${admin ? `<div class="form-group mt-16"><label class="form-label" for="admin-report-feedback">Review feedback (optional)</label><textarea class="form-control" id="admin-report-feedback" rows="3" maxlength="2000">${html(report.reviewFeedback || '')}</textarea></div><button class="btn btn-primary btn-sm" type="button" data-report-review>${report.status === 'reviewed' ? 'Update Review' : 'Mark Reviewed'}</button>` : ''}
        <p class="small" data-report-feedback role="status" aria-live="polite"></p>
      </div>`, [{ lbl: 'Close', cls: 'btn-ghost', fn: 'closeModal()' }]);
    const content = document.getElementById('modal-body');
    const feedback = content.querySelector('[data-report-feedback]');
    content.querySelector('[data-report-download]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try { await download(user, report); }
      catch (error) { feedback.textContent = error.message; }
      finally { button.disabled = false; }
    });
    content.querySelector('[data-report-review]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await request(user, `/${encodeURIComponent(reportId)}/review`, { method: 'PATCH', body: JSON.stringify({ feedback: content.querySelector('#admin-report-feedback').value.trim() }) });
        await onReviewed?.();
        await showReport(user, reportId, { admin, onReviewed });
        document.getElementById('modal-body').querySelector('[data-report-feedback]').textContent = 'Review saved. The support executive can see your feedback.';
      } catch (error) { feedback.textContent = error.message; button.disabled = false; }
    });
  }

  function adminCards(reports) {
    return reports.map(report => `<article class="submitted-report-card">
      <div class="flex items-center justify-between gap-12"><span class="submitted-report-category">${html(report.category)}</span><span class="badge badge-${report.status === 'reviewed' ? 'green' : 'purple'}">${html(statusLabel(report.status))}</span></div>
      <h3>${html(report.title)}</h3>
      <p class="small muted">${html(report.author)} · ${html(dateLabel(report.submittedAt))}</p>
      <p class="submitted-report-context">${html(report.scope)} · ${html(report.period)}</p>
      <p class="submitted-report-excerpt">${html(report.summary)}</p>
      <div class="submitted-report-card-footer"><span class="small muted">${report.hasDocument ? html(report.documentName) : 'No document attached'}</span><button class="btn btn-ghost btn-sm" type="button" data-report-view="${html(report.reportId)}">${report.status === 'reviewed' ? 'View Report' : 'View &amp; Review'}</button></div>
    </article>`).join('') || '<div class="card submitted-report-empty">No submitted reports match your filters.</div>';
  }

  async function renderAdmin(container, user, state = { query: '', status: '' }) {
    container.innerHTML = `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Reports</div><div class="page-sub">Reports submitted by Support Executives, including findings and attached documents.</div></div><div class="page-hd-right"><button class="btn btn-ghost btn-sm" type="button" data-reports-refresh>Refresh Reports</button></div></div><p data-reports-notice class="small muted" role="status" aria-live="polite">Loading reports…</p><div data-reports-content></div>`;
    const refresh = () => renderAdmin(container, user, state);
    container.querySelector('[data-reports-refresh]').addEventListener('click', refresh);
    try {
      const reports = await list(user);
      if (!container.querySelector('[data-reports-content]')) return;
      const notice = container.querySelector('[data-reports-notice]');
      notice.textContent = `${reports.length} submitted reports · ${reports.filter(report => report.status === 'submitted').length} awaiting review`;
      container.querySelector('[data-reports-content]').innerHTML = `<div class="filter-row"><div class="search-box input-group"><input class="form-control" type="search" placeholder="Search by report, executive, category, or event…" aria-label="Search submitted reports" data-reports-search value="${html(state.query)}"></div><select class="form-control filter-select" aria-label="Report status" data-reports-status><option value="">All Statuses</option><option value="submitted" ${state.status === 'submitted' ? 'selected' : ''}>Awaiting review</option><option value="reviewed" ${state.status === 'reviewed' ? 'selected' : ''}>Reviewed</option></select></div><div class="submitted-report-grid" data-report-grid></div>`;
      const update = () => {
        state.query = container.querySelector('[data-reports-search]').value;
        state.status = container.querySelector('[data-reports-status]').value;
        const query = state.query.trim().toLowerCase();
        const filtered = reports.filter(report => (!state.status || report.status === state.status) &&
          `${report.title} ${report.author} ${report.category} ${report.scope} ${report.period} ${report.summary} ${report.documentName || ''}`.toLowerCase().includes(query));
        container.querySelector('[data-report-grid]').innerHTML = adminCards(filtered);
        container.querySelectorAll('[data-report-view]').forEach(button => button.addEventListener('click', async () => {
          button.disabled = true;
          try { await showReport(user, button.dataset.reportView, { admin: true, onReviewed: refresh }); }
          catch (error) { notice.textContent = error.message; }
          finally { button.disabled = false; }
        }));
      };
      container.querySelector('[data-reports-search]').addEventListener('input', update);
      container.querySelector('[data-reports-status]').addEventListener('change', update);
      update();
    } catch (error) {
      const notice = container.querySelector('[data-reports-notice]');
      if (notice) notice.textContent = error.message;
    }
  }

  window.EventFlowSupportReports = { list, get, create, submit, download, toWorkspaceReport, showReport, renderAdmin };
})();
