/* One API-backed renderer for the existing role shells. Demo records live on the server. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pretty = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
  const date = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '—';
  const roles = { super_admin: 'superuser', event_organizer: 'organizer', event_staff: 'staff', attendee: 'attendee', client: 'client' };
  let data, version = 0, activePage = 'dashboard', submitting = false, search = '', status = '', page = 1;
  const finance = () => CU && ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].includes(CU.employeeType);
  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(getAuthHeader() ? { Authorization: getAuthHeader() } : {}), ...options.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || `Request failed (${response.status})`);
    return body;
  }
  function signalChange() { try { localStorage.setItem('ef_backend_refresh', String(Date.now())); } catch {} }
  const button = (text, action, id = '', extra = '') => `<button type="button" class="btn btn-ghost btn-xs" data-action="${action}" data-id="${esc(id)}" ${extra}>${esc(text)}</button>`;
  const selectOptions = (rows, key, name, selected = '') => rows.map(r => `<option value="${esc(r[key])}" ${String(r[key]) === String(selected) ? 'selected' : ''}>${esc(r[name] || r[key])}</option>`).join('');
  function menu() {
    if (!CU) return [];
    if (CU.role === 'superuser') return [['dashboard', 'Dashboard'], ['users', 'Users & Employees'], ['events', 'Events'], ['staff', 'Staff Directory'], ['assignments', 'Staff Assignments'], ['tasks', 'Operation Tasks'], ['employee-reports', 'Employee Reports'], ['revenue-reports', 'Revenue Reports'], ['support-center', 'Support Tickets'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.employeeType === 'REGISTRATION_VERIFICATION') return [['dashboard', 'Dashboard'], ['registrations', 'Registrations'], ['attendeeVerification', 'Attendee Verification'], ['users', 'Attendee Accounts'], ['employee-reports', 'Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.employeeType === 'EVENT_OPERATIONS') return [['dashboard', 'Dashboard'], ['events', 'Events'], ['tasks', 'Operation Tasks'], ['employee-reports', 'Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.employeeType === 'SUPPORT_EXECUTIVE') return [['dashboard', 'Dashboard'], ['support-center', 'Support Tickets'], ['employee-reports', 'Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.role === 'organizer') return [['dashboard', 'Dashboard'], ['events', 'My Events'], ['registrations', 'Registrations'], ['staff', 'Staff Directory'], ['assignments', 'Staff Assignments'], ['event-requests', 'Client Requests'], ['plans', 'Event Plans'], ['reports', 'Event Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.role === 'client') return [['dashboard', 'Dashboard'], ['find-organizers', 'Find Organizers'], ['new-request', 'Request an Event'], ['request-status', 'My Requests'], ['plans', 'Event Plans'], ['events', 'My Events'], ['reports', 'Event Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    if (CU.role === 'attendee') return [['dashboard', 'Dashboard'], ['browse-events', 'Browse Events'], ['my-tickets', 'My Tickets'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
    return [['dashboard', 'Dashboard'], ['assignments', 'Event Invitations'], ['attendeeVerification', 'Attendee Verification'], ['availability', 'My Availability'], ['reports', 'Event Reports'], ['notifications', 'Notifications'], ['settings', 'Account Settings']];
  }
  function nav() { const host = document.getElementById('sb-nav'); if (!host || finance()) return; host.innerHTML = '<div class="sb-section-lbl">Main Menu</div>' + menu().map(([key, title]) => `<button class="sb-item ${activePage === key ? 'active' : ''}" data-pg="${key}" onclick="goNav('${key}')"><span class="ic">◇</span><span>${esc(title)}</span></button>`).join(''); }
  function canonical(pg) {
    if (pg === 'profile') return 'settings';
    if (CU.employeeType && !finance() && pg === 'reports') return 'employee-reports';
    return ({ 'user-reports': 'users', 'event-reports': 'events', 'employee-stats': 'users', 'staff-admin': 'staff', 'staff-event-requests': 'assignments', 'staff-availability': 'availability', 'pending-plans': 'plans', 'attendees': 'registrations', 'upcoming-events': 'events', 'completed-events': 'events', 'ongoing-events': 'events', 'staff-reports': 'reports' })[pg] || pg;
  }
  function cards() {
    const s = data.summary;
    return `<div class="cw-cards">${[['Events', s.events], ['Registrations', s.registrations], ['Checked in', s.checkedIn], ['Pending requests', s.pendingRequests], ...(data.viewRevenue ? [['Gross demo ticket revenue', money(s.gross / 100)], ['Completed demo refunds', money(s.refunded / 100)], ['Net demo revenue', money(s.net / 100)]] : []), ['Pending employee reports', s.pendingReports], ['Open operation tasks', s.openTasks]].map(([name, value]) => `<article class="cw-card"><span>${esc(name)}</span><strong>${esc(value)}</strong></article>`).join('')}</div>`;
  }
  function bars(title, rows) {
    const max = Math.max(1, ...rows.map(r => r.value));
    return `<article class="cw-panel"><h3>${esc(title)}</h3>${rows.length ? rows.map(r => `<div class="cw-bar-row"><span>${esc(r.label)}</span><div><i style="width:${Math.round(r.value / max * 100)}%"></i></div><strong>${esc(r.display ?? r.value)}</strong></div>`).join('') : '<p>No records yet.</p>'}</article>`;
  }
  function rowsFor(key) {
    if (key === 'users') return data.users;
    if (key === 'registrations' || key === 'my-tickets') return data.registrations;
    if (key === 'events' || key === 'browse-events') return data.events;
    if (key === 'tasks') return data.tasks;
    if (key === 'employee-reports') return data.reports;
    if (key === 'request-status' || key === 'event-requests') return data.requests;
    if (key === 'notifications') return data.notifications;
    if (key === 'staff') return data.staff;
    if (key === 'assignments') return data.assignments;
    if (key === 'support-center') return data.supportTickets;
    if (key === 'plans') return data.plans || [];
    if (key === 'reports') return data.actor.userRole === 'event_staff' ? data.staffReports || [] : data.eventReports;
    if (key === 'find-organizers') return data.organizers;
    return [];
  }
  const cols = {
    users: [['name', 'Name'], ['email', 'Email'], ['userRole', 'Role'], ['employeeType', 'Department'], ['status', 'Status']],
    events: [['name', 'Event'], ['date', 'Date'], ['location', 'Venue'], ['capacity', 'Capacity'], ['registered', 'Reserved / sold'], ['ticketPrice', 'Ticket', 'money'], ['status', 'Status']],
    registrations: [['registrationId', 'Booking'], ['attendeeName', 'Attendee'], ['eventName', 'Event'], ['status', 'Booking status'], ['reviewStatus', 'Employee review'], ['registrationDate', 'Registered']],
    'my-tickets': [['registrationId', 'Booking'], ['eventName', 'Event'], ['status', 'Status'], ['registrationDate', 'Registered']],
    tasks: [['title', 'Task'], ['eventName', 'Event'], ['assignedToName', 'Assignee'], ['status', 'Status']],
    'employee-reports': [['title', 'Report'], ['department', 'Department'], ['submittedByName', 'From'], ['createdAt', 'Sent', 'date'], ['status', 'Status']],
    'event-requests': [['eventName', 'Event'], ['eventDate', 'Date'], ['budget', 'Budget', 'money'], ['status', 'Request'], ['agreementStatus', 'Agreement'], ['paymentStatus', 'Recorded deposit']],
    notifications: [['message', 'Notification'], ['createdAt', 'Date', 'date'], ['read', 'Read']],
    staff: [['name', 'Staff'], ['status', 'Availability'], ['rating', 'Rating']],
    assignments: [['eventName', 'Event'], ['status', 'Invitation'], ['assignedAt', 'Invited', 'date']],
    'support-center': [['requesterName', 'Requester'], ['concern', 'Concern'], ['description', 'Description'], ['status', 'Status'], ['createdAt', 'Created', 'date']],
    plans: [['title', 'Plan'], ['budget', 'Budget', 'money'], ['description', 'Description'], ['approvalStatus', 'Approval']],
    reports: [['reportTitle', 'Report'], ['reportDetails', 'Contents'], ['status', 'Status'], ['createdAt', 'Submitted', 'date']],
    'find-organizers': [['name', 'Organizer'], ['organizerId', 'Reference']],
  };
  function key(r) { return r.userId || r.registrationId || r.eventId || r.assignmentId || r.staffId || r.ticketId || r.eventPlanId || r.eventReportId || r.staffReportId || r.notificationId || r.requestId || r.id || r.organizerId; }
  function rowActions(pg, r) {
    const keys = { users: 'userId', staff: 'staffId', notifications: 'notificationId', 'event-requests': 'requestId', 'request-status': 'requestId', assignments: 'assignmentId', plans: 'eventPlanId', registrations: 'registrationId', 'my-tickets': 'registrationId', 'support-center': 'ticketId', 'find-organizers': 'organizerId' };
    const id = r[keys[pg] || 'id'] || r.eventReportId || r.staffReportId || r.eventId;
    let result = button('Details', 'details', id);
    if (pg === 'users' && data.permissions.manageUsers && r.userId !== data.actor.userId) result += button(r.status === 'active' ? 'Suspend' : 'Activate', 'user-status', id);
    if (pg === 'users' && data.permissions.manageUsers && r.userId !== data.actor.userId) result += button('Edit account', 'edit-user', id);
    if (pg === 'users' && data.permissions.admin && ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].includes(r.employeeType)) result += button('Finance permissions', 'finance-permissions', id);
    if (pg === 'events' && data.permissions.manageEvents) result += button('Edit', 'edit-event', id) + (r.status === 'draft' ? button('Publish', 'publish-event', id) : '') + (['published', 'ongoing'].includes(r.status) ? button('Update status', 'event-status', id) : '');
    if (pg === 'browse-events' && r.status === 'published') result += button(r.registered >= r.capacity ? 'Join waitlist' : 'Register', 'register', id);
    if (pg === 'registrations' && ['REGISTRATION_VERIFICATION'].includes(data.actor.employeeType)) result += button('Approve review', 'review-registration', id) + button('Flag', 'flag-registration', id);
    if (pg === 'my-tickets' && ['registered', 'pending_payment', 'waitlisted'].includes(r.status)) result += (r.status === 'pending_payment' ? button('Demo payment', 'pay', id) : '') + (r.status === 'waitlisted' && r.offerExpiresAt && +new Date(r.offerExpiresAt) > Date.now() ? button('Claim available seat', 'waitlist', id) : '') + button('Cancel', 'cancel-registration', id);
    if (pg === 'my-tickets' && ['registered', 'attended'].includes(r.status)) result += button('Ticket QR', 'ticket', id);
    if (pg === 'my-tickets' && r.status === 'attended') result += button('Review event', 'event-review', id);
    if (pg === 'tasks' && (data.actor.employeeType === 'EVENT_OPERATIONS' || data.permissions.admin)) result += button('Edit task', 'edit-task', id);
    if (pg === 'employee-reports' && data.permissions.admin && r.status === 'submitted') result += button('Review', 'review-report', id);
    if (pg === 'staff' && ['event_organizer', 'super_admin'].includes(data.actor.userRole)) result += button('Invite', 'invite', id);
    if (pg === 'assignments' && r.status === 'pending' && data.actor.userRole === 'event_staff') result += button('Accept', 'accept-assignment', id) + button('Decline', 'decline-assignment', id);
    if (pg === 'assignments' && ['event_organizer', 'super_admin'].includes(data.actor.userRole) && !['completed', 'cancelled'].includes(r.status)) result += button('Cancel invitation', 'cancel-assignment', id) + (r.status === 'accepted' ? button('Mark completed', 'complete-assignment', id) : '');
    if (pg === 'assignments' && data.actor.userRole === 'event_organizer' && ['accepted', 'completed'].includes(r.status)) result += button('Rate staff', 'staff-review', id);
    if (pg === 'notifications' && !r.read) result += button('Mark read', 'read-notification', id);
    if (pg === 'plans' && data.actor.userRole === 'client' && r.approvalStatus === 'pending') result += button('Approve', 'approve-plan', id) + button('Reject', 'reject-plan', id);
    if ((pg === 'event-requests' || pg === 'request-status') && data.actor.userRole === 'event_organizer') {
      if (['submitted', 'pending'].includes(r.status)) result += button('Start review', 'request-review', id);
      if (['submitted', 'pending', 'under_review', 'info_requested'].includes(r.status)) result += button('Ask client', 'request-info', id) + button('Send proposal', 'request-proposal', id) + button('Reject', 'request-reject', id);
      if (r.status === 'awaiting_client') result += button('Record demo deposit', 'request-deposit', id) + button('Confirm booking', 'request-confirm', id);
      if (r.status === 'proposal_sent') result += button('Revise proposal', 'request-proposal', id);
    }
    if ((pg === 'event-requests' || pg === 'request-status') && data.actor.userRole === 'client') {
      if (r.status === 'info_requested') result += button('Provide information', 'provide-info', id);
      if (r.status === 'proposal_sent') result += button('Accept proposal', 'accept-proposal', id) + button('Request revision', 'revise-proposal', id);
      if (r.status === 'awaiting_client') result += button('Sign agreement', 'sign-agreement', id);
      if (!['confirmed', 'approved', 'cancelled', 'rejected', 'withdrawn', 'expired'].includes(r.status)) result += button('Withdraw', 'withdraw-request', id);
    }
    if (pg === 'support-center' && (data.permissions.admin || data.actor.employeeType === 'SUPPORT_EXECUTIVE')) result += button('Respond / update', 'support-status', id);
    return result.replaceAll('data-action=', `data-scope="${pg}" data-action=`);
  }
  function table(pg) {
    let rows = rowsFor(pg);
    const statuses = [...new Set(rows.map(r => r.status).filter(Boolean))];
    rows = rows.filter(r => (!status || r.status === status) && (!search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())));
    const count = rows.length, totalPages = Math.max(1, Math.ceil(count / 20)); page = Math.min(page, totalPages);
    const columns = cols[pg] || (pg === 'browse-events' ? cols.events : cols['event-requests']);
    return `<form id="cw-filter" class="cw-filters"><label>Search<input name="search" value="${esc(search)}" placeholder="Search these records"></label><label>Status<select name="status"><option value="">All statuses</option>${statuses.map(s => `<option ${s === status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label><button class="btn btn-primary">Apply</button><button type="button" class="btn btn-ghost" data-action="reset">Reset</button></form>${count ? `<div class="cw-table"><table><thead><tr>${columns.map(([, title]) => `<th>${title}</th>`).join('')}<th>Actions</th></tr></thead><tbody>${rows.slice((page - 1) * 20, page * 20).map(r => `<tr>${columns.map(([key, , fmt]) => `<td>${esc(fmt === 'money' ? money(r[key]) : fmt === 'date' ? date(r[key]) : r[key] == null ? '—' : typeof r[key] === 'boolean' ? r[key] ? 'Yes' : 'No' : r[key])}</td>`).join('')}<td><div class="cw-actions">${rowActions(pg, r)}</div></td></tr>`).join('')}</tbody></table></div>` : '<div class="cw-empty">No matching records.</div>'}<div class="cw-actions"><span>${count} records · Page ${page} of ${totalPages}</span>${button('Previous', 'previous', '', page <= 1 ? 'disabled' : '')}${button('Next', 'next', '', page >= totalPages ? 'disabled' : '')}</div>`;
  }
  async function render(pg) {
    const ticket = ++version; activePage = canonical(pg); nav();
    const host = document.getElementById('page-content');
    host.innerHTML = '<div class="cw-workspace"><p role="status">Loading current workspace records…</p></div>';
    try {
      data = await api('/workspace');
      if (ticket !== version) return;
      CU.employeeType = data.actor.employeeType; CU.name = data.actor.name; CU.role = roles[data.actor.userRole]; CU.userRole = data.actor.userRole; setCurrentUser(CU);
      if (routeToRoleWorkspace(CU)) return;
      if (!menu().some(([key]) => key === activePage) && !finance()) { host.innerHTML = '<div class="cw-workspace"><p role="alert">This page is not available for your role.</p></div>'; return; }
      nav();
      let body = '', title = menu().find(([key]) => key === activePage)?.[1] || pretty(activePage);
      if (activePage === 'dashboard') {
        body = cards() + '<div class="cw-grid">' + bars('Event status', Object.entries(data.events.reduce((all, r) => { all[r.status] = (all[r.status] || 0) + 1; return all; }, {})).map(([label, value]) => ({ label: pretty(label), value }))) + bars('Registration status', Object.entries(data.registrations.reduce((all, r) => { all[r.status] = (all[r.status] || 0) + 1; return all; }, {})).map(([label, value]) => ({ label: pretty(label), value }))) + '</div>';
        body += `<article class="cw-panel"><h3>Recent notifications</h3>${data.notifications.slice(0, 6).map(n => `<p>${esc(n.message)} <small>${esc(date(n.createdAt))}</small></p>`).join('') || '<p>No notifications.</p>'}</article>`;
      } else if (activePage === 'settings') body = settings();
      else if (activePage === 'new-request') body = '<article class="cw-panel"><p>Send your event requirements to an organizer. Track proposals and agreements under My Requests.</p>' + button('Create event request', 'new-request') + '</article>';
      else if (activePage === 'attendeeVerification') body = verification();
      else if (activePage === 'availability') body = `<article class="cw-panel"><h3>Available dates</h3><p>One date per line (YYYY-MM-DD). An empty list means no date restrictions.</p><form id="cw-availability"><textarea name="dates" rows="8">${esc((data.staff[0]?.availableDates || []).join('\n'))}</textarea><button class="btn btn-primary">Save availability</button></form></article>`;
      else if (activePage === 'revenue-reports') {
        const financial = await api('/finance/dashboard'); if (ticket !== version) return;
        const configuration = await api('/finance/config'); if (ticket !== version) return;
        body = cards() + bars('Gross ticket revenue by event', financial.events.map(e => ({ label: e.eventName, value: e.gross, display: money(e.gross / 100) }))) + `<article class="cw-panel"><h3>Commission policies</h3><p>Rates use basis points: 100 basis points = 1%. No rate is assumed until configured. Settlement allocations retain their policy version.</p>${button('Add policy version', 'new-policy')}<div class="cw-table"><table><thead><tr><th>Policy</th><th>Scope</th><th>Rate (basis points)</th><th>Effective from</th></tr></thead><tbody>${configuration.policies.map(p => `<tr><td>${esc(p.id)}</td><td>${esc(data.events.find(e => e.eventId === p.eventId)?.name || p.eventId || 'Platform default')}</td><td>${p.basisPoints}</td><td>${esc(p.effectiveDate)}</td></tr>`).join('') || '<tr><td colspan="4">No commission policy configured.</td></tr>'}</tbody></table></div></article><div id="cw-finance-inbox"></div>`;
      } else {
        if (activePage === 'plans') { const plans = await api('/event-plans'); if (ticket !== version) return; data.plans = plans; }
        if (activePage === 'reports' && data.actor.userRole === 'event_staff') { data.staffReports = await api('/reports/staff'); if (ticket !== version) return; data.staffReports = data.staffReports.map(r => ({ ...r, reportTitle: 'Event staff report', reportDetails: r.reportText })); }
        let actions = '';
        if (activePage === 'users' && data.permissions.admin) actions += button('Create user / employee', 'new-user');
        if (activePage === 'events' && ['super_admin', 'event_organizer'].includes(data.actor.userRole)) actions += button('Create event', 'new-event');
        if (activePage === 'tasks') actions += button('Create operation task', 'new-task');
        if (activePage === 'employee-reports' && data.permissions.employee) actions += button('Submit report to Super Admin', 'new-report');
        if (activePage === 'reports' && ['event_organizer', 'event_staff'].includes(data.actor.userRole)) actions += button('Submit event report', 'new-event-report');
        if (activePage === 'plans' && data.actor.userRole === 'event_organizer') actions += button('Create event plan', 'new-plan');
        if (activePage === 'staff') actions += button('Invite staff to event', 'invite');
        if (activePage === 'notifications') actions += button('Mark all read', 'read-all');
        body = `<article class="cw-panel"><div class="cw-actions">${actions}</div>${table(activePage)}</article>`;
      }
      host.innerHTML = `<section class="cw-workspace"><header class="page-hd"><div><h1>${esc(title)}</h1><p class="muted">${esc(data.actor.name)} · Current backend records · Updated ${esc(date(data.generatedAt))}</p></div><div class="cw-actions">${button('Refresh', 'refresh')}${button('Customer Support', 'customer-support')}</div></header>${body}<div id="cw-feedback" role="status"></div><dialog id="cw-dialog"></dialog></section>`;
      bind(host);
      const dot = document.getElementById('notif-count-dot'); if (dot) dot.style.display = data.notifications.some(n => !n.read) ? 'block' : 'none';
      if (activePage === 'revenue-reports') await window.EventFlowReportInbox.mount(host.querySelector('#cw-finance-inbox'), { admin: true });
    } catch (error) {
      if (ticket !== version) return;
      host.innerHTML = `<section class="cw-workspace"><h1>Workspace data unavailable</h1><p role="alert">${esc(error.message)}</p>${button('Retry', 'refresh')}${button('Sign out', 'logout')}</section>`; bind(host);
    }
  }
  function settings() {
    const u = data.actor;
    return `<div class="cw-grid"><article class="cw-panel"><h3>Personal information</h3><form id="cw-account">${field('name', 'Full name', 'text', u.name)}${field('email', 'Email', 'email', u.email)}${field('phoneNo', 'Indian mobile number', 'text', u.phoneNo || '', false)}${field('bio', 'Bio', 'textarea', u.bio || '', false)}<h3>Preferences</h3>${['emailNotifications', 'smsReminders', 'eventRecommendations'].map(k => `<label><span><input type="checkbox" name="${k}" ${u.preferences?.[k] ? 'checked' : ''}> ${esc(pretty(k.replace(/([A-Z])/g, ' $1')))}</span></label>`).join('')}<button class="btn btn-primary">Save changes</button></form></article><article class="cw-panel"><h3>Change password</h3><form id="cw-password">${field('currentPassword', 'Current password', 'password')}${field('newPassword', 'New password (8+ characters)', 'password')}${field('confirmPassword', 'Confirm password', 'password')}<button class="btn btn-primary">Update password</button></form><div class="cw-actions">${button('Sign out', 'logout')}</div></article></div>`;
  }
  function verification() {
    if (!data.permissions.verify) return '<p>Attendance verification is not permitted for this department.</p>';
    const events = data.actor.employeeType === 'REGISTRATION_VERIFICATION' || data.permissions.admin ? data.events : data.events.filter(e => data.assignments.some(a => a.eventId === e.eventId && a.status === 'accepted'));
    return `<article class="cw-panel"><h3>Verify an event ticket</h3><form id="cw-verify"><label>Event<select name="eventId" required>${selectOptions(events, 'eventId', 'name')}</select></label><label>Ticket verification ID<input id="qr-input" name="verificationId" required autocomplete="off"></label><div id="ticket-camera" hidden><video id="ticket-camera-video" muted autoplay playsinline></video></div><p id="ticket-scan-status" hidden role="status"></p><div class="cw-actions"><button class="btn btn-primary" type="submit">Verify & check in</button><button class="btn btn-ghost" type="button" id="ticket-scan-start" data-action="scan">Scan QR</button><button class="btn btn-ghost" type="button" id="ticket-scan-stop" data-action="stop-scan" hidden>Stop camera</button></div></form><p>Cancelled, unpaid, waitlisted, previously used, and other-event tickets are rejected by the server.</p></article>`;
  }
  function field(name, title, type = 'text', value = '', required = true) { return `<label>${esc(title)}${type === 'textarea' ? `<textarea name="${name}" ${required ? 'required' : ''}>${esc(value)}</textarea>` : `<input name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${type === 'number' ? 'min="0" step="any"' : ''}>`}</label>`; }
  function dropdown(name, title, rows, key, label, value) { return `<label>${esc(title)}<select name="${name}" required>${selectOptions(rows, key, label, value)}</select></label>`; }
  function form(title, fields, submit) {
    const dialog = document.getElementById('cw-dialog');
    dialog.innerHTML = `<header class="cw-actions"><h2>${esc(title)}</h2><button class="btn btn-ghost" data-close type="button">Close</button></header><form id="cw-form">${fields}<button class="btn btn-primary" type="submit">Save / submit</button><p role="alert" id="cw-form-error"></p></form>`;
    dialog.showModal(); dialog.querySelector('[data-close]').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault(); if (submitting) return; submitting = true;
      const submissionVersion = version, submissionPage = activePage;
      const button = event.currentTarget.querySelector('button[type=submit]'); button.disabled = true;
      try { const result = await submit(Object.fromEntries(new FormData(event.currentTarget))); signalChange(); if (submissionVersion !== version) return; dialog.close(); await render(submissionPage); const feedback = document.getElementById('cw-feedback'); if (feedback) feedback.textContent = result?.message || 'Changes saved to the backend.'; }
      catch (error) { const target = dialog.querySelector('#cw-form-error'); if (target) target.textContent = error.message; }
      finally { submitting = false; button.disabled = false; }
    };
  }
  async function mutate(path, body = {}, method = 'POST') { const ticket = version, pg = activePage; const result = await api(path, { method, body: JSON.stringify(body) }); signalChange(); if (ticket === version) await render(pg); return result; }
  function details(r) {
    const dialog = document.getElementById('cw-dialog');
    dialog.innerHTML = `<header class="cw-actions"><h2>Record details</h2><button class="btn btn-ghost" data-close>Close</button></header><dl>${Object.entries(r).filter(([k]) => !['qrCode', 'password', 'key'].includes(k)).map(([k, v]) => `<dt>${esc(pretty(k))}</dt><dd>${esc(v && typeof v === 'object' ? JSON.stringify(v, null, 2) : v ?? '—')}</dd>`).join('')}</dl>`;
    dialog.showModal(); dialog.querySelector('[data-close]').onclick = () => dialog.close();
  }
  const ownOrg = () => data.organizers.find(o => o.userId === data.actor.userId);
  function eventForm(existing) {
    const e = existing || {};
    const match = String(e.time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    const time = match ? `${String(match[3] ? Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0) : Number(match[1])).padStart(2, '0')}:${match[2]}` : '';
    const fields = field('name', 'Event name', 'text', e.name) + field('category', 'Category', 'text', e.category || 'General') + field('date', 'Event date', 'date', e.date) + field('time', 'Time', 'time', time) + field('location', 'Venue', 'text', e.location) + field('description', 'Description', 'textarea', e.description || '', false) + field('capacity', 'Capacity', 'number', e.capacity || 100) + field('ticketPrice', 'Ticket price (INR, demo provider)', 'number', e.ticketPrice || 0) + field('registrationDeadline', 'Registration deadline', 'date', e.registrationDeadline || e.date, false) + field('cancellationDeadline', 'Cancellation deadline', 'date', e.cancellationDeadline || e.date, false) + `<label><span><input type="checkbox" name="waitlistEnabled" ${e.waitlistEnabled ? 'checked' : ''}> Enable waitlist when full</span></label>` + (data.permissions.admin && !existing ? dropdown('organizerId', 'Organizer', data.organizers, 'organizerId', 'name') : '');
    form(existing ? 'Edit event' : 'Create event', fields, values => { for (const name of ['registrationDeadline', 'cancellationDeadline']) if (!values[name]) delete values[name]; return api(existing ? `${data.actor.employeeType === 'EVENT_OPERATIONS' ? '/workspace' : ''}/events/${e.eventId}` : '/events', { method: existing ? 'PUT' : 'POST', body: JSON.stringify({ ...values, waitlistEnabled: values.waitlistEnabled === 'on', capacity: Number(values.capacity), ticketPrice: Number(values.ticketPrice), ...(!existing && !data.permissions.admin ? { organizerId: ownOrg()?.organizerId } : {}) }) }); });
  }
  async function action(name, id, scope) {
    const pg = scope || activePage, rows = rowsFor(pg), r = rows.find(r => [r.userId, r.registrationId, r.eventId, r.staffId, r.notificationId, r.id, r.requestId, r.assignmentId, r.ticketId, r.eventPlanId, r.eventReportId, r.staffReportId].includes(id));
    if (name === 'refresh') return render(pg);
    if (name === 'reset') { search = ''; status = ''; page = 1; return render(pg); }
    if (name === 'previous' || name === 'next') { page += name === 'next' ? 1 : -1; return render(pg); }
    if (name === 'customer-support') return goNav('customer-support');
    if (name === 'logout') return doLogout();
    if (name === 'details') return details(r);
    if (name === 'new-event' || name === 'edit-event') return eventForm(r);
    if (name === 'new-user') return form('Create user / employee', field('name', 'Name') + field('email', 'Email', 'email') + field('password', 'Initial password (8+ characters)', 'password') + dropdown('userRole', 'Role', ['attendee', 'client', 'event_organizer', 'event_staff', 'super_admin'].map(id => ({ id, label: pretty(id) })), 'id', 'label') + `<label>Employee department (staff only)<select name="employeeType"><option value="">Ordinary event staff</option>${['REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE'].map(x => `<option>${x}</option>`).join('')}</select></label>`, values => { if (!values.employeeType || values.userRole !== 'event_staff') delete values.employeeType; return api('/users', { method: 'POST', body: JSON.stringify(values) }); });
    if (name === 'user-status') { if (confirm(`Change account status for ${r.name}?`)) return mutate(`/workspace/users/${id}/status`, { status: r.status === 'active' ? 'suspended' : 'active' }, 'PATCH'); return; }
    if (name === 'edit-user') return form('Edit account information', field('name', 'Name', 'text', r.name) + field('email', 'Email', 'email', r.email) + field('phoneNo', 'Indian mobile', 'text', r.phoneNo || '', false) + (data.permissions.admin && r.userRole === 'event_staff' ? `<label>Employee department<select name="employeeType"><option value="">Ordinary event staff</option>${['REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS', 'FINANCE_EXECUTIVE', 'SUPPORT_FINANCE', 'SUPPORT_EXECUTIVE'].map(v => `<option ${v === r.employeeType ? 'selected' : ''}>${v}</option>`).join('')}</select></label>` : ''), values => api(`/workspace/users/${id}`, { method: 'PATCH', body: JSON.stringify(values) }));
    if (name === 'finance-permissions') return form('Finance approval permission', `<p>${esc(r.name)}</p><p>Current grants: ${esc(data.financeGrants.filter(g => g.userId === id).map(g => g.permission).join(', ') || 'No approval permissions')}</p>` + dropdown('permission', 'Permission', ['refund.approve', 'settlement.approve'].map(id => ({ id, title: id })), 'id', 'title') + dropdown('enabled', 'Access', [{ id: 'true', title: 'Grant permission' }, { id: 'false', title: 'Revoke permission' }], 'id', 'title'), values => api('/finance/permissions', { method: 'POST', body: JSON.stringify({ ...values, userId: id, enabled: values.enabled === 'true' }) }));
    if (name === 'new-policy') return form('Add commission policy version', `<label>Scope<select name="eventId"><option value="">Platform default</option>${selectOptions(data.events, 'eventId', 'name')}</select></label>` + field('basisPoints', 'Contractual rate (basis points)', 'number') + field('effectiveDate', 'Effective from', 'date'), values => { if (!values.eventId) delete values.eventId; return api('/finance/commission-policies', { method: 'POST', body: JSON.stringify({ ...values, basisPoints: Number(values.basisPoints) }) }); });
    if (name === 'review-registration') return mutate(`/workspace/registrations/${id}/review`, { status: 'approved' }, 'PATCH');
    if (name === 'flag-registration') return form('Flag registration for review', field('reason', 'Reason', 'textarea'), values => api(`/workspace/registrations/${id}/review`, { method: 'PATCH', body: JSON.stringify({ ...values, status: 'flagged' }) }));
    if (name === 'publish-event') return mutate(data.actor.employeeType === 'EVENT_OPERATIONS' || data.permissions.admin ? `/workspace/events/${id}/status` : `/events/${id}`, { status: 'published' }, data.actor.employeeType === 'EVENT_OPERATIONS' || data.permissions.admin ? 'PATCH' : 'PUT');
    if (name === 'event-status') return form('Update event status', dropdown('status', 'New status', (r.status === 'published' ? ['ongoing', 'cancelled'] : ['completed', 'cancelled']).map(id => ({ id, title: pretty(id) })), 'id', 'title'), values => api(data.actor.employeeType === 'EVENT_OPERATIONS' || data.permissions.admin ? `/workspace/events/${id}/status` : `/events/${id}`, { method: data.actor.employeeType === 'EVENT_OPERATIONS' || data.permissions.admin ? 'PATCH' : 'PUT', body: JSON.stringify(values) }));
    if (name === 'new-task' || name === 'edit-task') return form('Operation task', field('title', 'Task', 'text', r?.title) + dropdown('eventId', 'Event', data.events, 'eventId', 'name', r?.eventId) + dropdown('assignedTo', 'Assign to', data.users.filter(u => u.employeeType === 'EVENT_OPERATIONS'), 'userId', 'name', r?.assignedTo) + dropdown('status', 'Status', ['pending', 'in_progress', 'blocked', 'completed'].map(id => ({ id, title: pretty(id) })), 'id', 'title', r?.status), values => api(r ? `/workspace/tasks/${r.id}` : '/workspace/tasks', { method: r ? 'PATCH' : 'POST', body: JSON.stringify(values) }));
    if (name === 'new-report') { const requestKey = crypto.randomUUID(); return form('Send employee report to Super Admin', field('title', 'Report title') + field('content', 'Report content / findings', 'textarea'), values => api('/workspace/reports', { method: 'POST', body: JSON.stringify({ ...values, key: requestKey }) })); }
    if (name === 'review-report') return form('Review employee report', `<p>${esc(r.title)}</p><p>${esc(r.content)}</p>` + field('notes', 'Feedback to employee', 'textarea', '', false), values => api(`/workspace/reports/${id}/review`, { method: 'POST', body: JSON.stringify(values) }));
    if (name === 'register') return mutate('/registrations', { attendeeId: data.attendees[0]?.attendeeId, eventId: id, ticketType: 'General Admission', joinWaitlist: r.registered >= r.capacity });
    if (name === 'pay') { const event = data.events.find(e => e.eventId === r.eventId), amount = r.ticketPriceAtBooking ?? event.ticketPrice; if (confirm(`Complete a simulated payment of ${money(amount)}? No real money moves.`)) return mutate('/payments', { registrationId: id, amount, paymentMethod: 'DEMO_PROVIDER', paymentDate: new Date().toISOString() }); return; }
    if (name === 'waitlist') return mutate(`/registrations/${id}/waitlist/confirm`);
    if (name === 'cancel-registration') return form('Cancel registration', field('reason', 'Cancellation reason', 'textarea'), values => api(`/registrations/${id}/cancel`, { method: 'PATCH', body: JSON.stringify(values) }));
    if (name === 'ticket') { const qr = await api(`/registrations/${id}`); const ticket = qr.data || qr; details({ ...ticket, qrCode: undefined }); const dialog = document.getElementById('cw-dialog'); if (ticket.verificationId && window.renderTicketQRCode) { const image = document.createElement('div'); image.className = 'cw-ticket-qr'; image.innerHTML = window.renderTicketQRCode(ticket.verificationId); dialog.append(image); } return; }
    if (name === 'event-review' || name === 'staff-review') return form(name === 'event-review' ? 'Review event' : 'Rate event staff', dropdown('rating', 'Rating', [1, 2, 3, 4, 5].map(id => ({ id, label: `${id} / 5` })), 'id', 'label', 5) + field('comment', 'Review', 'textarea'), values => api(name === 'event-review' ? '/reviews/events' : '/reviews/staff', { method: 'POST', body: JSON.stringify({ ...values, rating: Number(values.rating), eventId: r.eventId, reviewerId: name === 'event-review' ? data.attendees[0]?.attendeeId : ownOrg()?.organizerId, ...(name === 'staff-review' ? { staffId: r.staffId } : {}) }) }));
    if (name === 'invite') return form('Invite staff to an event', dropdown('eventId', 'Event', data.events, 'eventId', 'name') + dropdown('staffId', 'Staff member', data.staff, 'staffId', 'name', id), values => { const event = data.events.find(e => e.eventId === values.eventId); return api('/staff-assignments', { method: 'POST', body: JSON.stringify({ ...values, organizerId: event.organizerId }) }); });
    if (name === 'accept-assignment' || name === 'decline-assignment') return mutate(`/staff-assignments/${id}/status`, { status: name === 'accept-assignment' ? 'accepted' : 'declined' }, 'PATCH');
    if (name === 'cancel-assignment' || name === 'complete-assignment') { if (confirm('Update this staff assignment?')) return mutate(`/staff-assignments/${id}/status`, { status: name === 'cancel-assignment' ? 'cancelled' : 'completed' }, 'PATCH'); return; }
    if (name === 'read-notification') return mutate(`/notifications/${id}/read`, {}, 'PATCH');
    if (name === 'read-all') return mutate('/notifications/read-all', {}, 'PATCH');
    if (name === 'new-request') return form('Request an event', dropdown('organizerId', 'Organizer', data.organizers, 'organizerId', 'name') + field('eventName', 'Event name') + field('eventDate', 'Desired date', 'date') + field('budget', 'Budget (INR)', 'number') + field('capacity', 'Attendees', 'number', 100) + field('requirements', 'Requirements', 'textarea'), values => api('/event-requests', { method: 'POST', body: JSON.stringify({ ...values, clientId: data.clientId, budget: Number(values.budget), capacity: Number(values.capacity) }) }));
    if (name === 'request-review') return mutate(`/event-requests/${id}/review`);
    if (name === 'request-info' || name === 'provide-info') { const client = name === 'provide-info'; return form(client ? 'Respond to organizer' : 'Ask client for details', field(client ? 'response' : 'message', 'Message', 'textarea'), values => api(`/event-requests/${id}/${client ? 'provide-info' : 'request-info'}`, { method: 'POST', body: JSON.stringify(values) })); }
    if (name === 'request-reject') return form('Reject request', field('reason', 'Rejection reason', 'textarea'), values => api(`/event-requests/${id}/reject`, { method: 'POST', body: JSON.stringify(values) }));
    if (name === 'request-proposal') return form('Send proposal', field('amount', 'Total amount (INR)', 'number', r.budget) + field('depositRequired', 'Required deposit (INR)', 'number', 0) + field('proposedDate', 'Proposed date', 'date', r.eventDate) + field('validUntil', 'Valid until', 'date') + field('terms', 'Terms', 'textarea'), values => api(`/event-requests/${id}/proposal`, { method: 'POST', body: JSON.stringify({ ...values, amount: Number(values.amount), depositRequired: Number(values.depositRequired) }) }));
    if (['accept-proposal', 'revise-proposal', 'withdraw-request'].includes(name)) return form(pretty(name.replace(/-/g, ' ')), field('notes', 'Notes', 'textarea', '', name !== 'accept-proposal'), values => api(`/event-requests/${id}/client-response`, { method: 'POST', body: JSON.stringify({ ...values, decision: name === 'accept-proposal' ? 'accept' : name === 'revise-proposal' ? 'request_revision' : 'withdraw' }) }));
    if (name === 'sign-agreement') { if (confirm('Record your agreement to the accepted proposal terms?')) return mutate(`/event-requests/${id}/agreement`, { agreementStatus: 'agreed' }); return; }
    if (name === 'request-confirm') return mutate(`/event-requests/${id}/confirm`, {});
    if (name === 'request-deposit') { if (confirm('Record demo deposit bookkeeping? This records a demo status and transfers no money.')) return mutate(`/event-requests/${id}/payment`, { paymentStatus: 'deposit_paid' }); return; }
    if (name === 'approve-plan' || name === 'reject-plan') return mutate(`/event-plans/${id}/approval`, { approvalStatus: name === 'approve-plan' ? 'approved' : 'rejected' }, 'PATCH');
    if (name === 'new-plan') return form('Create event plan', dropdown('clientId', 'Client', data.clients || [], 'clientId', 'name') + field('title', 'Plan title') + field('description', 'Description', 'textarea') + field('budget', 'Budget (INR)', 'number') + field('capacity', 'Capacity', 'number', 100), values => api('/event-plans', { method: 'POST', body: JSON.stringify({ ...values, budget: Number(values.budget), capacity: Number(values.capacity), organizerId: ownOrg()?.organizerId }) }));
    if (name === 'new-event-report') return form('Submit event report', dropdown('eventId', 'Event', data.events, 'eventId', 'name') + field('reportTitle', 'Report title') + field('reportDetails', 'Report content', 'textarea'), values => { const event = data.events.find(e => e.eventId === values.eventId); return api(data.actor.userRole === 'event_staff' ? '/reports/staff' : '/reports/events', { method: 'POST', body: JSON.stringify(data.actor.userRole === 'event_staff' ? { staffId: data.staff[0]?.staffId, organizerId: event.organizerId, eventId: event.eventId, reportText: values.reportDetails } : { ...values, organizerId: event.organizerId, ...(event.clientId ? { clientId: event.clientId } : {}), submissionDate: new Date().toISOString().slice(0, 10) }) }); });
    if (name === 'support-status') return form('Respond to support ticket', `<p>${esc(r.description)}</p>` + dropdown('status', 'Status', ['open', 'in_progress', 'resolved'].map(id => ({ id, title: pretty(id) })), 'id', 'title', r.status) + field('response', 'Response', 'textarea'), values => api(`/support/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify(values) }));
    if (name === 'scan') return startCamera();
    if (name === 'stop-scan') return stopCamera();
  }
  function stopCamera() { window.stopTicketScan?.(); }
  function startCamera() { return window.startTicketScan?.(); }
  const legacyQRInput = window.handleQRInput;
  window.handleQRInput = value => { if (!document.getElementById('cw-verify')) return legacyQRInput?.(value); document.getElementById('qr-input')?.dispatchEvent(new Event('input', { bubbles: true })); };
  function bind(host) {
    host.querySelectorAll('[data-action]').forEach(b => b.onclick = async () => {
      if (b.disabled || submitting) return; b.disabled = true;
      try { await action(b.dataset.action, b.dataset.id, b.dataset.scope); } catch (error) { const output = document.getElementById('cw-feedback'); if (output) output.textContent = error.message; }
      finally { b.disabled = false; }
    });
    const filter = host.querySelector('#cw-filter'); if (filter) filter.onsubmit = event => { event.preventDefault(); const values = Object.fromEntries(new FormData(filter)); search = values.search; status = values.status; page = 1; render(activePage); };
    const bindForm = (id, handler) => { const form = host.querySelector(id); if (form) form.onsubmit = async event => { event.preventDefault(); if (submitting) return; submitting = true; const button = form.querySelector('button'); button.disabled = true; try { await handler(Object.fromEntries(new FormData(form)), form); signalChange(); } catch (error) { host.querySelector('#cw-feedback').textContent = error.message; } finally { submitting = false; button.disabled = false; } }; };
    bindForm('#cw-account', async (values, form) => { values.preferences = Object.fromEntries(['emailNotifications', 'smsReminders', 'eventRecommendations'].map(k => [k, form.elements[k].checked])); const result = await api('/workspace/account', { method: 'PATCH', body: JSON.stringify(values) }); if (result.reauthenticate) { alert('Profile saved. Sign in with your updated email.'); doLogout(); return; } Object.assign(CU, { name: result.user.name, email: result.user.email }); setCurrentUser(CU); updateHeaderUser(); host.querySelector('#cw-feedback').textContent = 'Profile saved.'; });
    bindForm('#cw-password', async (values, form) => { if (values.newPassword !== values.confirmPassword) throw new Error('Passwords do not match'); await api('/workspace/password', { method: 'POST', body: JSON.stringify(values) }); form.reset(); host.querySelector('#cw-feedback').textContent = 'Password updated.'; });
    bindForm('#cw-availability', async values => { const dates = values.dates.split(/[\s,]+/).filter(Boolean); if (dates.some(v => !/^\d{4}-\d{2}-\d{2}$/.test(v))) throw new Error('Use YYYY-MM-DD dates'); await api(`/staff/${data.staff[0]?.staffId}`, { method: 'PUT', body: JSON.stringify({ availableDates: dates }) }); host.querySelector('#cw-feedback').textContent = 'Availability saved.'; });
    bindForm('#cw-verify', async values => { const staff = data.staff.find(s => s.userId === data.actor.userId); await api('/attendance/verify', { method: 'POST', body: JSON.stringify({ ...values, staffId: staff?.staffId || data.actor.userId, checkInTime: new Date().toISOString() }) }); stopCamera(); await render(activePage); document.getElementById('cw-feedback').textContent = 'Attendance verified and saved.'; });
  }
  const originalRender = renderPageContent, originalBuildNav = buildNav, originalEmployeeNav = buildEmployeeNav, originalGoNav = goNav, originalLogout = doLogout;
  doLogout = function() { version++; stopCamera(); data = null; return originalLogout(); };
  let firstNavigation = true;
  renderPageContent = async function(pg) {
    if (!CU || finance() && !['notifications', 'customer-support'].includes(pg)) { version++; stopCamera(); return originalRender(pg); }
    if (pg === 'customer-support') {
      const ticket = ++version; stopCamera(); const host = document.getElementById('page-content');
      host.innerHTML = '<p role="status">Loading customer support…</p>';
      try { const html = await window.EventFlowSupport.render(CU); if (ticket !== version) return; host.innerHTML = html; window.EventFlowSupport.bind(host, CU, () => goNav('settings')); }
      catch (error) { if (ticket !== version) return; host.innerHTML = `<section class="cw-workspace"><h1>Support unavailable</h1><p role="alert">${esc(error.message)}</p><button class="btn btn-ghost" id="cw-support-retry">Retry</button></section>`; host.querySelector('#cw-support-retry').onclick = () => goNav('customer-support'); }
      return;
    }
    stopCamera(); return render(pg);
  };
  buildNav = function(role) { if (finance()) return originalBuildNav(role); nav(); };
  buildEmployeeNav = function(type) { if (finance()) return originalEmployeeNav(type); nav(); };
  goNav = function(pg) {
    if (!CU || finance()) return originalGoNav(pg);
    if (firstNavigation) { firstNavigation = false; const initial = location.hash.slice(1); if (pg === 'dashboard' && menu().some(([key]) => key === initial)) pg = initial; }
    const next = pg === 'customer-support' ? pg : canonical(pg);
    if (next !== activePage) { search = ''; status = ''; page = 1; }
    if (location.hash !== '#' + next) history.pushState(null, '', '#' + next);
    activePage = next; _currentPage = next; stopCamera(); nav(); updateHeaderUser();
    renderPage(next).catch(error => console.error(error));
  };
  doLogin = async function() {
    const email = document.getElementById('l-email')?.value.trim(), password = document.getElementById('l-pass')?.value;
    if (!email || !password) { toast('Enter email and password', 'error'); return; }
    const button = document.querySelector('#login .btn-primary'); if (button?.disabled) return; if (button) button.disabled = true;
    try { const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); acceptLogin(result.data); }
    catch (error) { toast(error.message, 'error'); }
    finally { if (button) button.disabled = false; }
  };
  function acceptLogin(user) {
    CU = { ...user, id: user.userId, role: roles[user.userRole], token: user.token, avatar: user.name.split(' ').map(v => v[0]).join('').slice(0, 2) };
    setCurrentUser(CU); if (routeToRoleWorkspace(CU)) return; initApp(); showPage('app'); document.documentElement.classList.remove('restoring-session');
  }
  openRegisterModal = function() {
    openModal('Create an EventFlow account', `<form id="cw-signup" class="cw-form">${field('name', 'Full name')}${field('email', 'Email', 'email')}${field('password', 'Password (8+ characters)', 'password')}${dropdown('userRole', 'Account type', ['attendee', 'client', 'event_organizer', 'event_staff'].map(id => ({ id, title: pretty(id) })), 'id', 'title')}<button class="btn btn-primary" type="submit">Create account</button><p role="alert" id="cw-signup-error"></p></form>`, []);
    const form = document.getElementById('cw-signup'); form.onsubmit = async event => { event.preventDefault(); const button = form.querySelector('button'); if (button.disabled) return; button.disabled = true; try { const result = await api('/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); closeModal(); acceptLogin(result.data); } catch (error) { form.querySelector('#cw-signup-error').textContent = error.message; } finally { button.disabled = false; } };
  };
  const originalShowPage = showPage;
  let publicGeneration = 0;
  async function publicEvents(search = '') {
    const host = document.getElementById('find-events'); if (!host) return;
    const ticket = ++publicGeneration;
    host.innerHTML = '<section class="cw-workspace"><p role="status">Loading available events…</p></section>';
    try {
      const events = await api(`/public/events?search=${encodeURIComponent(search)}`);
      if (ticket !== publicGeneration) return;
      host.innerHTML = `<section class="cw-workspace"><header class="page-hd"><img src="/images/eventflow-logo.png" alt="EventFlow" width="180"><button class="btn btn-ghost" id="cw-public-home">Back to home</button></header><h1>Find Events</h1><form id="cw-public-search" class="cw-filters"><label>Search events<input name="search" value="${esc(search)}" placeholder="Event or venue"></label><button class="btn btn-primary">Search</button></form><div class="cw-grid">${events.map(e => `<article class="cw-panel"><h2>${esc(e.name)}</h2><p>${esc(date(e.date))} · ${esc(e.location)}</p><p>${esc(e.description || '')}</p><p>${esc(money(e.ticketPrice))} · ${Math.max(0, e.capacity - e.registered)} places available</p><button class="btn btn-primary" data-public-register="${esc(e.eventId)}">Sign in to register</button></article>`).join('') || '<p>No matching published events.</p>'}</div></section>`;
      host.querySelector('#cw-public-home').onclick = () => originalShowPage('landing');
      host.querySelector('#cw-public-search').onsubmit = event => { event.preventDefault(); publicEvents(new FormData(event.currentTarget).get('search')); };
      host.querySelectorAll('[data-public-register]').forEach(b => b.onclick = () => { if (CU?.role === 'attendee') { originalShowPage('app'); goNav('browse-events'); } else gotoLogin('attendee'); });
    } catch (error) { if (ticket === publicGeneration) { host.innerHTML = `<section class="cw-workspace"><h1>Event catalog unavailable</h1><p>${esc(error.message)}</p><button class="btn btn-ghost" id="cw-public-retry">Retry</button><button class="btn btn-ghost" id="cw-public-home">Back to home</button></section>`; host.querySelector('#cw-public-retry').onclick = () => publicEvents(search); host.querySelector('#cw-public-home').onclick = () => originalShowPage('landing'); } }
  }
  showPage = function(name) { originalShowPage(name); if (name === 'find-events') publicEvents(); };
  window.addEventListener('popstate', () => { if (CU && !finance()) goNav(location.hash.slice(1) || 'dashboard'); });
  window.addEventListener('storage', event => { if (event.key === 'ef_backend_refresh' && CU && document.getElementById('app')?.style.display !== 'none' && !document.querySelector('dialog[open]')) { if (finance()) renderPage(_currentPage); else render(activePage); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); });
  window.EventFlowConnectedWorkspace = { render, stopCamera, api, nav };
})();
