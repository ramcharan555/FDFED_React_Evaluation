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
      'Event revenue not showing correctly',
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
    return GENERAL_CATEGORIES;
  }

  async function request(endpoint, user, options = {}) {
    const headers = {
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (response.ok && options.method && options.method !== 'GET') window.EventFlowData?.invalidate();

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

  function canManageSupport(user) {
    const normalize = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    const role = normalize(user?.role || user?.userRole);
    const type = normalize(user?.employeeType);
    // Existing executive accounts still use the legacy staff role in saved sessions.
    return ['superuser', 'super_admin', 'admin'].includes(role) ||
      (['staff', 'event_staff', 'employee'].includes(role) && ['support_executive', 'registration_verification', 'event_operations'].includes(type));
  }

  function statusLabel(status) {
    return ({
      open: 'Open',
      in_progress: 'In progress',
      resolved: 'Resolved',
    })[status] || status;
  }

  function ticketDate(value, includeTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, includeTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' });
  }

  function ticketTable(title, tickets, isSupportAgent) {
    const rows = tickets.length ? tickets.map(ticket => `
      <tr>
        <td><strong>${escapeHtml(ticket.concern)}</strong><small>${escapeHtml(ticket.ticketId)}</small>${ticket.eventTitle ? `<small>Event: ${escapeHtml(ticket.eventTitle)}</small>` : ''}${isSupportAgent ? `<small>${escapeHtml(ticket.requesterName)} · ${escapeHtml(ticket.requesterEmail || '')}</small>` : ''}</td>
        <td>${escapeHtml(ticket.requestType)}</td>
        <td><span class="support-status support-status-${escapeHtml(ticket.status)}">${escapeHtml(statusLabel(ticket.status))}</span></td>
        <td>${escapeHtml(ticket.updatedLabel || ticketDate(ticket.updatedAt || ticket.createdAt, true))}</td>
        <td><button class="btn btn-ghost btn-sm" type="button" data-ticket-view="${escapeHtml(ticket.ticketId)}">${isSupportAgent ? 'Review &amp; Respond' : 'View'}</button></td>
      </tr>`).join('') : '<tr><td class="support-table-empty" colspan="5">No support requests yet.</td></tr>';

    return `
      <section class="card support-ticket-section">
        <div class="support-section-heading"><h2>${escapeHtml(title)}</h2><span>${tickets.length}</span></div>
        <div class="support-table-wrap"><table class="support-ticket-table">
          <thead><tr><th>Request</th><th>Category</th><th>Status</th><th>Updated</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
      </section>`;
  }

  function ticketDialog(ticket, user, isSupportAgent) {
    const attachments = (ticket.attachments || []).map(attachment => `
      <button class="support-file-link" type="button" data-support-download="${escapeHtml(attachment.attachmentId)}">
        ${escapeHtml(attachment.originalName)}
      </button>`).join('');
    const messages = [
      { sender: 'requester', message: ticket.description, createdAt: ticket.createdAt },
      ...((ticket.messages || []).length
        ? ticket.messages
        : (ticket.response ? [{ sender: 'support', message: ticket.response, createdAt: ticket.updatedAt || ticket.createdAt }] : [])),
    ];
    const conversation = messages.map(message => {
      const fromSupport = message.sender === 'support';
      const name = fromSupport ? (message.senderName ? 'Support - ' + message.senderName : 'Support') : (isSupportAgent ? (ticket.requesterName || 'Requester') : (user?.name || 'You'));
      return `
        <article class="support-message ${fromSupport ? 'support-message-agent' : 'support-message-requester'}">
          <div class="support-message-meta"><span class="support-message-avatar">${escapeHtml(name.slice(0, 1).toUpperCase())}</span><strong>${escapeHtml(name)}</strong><time>${escapeHtml(ticketDate(message.createdAt, true))}</time></div>
          <p>${escapeHtml(message.message)}</p>
          ${!fromSupport && message.message === ticket.description && attachments ? `<div class="support-attachments">${attachments}</div>` : ''}
        </article>`;
    }).join('');
    const actions = isSupportAgent ? `
      <label class="support-reply-editor"><span>Reply to requester</span><textarea class="form-control" rows="3" maxlength="2000" data-support-response="${escapeHtml(ticket.ticketId)}" placeholder="e.g. Your issue has been resolved. Please try again and let us know if you still need help."></textarea></label>
      <label class="support-status-editor" for="support-ticket-status"><span>Update status</span>
        <select class="form-control" id="support-ticket-status" data-support-status-select>
          <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>In progress</option>
          <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </label>
      <p class="support-feedback" data-status-feedback role="status" aria-live="polite"></p>
      <div class="support-ticket-actions"><button class="btn btn-primary" type="button" data-support-status-update data-ticket-id="${escapeHtml(ticket.ticketId)}">Send Reply &amp; Update Status</button></div>` : `
      <form class="support-follow-up" data-follow-up-form="${escapeHtml(ticket.ticketId)}">
        <label for="support-follow-up-message">Follow-up message</label>
        <textarea class="form-control" id="support-follow-up-message" name="message" rows="4" maxlength="2000" required></textarea>
        <p class="support-feedback" data-follow-up-feedback role="status" aria-live="polite"></p>
        <div class="support-modal-footer"><button class="btn btn-ghost" type="button" data-modal-close>Cancel</button><button class="btn btn-primary" type="submit">Send Follow-up</button></div>
      </form>`;

    return `
      <div class="support-modal-heading"><h2 id="support-modal-title">Support Request ${escapeHtml(ticket.ticketId)}</h2><button class="support-modal-x" type="button" aria-label="Close" data-modal-close>×</button></div>
      <div class="support-modal-body">
        ${isSupportAgent ? `<div class="support-modal-summary"><span>Requested by</span><strong>${escapeHtml(ticket.requesterName || 'Requester')}<small style="display:block;font-weight:400">${escapeHtml(ticket.requesterEmail || '')}</small></strong></div>` : ''}
        <div class="support-modal-summary"><span>Subject</span><strong>${escapeHtml(ticket.concern)}</strong></div>
        ${ticket.eventTitle ? `<div class="support-modal-summary"><span>Event</span><strong>${escapeHtml(ticket.eventTitle)}</strong></div>` : ''}
        <div class="support-modal-summary"><span>Status</span><strong><span class="support-status support-status-${escapeHtml(ticket.status)}">${escapeHtml(statusLabel(ticket.status))}</span></strong></div>
        <div class="support-conversation">${conversation}</div>
        ${actions}
      </div>`;
  }

  async function render(user, backLabel = 'Back to Settings', options = {}) {
    const categories = allowedCategories(user);
    const isSupportAgent = options.management === true || canManageSupport(user);
    let tickets = [];
    let ticketLoadError = '';
    try {
      tickets = await request('/support/tickets', user);
    } catch (error) {
      ticketLoadError = error.message || 'Unable to load support tickets.';
      console.error('Failed to load Customer Support tickets.', error);
    }
    if (isSupportAgent && options.getAdditionalTickets) {
      const existingIds = new Set(tickets.map(ticket => String(ticket.ticketId)));
      tickets = [...tickets, ...options.getAdditionalTickets().filter(ticket => !existingIds.has(String(ticket.ticketId)))];
    }

    return `
      <div class="page-hd support-page-heading">
        <div class="page-hd-left">
          <div class="page-title">${isSupportAgent ? 'Support &amp; Issue Management' : 'Customer Support'}</div>
          <div class="page-sub">${isSupportAgent ? 'Review requester tickets, update their status, and send replies visible in My Tickets.' : 'Tell us what you need help with. Your ticket number, status, and support replies will be available here.'}</div>
        </div>
      </div>
      ${isSupportAgent ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
        <button type="button" class="btn btn-ghost" data-support-refresh>Refresh Requests</button>
        <span class="support-status support-status-open">Open: ${tickets.filter(ticket => ticket.status === 'open').length}</span>
        <span class="support-status support-status-in_progress">In progress: ${tickets.filter(ticket => ticket.status === 'in_progress').length}</span>
        <span class="support-status support-status-resolved">Resolved: ${tickets.filter(ticket => ticket.status === 'resolved').length}</span>
      </div>` : ''}
      <div class="support-layout" style="${isSupportAgent ? 'grid-template-columns:minmax(0,1fr)' : ''}">
        ${ticketLoadError ? `<p class="support-feedback support-feedback-error" role="alert">Could not load support tickets: ${escapeHtml(ticketLoadError)}</p>` : ''}
        <section class="card card-lg" style="${isSupportAgent ? 'display:none' : ''}">
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
        <div class="support-history" data-support-tickets="${escapeHtml(JSON.stringify(tickets))}">${ticketTable(isSupportAgent ? (options.queueTitle || 'Received Support Requests') : 'My Support Requests', tickets, isSupportAgent)}</div>
      </div>
      <div class="support-modal-overlay" id="support-ticket-modal" hidden>
        <section class="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
          <div id="support-modal-content"></div>
        </section>
      </div>`;
  }

  function bind(container, user, onBack, backLabel = 'Back to Settings', options = {}) {
    const history = container.querySelector('.support-history');
    const tickets = JSON.parse(history?.dataset.supportTickets || '[]');
    const modal = container.querySelector('#support-ticket-modal');
    const modalContent = container.querySelector('#support-modal-content');
    const isSupportAgent = options.management === true || canManageSupport(user);
    const closeModal = () => { if (modal) modal.hidden = true; };
    const openTicket = ticket => {
      if (!modal || !ticket) return;
      modalContent.innerHTML = ticketDialog(ticket, user, isSupportAgent);
      modal.hidden = false;
      bindAttachmentDownloads(modal, user);
      modalContent.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
      const followUpForm = modalContent.querySelector('[data-follow-up-form]');
      followUpForm?.addEventListener('submit', async event => {
        event.preventDefault();
        const feedback = followUpForm.querySelector('[data-follow-up-feedback]');
        const submit = followUpForm.querySelector('button[type="submit"]');
        const message = followUpForm.elements.message.value.trim();
        if (!message) {
          feedback.classList.add('is-error');
          feedback.textContent = 'Enter a follow-up message.';
          return;
        }
        submit.disabled = true;
        try {
          await request(`/support/tickets/${encodeURIComponent(ticket.ticketId)}/follow-ups`, user, {
            method: 'POST', body: JSON.stringify({ message }),
          });
          await refreshTicketView(ticket.ticketId);
        } catch (error) {
          submit.disabled = false;
          feedback.classList.add('is-error');
          feedback.textContent = error.message;
        }
      });
      modalContent.querySelectorAll('[data-support-status-update]').forEach(button => {
        button.addEventListener('click', async () => {
          const responseField = modalContent.querySelector(`[data-support-response="${ticket.ticketId}"]`);
          const response = responseField?.value.trim() || '';
          const status = modalContent.querySelector('[data-support-status-select]')?.value;
          const feedback = modalContent.querySelector('[data-status-feedback]');
          if (status === 'resolved' && !response) {
            feedback.classList.add('is-error');
            feedback.textContent = 'Add a reply before resolving this request.';
            responseField?.focus();
            return;
          }
          button.disabled = true;
          try {
            const updated = ticket.localEventRequest
              ? await options.updateAdditionalTicket(ticket.ticketId, { status, response })
              : await request(`/support/tickets/${encodeURIComponent(ticket.ticketId)}/status`, user, {
                  method: 'PATCH', body: JSON.stringify({ status, response }),
                });
            const notice = response
              ? (ticket.localEventRequest
                ? `Reply saved. Status: ${statusLabel(status)}.`
                : `Reply sent to the requester. Status: ${statusLabel(status)}.${updated.emailNotificationSent ? ' An email notification was also sent.' : ''}`)
              : `Ticket status updated to ${statusLabel(status)}.`;
            await refreshTicketView(ticket.ticketId, notice);
          } catch (error) {
            button.disabled = false;
            feedback.classList.add('is-error');
            feedback.textContent = error.message;
          }
        });
      });
    };
    container.querySelectorAll('[data-ticket-view]').forEach(button => {
      button.addEventListener('click', () => openTicket(tickets.find(ticket => ticket.ticketId === button.dataset.ticketView)));
    });
    modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    modal?.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

    const refreshTicketView = async (ticketId, notice = '') => {
      const page = container.querySelector('#page-content') || container;
      page.innerHTML = await render(user, backLabel, options);
      bind(page, user, onBack, backLabel, options);
      const refreshedButton = Array.from(page.querySelectorAll('[data-ticket-view]'))
        .find(button => button.dataset.ticketView === ticketId);
      refreshedButton?.click();
      if (notice) {
        const feedback = page.querySelector('[data-status-feedback]');
        if (feedback) {
          feedback.classList.add('is-success');
          feedback.textContent = notice;
        }
      }
    };

    container.querySelector('[data-support-refresh]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try { await refreshTicketView(null); }
      finally { button.disabled = false; }
    });

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
        page.innerHTML = await render(user, backLabel, options);
        bind(page, user, onBack, backLabel, options);
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

  function canRequestSupport(user) {
    if (!user) return false;
    const normalize = value => String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const role = normalize(user.role || user.userRole);
    return ['ATTENDEE', 'CLIENT', 'ORGANIZER', 'EVENT_ORGANIZER'].includes(role);
  }

  function addSettingsEntry(container, onOpen, user) {
    const existing = container.querySelector('.support-settings-entry');
    if (!canRequestSupport(user)) {
      existing?.remove();
      return;
    }
    if (existing) return;
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

  window.EventFlowSupport = { render, bind, addSettingsEntry, canRequestSupport, canManageSupport };
})();
