(() => {
  const API_BASE_URL = 'http://localhost:3001/api';
  const SUPPORT_CONCERNS = {
    'Account Related Problems': [
      'Unable to log in',
      'Change password not working',
      'Forgot password / password reset failed',
      'Username not changing',
      'Email address not updating',
      'Phone number not updating',
      'Account verification failed',
      'Profile details not saving',
      'Account locked or suspended',
      'Unable to access my account',
    ],
    'Payment Issues': [
      'Payment is not working',
      'Payment completed but showing failed',
      'Money deducted but ticket not generated',
      'Payment failed but amount deducted',
      'Refund not received',
      'Refund amount is incorrect',
      'Duplicate payment / charged twice',
      'Payment method not accepted',
      'Invoice or receipt not generated',
      'Unable to download payment receipt',
    ],
    'Ticket & Registration Issues': [
      'Ticket not received after registration',
      'Ticket cancellation not working',
      'Unable to register for an event',
      'QR code not generated',
      'QR code not scanning',
      'Ticket details are incorrect',
      'Unable to download ticket',
      'Registration confirmation not received',
      'Ticket showing invalid',
      'Unable to transfer ticket',
    ],
    'Event Related Issues': [
      'Event details are incorrect',
      'Event date or time changed',
      'Event location is incorrect',
      'Event cancelled but no notification received',
      'Unable to find a registered event',
      'Event not appearing in my dashboard',
      'Unable to contact event organizer',
      'Event access or entry issue',
    ],
    'Account Deletion & Privacy': [
      'Request permanent account deletion',
      'Account deletion not working',
      'Cancel an account deletion request',
      'Request a copy of my personal data',
      'Request correction of personal data',
      'Privacy or data security concern',
      'Remove saved personal information',
    ],
    'Notifications & Communication': [
      'Not receiving email notifications',
      'Not receiving SMS notifications',
      'Event reminder not received',
      'Payment confirmation not received',
      'Receiving duplicate notifications',
      'Unable to change notification preferences',
      'Important updates not showing',
    ],
    'Website & Technical Problems': [
      'Website not loading',
      'Page showing an error',
      'Button not working',
      'Dashboard not displaying correctly',
      'Unable to upload a file',
      'Application running slowly',
      'Session keeps expiring',
      'Mobile layout not working',
      'Other technical issue',
    ],
    'Organizer & Client Support': [
      'Unable to create an event',
      'Unable to edit event details',
      'Event publishing failed',
      'Unable to manage registrations',
      'Event approval pending',
      'Event capacity not updating',
      'Unable to view analytics',
      'Unable to download event reports',
      'Unable to assign staff',
      'Event revenue not showing correctly',
    ],
    'Event Staff & Check-in Support': [
      'Unable to scan attendee QR code',
      'Valid ticket showing invalid',
      'Attendee already checked in incorrectly',
      'Check-in not updating',
      'Assigned event not showing',
      'Unable to access staff dashboard',
      'Scanner or camera not working',
      'Attendance report not generating',
    ],
    'Other Issues': [
      'My issue is not listed',
      'General inquiry',
      'Feedback or suggestion',
      'Report a bug',
      'Report suspicious activity',
      'Other support request',
    ],
  };

  const GENERAL_CATEGORIES = [
    'Account Related Problems',
    'Payment Issues',
    'Ticket & Registration Issues',
    'Event Related Issues',
    'Account Deletion & Privacy',
    'Notifications & Communication',
    'Website & Technical Problems',
    'Other Issues',
  ];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
  }

  function allowedCategories(user) {
    const role = String(user?.role || user?.userRole || '').toLowerCase().replace(/-/g, '_');
    if (['superuser', 'super_admin', 'admin'].includes(role)) {
      return Object.keys(SUPPORT_CONCERNS);
    }
    if (['organizer', 'event_organizer', 'client'].includes(role)) {
      return [...GENERAL_CATEGORIES.slice(0, -1), 'Organizer & Client Support', 'Other Issues'];
    }
    if (['staff', 'event_staff'].includes(role)) {
      return [...GENERAL_CATEGORIES.slice(0, -1), 'Event Staff & Check-in Support', 'Other Issues'];
    }
    return GENERAL_CATEGORIES;
  }

  async function request(endpoint, user, options = {}) {
    const headers = {
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    if (!response.ok) {
      const message = Array.isArray(data?.message)
        ? data.message.join(', ')
        : (data?.message || `Request failed (${response.status})`);
      throw new Error(message);
    }
    return data;
  }

  function statusLabel(status) {
    return ({
      open: 'Open',
      in_progress: 'In progress',
      resolved: 'Resolved',
    })[status] || status;
  }

  function ticketCard(ticket, isAdmin) {
    const attachments = (ticket.attachments || []).map(attachment => `
      <button class="support-file-link" type="button" data-support-download="${escapeHtml(attachment.attachmentId)}">
        ${escapeHtml(attachment.originalName)}
      </button>`).join('');
    const actions = isAdmin ? `
      <div class="support-ticket-actions">
        ${ticket.status !== 'in_progress' && ticket.status !== 'resolved'
          ? `<button class="btn btn-ghost btn-sm" type="button" data-support-status="in_progress" data-ticket-id="${escapeHtml(ticket.ticketId)}">In progress</button>`
          : ''}
        ${ticket.status !== 'resolved'
          ? `<button class="btn btn-primary btn-sm" type="button" data-support-status="resolved" data-ticket-id="${escapeHtml(ticket.ticketId)}">Resolve &amp; email requester</button>`
          : `<button class="btn btn-ghost btn-sm" type="button" data-support-status="open" data-ticket-id="${escapeHtml(ticket.ticketId)}">Reopen</button>`}
      </div>` : '';

    return `
      <article class="support-ticket">
        <div class="support-ticket-heading">
          <div>
            <strong>${escapeHtml(ticket.ticketId)}</strong>
            <span class="support-status support-status-${escapeHtml(ticket.status)}">${escapeHtml(statusLabel(ticket.status))}</span>
          </div>
          <time>${escapeHtml(new Date(ticket.createdAt).toLocaleDateString())}</time>
        </div>
        ${isAdmin ? `<p class="support-requester">${escapeHtml(ticket.requesterName)} · ${escapeHtml(ticket.requesterEmail)}</p>` : ''}
        <h3>${escapeHtml(ticket.concern)}</h3>
        <p class="support-ticket-category">${escapeHtml(ticket.requestType)}</p>
        <p class="support-ticket-description">${escapeHtml(ticket.description)}</p>
        ${attachments ? `<div class="support-attachments">${attachments}</div>` : ''}
        ${actions}
      </article>`;
  }

  function ticketDate(value, includeTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, includeTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' });
  }

  function pastTicketRows(tickets) {
    if (!tickets.length) {
      return '<tr><td class="support-table-empty" colspan="5">No matching resolved tickets.</td></tr>';
    }
    return tickets.map(ticket => `
      <tr class="support-past-row" tabindex="0" role="button" data-past-ticket-id="${escapeHtml(ticket.ticketId)}">
        <td>${escapeHtml(ticket.concern)}</td>
        <td>${escapeHtml(ticket.ticketId)}</td>
        <td>${escapeHtml(ticketDate(ticket.createdAt))}</td>
        <td>${escapeHtml(ticketDate(ticket.updatedAt || ticket.createdAt))}</td>
        <td><span class="support-status support-status-resolved">Resolved</span></td>
      </tr>`).join('');
  }

  function pastTicketDetail(ticket, user) {
    const attachments = (ticket.attachments || []).map(attachment => `
      <button class="support-file-link" type="button" data-support-download="${escapeHtml(attachment.attachmentId)}">
        ${escapeHtml(attachment.originalName)}
      </button>`).join('');
    const requesterName = user?.name || 'You';

    return `
      <div class="support-detail">
        <button class="support-back-to-list" type="button" id="support-past-back">‹ &nbsp;Back to My Tickets</button>
        <h2>My Tickets</h2>
        <article class="support-detail-summary">
          <div class="support-detail-title">
            <div>
              <h3>${escapeHtml(ticket.concern)}</h3>
              <p>${escapeHtml(ticket.requestType)}</p>
            </div>
            <span class="support-status support-status-resolved">Resolved</span>
          </div>
          <div class="support-detail-meta">
            <div><span>Created</span><strong>${escapeHtml(ticketDate(ticket.createdAt, true))}</strong></div>
            <div><span>Last activity</span><strong>${escapeHtml(ticketDate(ticket.updatedAt || ticket.createdAt, true))}</strong></div>
            <div><span>Ticket no.</span><strong>${escapeHtml(ticket.ticketId)}</strong></div>
          </div>
        </article>
        <div class="support-conversation">
          <article class="support-message support-message-requester">
            <div class="support-message-meta">
              <span class="support-message-avatar">${escapeHtml(requesterName.slice(0, 1).toUpperCase())}</span>
              <strong>${escapeHtml(requesterName)}</strong>
              <time>${escapeHtml(ticketDate(ticket.createdAt, true))}</time>
            </div>
            <p>${escapeHtml(ticket.description)}</p>
            ${attachments ? `<div class="support-attachments">${attachments}</div>` : ''}
          </article>
          <article class="support-message support-message-agent">
            <div class="support-message-meta">
              <span class="support-message-avatar">S</span>
              <strong>EventFlow Support</strong>
              <time>${escapeHtml(ticketDate(ticket.updatedAt || ticket.createdAt, true))}</time>
            </div>
            <p>Your request has been reviewed and resolved. If you still need assistance with this issue, please submit a new support ticket.</p>
          </article>
        </div>
      </div>`;
  }

  async function render(user, backLabel = 'Back to Settings') {
    const categories = allowedCategories(user);
    const isAdmin = ['superuser', 'super_admin', 'admin'].includes(
      String(user?.role || user?.userRole || '').toLowerCase().replace(/-/g, '_'),
    );
    let tickets = [];
    try {
      tickets = await request('/support/tickets', user);
    } catch (error) {
      console.error('Failed to load Customer Support tickets.', error);
    }

    const currentTickets = tickets.filter(ticket => ticket.status !== 'resolved');
    const pastTickets = tickets.filter(ticket => ticket.status === 'resolved');
    const pastTicketSection = `
      <section class="card support-ticket-section support-past-tickets" id="support-past-section" data-past-tickets="${escapeHtml(JSON.stringify(pastTickets))}">
        <div class="support-section-heading">
          <h2>Past Tickets</h2>
          <span>${pastTickets.length}</span>
        </div>
        ${pastTickets.length ? `
          <div class="support-past-controls">
            <label class="support-search">
              <span class="support-visually-hidden">Search past tickets</span>
              <input class="form-control" id="support-past-search" type="search" placeholder="Search requests">
              <span aria-hidden="true">⌕</span>
            </label>
            <label class="support-status-filter">
              <span>Status</span>
              <select class="form-control" id="support-past-status">
                <option value="all">All</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
          </div>
          <div class="support-table-wrap">
            <table class="support-ticket-table">
              <thead><tr><th>Concern</th><th>Ticket no.</th><th>Created</th><th>Last activity</th><th>Status</th></tr></thead>
              <tbody id="support-past-rows">${pastTicketRows(pastTickets)}</tbody>
            </table>
          </div>` : '<p class="support-empty">Resolved tickets will appear here.</p>'}
      </section>`;
    const ticketSection = (title, list, empty) => `
      <section class="card support-ticket-section">
        <div class="support-section-heading">
          <h2>${title}</h2>
          <span>${list.length}</span>
        </div>
        ${list.length ? list.map(ticket => ticketCard(ticket, isAdmin)).join('') : `<p class="support-empty">${empty}</p>`}
      </section>`;

    return `
      <div class="page-hd support-page-heading">
        <div class="page-hd-left">
          <div class="page-title">Customer Support</div>
          <div class="page-sub">Tell us what you need help with. Your ticket number and status will be available here.</div>
        </div>
        <button class="btn btn-ghost" id="support-back" type="button">${escapeHtml(backLabel)}</button>
      </div>
      <div class="support-layout">
        <section class="card card-lg">
          <h2 class="support-card-title">Submit a support request</h2>
          <form id="support-request-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="support-request-type">Request Type <span aria-hidden="true">*</span></label>
              <select class="form-control" id="support-request-type" name="requestType" required>
                <option value="">Select a request type</option>
                ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" id="support-concern-group" hidden>
              <label class="form-label" for="support-concern">Type of Concern <span aria-hidden="true">*</span></label>
              <select class="form-control" id="support-concern" name="concern" required disabled>
                <option value="">Select a concern</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="support-description">Description <span aria-hidden="true">*</span></label>
              <textarea class="form-control" id="support-description" name="description" rows="5" maxlength="5000" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="support-attachments">Attachments <span class="small">(optional; up to 5 files, 5 MB each)</span></label>
              <input class="form-control" id="support-attachments" name="attachments" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.txt">
              <p class="support-hint">Accepted formats: JPG, PNG, WEBP, PDF, TXT.</p>
              <div id="support-selected-files" class="support-selected-files"></div>
            </div>
            <p class="support-feedback" id="support-feedback" role="status" aria-live="polite"></p>
            <button class="btn btn-primary" id="support-submit" type="submit">Submit Request</button>
          </form>
        </section>
        <div class="support-history">
          ${isAdmin
            ? ticketSection('All Support Tickets', tickets, 'No support tickets have been submitted.')
            : `${ticketSection('Current Tickets', currentTickets, 'You have no open or in-progress tickets.')}${pastTicketSection}`}
        </div>
      </div>`;
  }

  function bind(container, user, onBack, backLabel = 'Back to Settings') {
    container.querySelector('#support-back')?.addEventListener('click', onBack);

    const pastSection = container.querySelector('#support-past-section');
    if (pastSection) {
      const ticketsForPastRows = JSON.parse(pastSection.dataset.pastTickets || '[]');
      const initialPastSectionContent = pastSection.innerHTML;
      const showList = () => {
        pastSection.innerHTML = initialPastSectionContent;
        bindPastTicketList();
      };
      const bindPastTicketList = () => {
        const searchInput = pastSection.querySelector('#support-past-search');
        const statusSelect = pastSection.querySelector('#support-past-status');
        const tableRows = pastSection.querySelector('#support-past-rows');
        const drawRows = () => {
          const query = searchInput.value.trim().toLowerCase();
          const filtered = ticketsForPastRows.filter(ticket =>
            (statusSelect.value === 'all' || ticket.status === statusSelect.value)
            && [ticket.ticketId, ticket.concern, ticket.requestType, ticket.description]
              .some(value => String(value || '').toLowerCase().includes(query)),
          );
          tableRows.innerHTML = pastTicketRows(filtered);
        };
        searchInput?.addEventListener('input', drawRows);
        statusSelect?.addEventListener('change', drawRows);
        tableRows?.addEventListener('click', event => {
          const row = event.target.closest('[data-past-ticket-id]');
          if (!row) return;
          const ticket = ticketsForPastRows.find(item => item.ticketId === row.dataset.pastTicketId);
          if (!ticket) return;
          pastSection.innerHTML = pastTicketDetail(ticket, user);
          pastSection.querySelector('#support-past-back')?.addEventListener('click', showList);
          bindAttachmentDownloads(pastSection, user);
        });
        tableRows?.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.target.closest('[data-past-ticket-id]')?.click();
          }
        });
      };
      bindPastTicketList();
    }

    const category = container.querySelector('#support-request-type');
    const concernGroup = container.querySelector('#support-concern-group');
    const concern = container.querySelector('#support-concern');
    category?.addEventListener('change', () => {
      concern.value = '';
      concern.replaceChildren(new Option('Select a concern', ''));
      const concerns = SUPPORT_CONCERNS[category.value] || [];
      concerns.forEach(value => concern.add(new Option(value, value)));
      const visible = Boolean(category.value);
      concernGroup.hidden = !visible;
      concern.disabled = !visible;
      concern.required = visible;
    });

    const files = container.querySelector('#support-attachments');
    files?.addEventListener('change', () => {
      const list = container.querySelector('#support-selected-files');
      list.textContent = Array.from(files.files || []).map(file => file.name).join(', ');
    });

    const form = container.querySelector('#support-request-form');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const feedback = container.querySelector('#support-feedback');
      const submit = container.querySelector('#support-submit');
      feedback.className = 'support-feedback';
      feedback.textContent = '';
      if (!form.reportValidity()) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Complete all required fields before submitting.';
        return;
      }

      const selectedFiles = Array.from(files.files || []);
      const allowedTypes = new Set([
        'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain',
      ]);
      const maxFileSize = 5 * 1024 * 1024;
      if (selectedFiles.length > 5 || selectedFiles.some(file =>
        !allowedTypes.has(file.type) || file.size > maxFileSize,
      )) {
        feedback.classList.add('is-error');
        feedback.textContent = 'Choose up to 5 JPG, PNG, WEBP, PDF, or TXT files, each no larger than 5 MB.';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Submitting...';
      try {
        const attachmentIds = [];
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploaded = await request('/support/attachments', user, {
            method: 'POST',
            body: formData,
          });
          attachmentIds.push(uploaded.attachmentId);
        }

        const created = await request('/support/tickets', user, {
          method: 'POST',
          body: JSON.stringify({
            requestType: category.value,
            concern: concern.value,
            description: container.querySelector('#support-description').value.trim(),
            attachmentIds,
          }),
        });

        feedback.classList.add('is-success');
        feedback.textContent = `Request submitted. Your ticket number is ${created.ticketId}.`;
        form.reset();
        concernGroup.hidden = true;
        concern.disabled = true;
        concern.required = false;
        concern.replaceChildren(new Option('Select a concern', ''));
        container.querySelector('#support-selected-files').textContent = '';
        const page = container.querySelector('#page-content') || container;
        page.innerHTML = await render(user, backLabel);
        bind(page, user, onBack, backLabel);
        const refreshedFeedback = page.querySelector('#support-feedback');
        refreshedFeedback.classList.add('is-success');
        refreshedFeedback.textContent = `Request submitted. Your ticket number is ${created.ticketId}.`;
      } catch (error) {
        feedback.classList.add('is-error');
        feedback.textContent = error.message;
      } finally {
        if (submit.isConnected) {
          submit.disabled = false;
          submit.textContent = 'Submit Request';
        }
      }
    });

    container.querySelectorAll('[data-support-status]').forEach(button => {
      button.addEventListener('click', async () => {
        const feedback = container.querySelector('#support-feedback');
        button.disabled = true;
        try {
          const result = await request(
            `/support/tickets/${encodeURIComponent(button.dataset.ticketId)}/status`,
            user,
            {
              method: 'PATCH',
              body: JSON.stringify({ status: button.dataset.supportStatus }),
            },
          );
          container.innerHTML = await render(user, backLabel);
          bind(container, user, onBack, backLabel);
          const refreshedFeedback = container.querySelector('#support-feedback');
          refreshedFeedback.classList.add('is-success');
          refreshedFeedback.textContent = result.status === 'resolved'
            ? `Ticket ${result.ticketId} resolved. A resolution email was sent to the requester.`
            : `Ticket ${result.ticketId} status updated to ${statusLabel(result.status)}.`;
        } catch (error) {
          button.disabled = false;
          feedback.classList.add('is-error');
          feedback.textContent = error.message;
        }
      });
    });

    bindAttachmentDownloads(container, user);
  }

  function bindAttachmentDownloads(container, user) {
    container.querySelectorAll('[data-support-download]').forEach(button => {
      if (button.dataset.supportDownloadBound) return;
      button.dataset.supportDownloadBound = 'true';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          const response = await fetch(
            `${API_BASE_URL}/support/attachments/${encodeURIComponent(button.dataset.supportDownload)}`,
            { headers: user?.token ? { Authorization: `Bearer ${user.token}` } : {} },
          );
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `Download failed (${response.status})`);
          }
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = button.textContent.trim();
          link.click();
          URL.revokeObjectURL(objectUrl);
        } catch (error) {
          const feedback = container.querySelector('#support-feedback');
          if (feedback) {
            feedback.classList.add('is-error');
            feedback.textContent = error.message;
          } else {
            console.error('Failed to download the support attachment.', error);
          }
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  function addSettingsEntry(container, onOpen) {
    if (container.querySelector('.support-settings-entry')) return;
    const entry = document.createElement('div');
    entry.className = 'card support-settings-entry';
    const button = document.createElement('button');
    button.className = 'btn btn-ghost';
    button.type = 'button';
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 12h3v7H6a2 2 0 0 1-2-2v-5Zm16 0h-3v7h1a2 2 0 0 0 2-2v-5ZM17 19a5 5 0 0 1-5 3"/></svg><span>Customer Support</span>`;
    button.addEventListener('click', onOpen);
    entry.appendChild(button);
    container.appendChild(entry);
  }

  window.EventFlowSupport = { render, bind, addSettingsEntry };
})();
