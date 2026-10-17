(() => {
  const roleNames = { super_admin: 'superuser', event_organizer: 'organizer', event_staff: 'staff' };
  const key = 'eventflow-data-change';
  const state = { identity: '', snapshot: null, flight: null, pending: false, rendering: 0, sequence: 0, epoch: 0, editedElement: null };
  const payload = response => response?.data ?? response;
  const date = value => value ? String(value).slice(0, 10) : '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const current = () => typeof CU !== 'undefined' ? CU : null;
  const database = () => typeof DB !== 'undefined' ? DB : null;
  const field = id => document.getElementById(id)?.value?.trim() || '';
  const userId = user => user?.userId || user?.id;
  const identity = user => `${userId(user)}:${user?.token || ''}`;

  async function request(user, route, options = {}) {
    if (!user?.token && route !== '/auth/register') throw new Error('Sign in again to load your account data.');
    const response = await fetch((window.API_BASE_URL || 'http://localhost:3001/api') + route, {
      ...options, headers: { ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message || 'The server could not save this change.');
    return payload(result);
  }

  function normalizeUser(user, profiles = []) {
    const profile = profiles.find(item => item.userId === user.userId);
    return { ...user.profile, ...user, id: user.userId, role: roleNames[user.userRole] || user.userRole,
      employeeType: user.employeeType === 'FINANCE_EXECUTIVE' ? 'SUPPORT_FINANCE' : user.employeeType,
      phone: user.phoneNo || '', joined: date(user.createdAt),
      avatar: user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
      service: String(user.profile?.service || (user.employeeType ? 'Employee' : user.userRole === 'event_staff' ? 'Event Staff' : 'Event Organizer')),
      eventTypes: String(user.profile?.eventCategories || '').split(',').filter(Boolean),
      rating: user.rating || profile?.rating || 0, availableDates: profile?.availableDates || [],
    };
  }

  function apply(snapshot, user, db) {
    db.users = snapshot.users.map(item => normalizeUser(item, snapshot.staffProfiles));
    db.events = snapshot.events.map(event => ({ ...event, id: event.eventId, title: event.name,
      price: event.ticketPrice, venue: event.location, organizer: event.organizerUserId,
      backendClientId: event.clientId, clientId: event.clientUserId,
      backendStatus: event.status, status: event.status === 'published' ? 'upcoming' : event.status === 'draft' ? 'pending' : event.status,
      emoji: '📅', color: '#7c6ff7', description: event.description || '',
    }));
    db.registrations = snapshot.registrations.map(registration => ({ ...registration,
      id: registration.registrationId, backendAttendeeId: registration.attendeeId,
      attendeeId: registration.attendee?.userId || registration.attendeeId,
      date: registration.registrationDate, backendStatus: registration.status,
      status: registration.status === 'registered' ? 'confirmed' : registration.status,
      payment: registration.payment?.status === 'completed' ? 'paid' : registration.payment?.status || (registration.event?.ticketPrice === 0 ? 'free' : 'pending'),
      amount: registration.payment?.amount || 0, verified: registration.reviewStatus === 'approved' || registration.status === 'attended',
      verificationStatus: registration.status === 'rejected' ? 'Rejected' : registration.reviewStatus === 'approved' || registration.status === 'attended' ? 'Verified'
        : registration.status === 'cancelled' ? 'Cancelled' : registration.status === 'no-show' ? 'No Show' : 'Pending Review',
      ticketId: registration.verificationId || registration.registrationId,
      checkedIn: registration.checkInStatus === 'checked-in' || registration.status === 'attended',
    }));
    db.eventRequests = snapshot.eventRequests.map(item => ({ ...item, id: item.requestId,
      clientId: item.clientUserId, organizer: item.organizerUserId, title: item.eventName,
      type: item.eventType, date: item.eventDate, guests: item.capacity, desc: item.requirements, created: date(item.createdAt),
    }));
    db.eventPlans = snapshot.eventPlans.map(item => ({ ...item, id: item.eventPlanId }));
    db.staffAssignments = snapshot.staffAssignments.map(item => ({ ...item, id: item.assignmentId,
      backendStaffId: item.staffId,
      staffId: snapshot.staffProfiles.find(profile => profile.staffId === item.staffId)?.userId || item.staffId,
      organizer: db.users.find(candidate => candidate.organizerId === item.organizerId)?.id,
    }));
    db.staffRequests = db.staffAssignments.map(item => ({ ...item, organizerId: item.organizer, message: item.notes || '', createdAt: item.assignedAt }));
    db.staffAvailability = Object.fromEntries(snapshot.staffProfiles.map(profile => [profile.userId, profile.availableDates]));
    db.staffBooked = {};
    db.staffAssignments.filter(item => item.status === 'accepted').forEach(item => {
      const event = db.events.find(event => event.id === item.eventId);
      if (event) (db.staffBooked[item.staffId] ||= []).push(event.date);
    });
    db.notifications = snapshot.notifications.map(item => ({ ...item, id: item.notificationId,
      notificationType: item.type, title: typeof notificationTitle === 'function' ? notificationTitle(item.type) : item.type.replaceAll('_', ' '),
      msg: item.message, time: new Date(item.dateTime).toLocaleString(), icon: '🔔',
    }));
    db.supportRequests = snapshot.supportTickets.map(item => ({ ...item, id: item.ticketId, subject: item.concern,
      status: { open: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' }[item.status],
      date: date(item.createdAt), updated: new Date(item.updatedAt).toLocaleString(),
    }));
    db.userQueries = [];
    db.eventOperationsTasks = db.supportRequests.filter(item => item.requestType === 'Event Related Issues')
      .map(item => ({ ...item, backendTicket: true, type: item.concern, eventTitle: 'Event support', updated: item.updated }));
    db.eventOpsRequests = [];
    db.financeTransactions = snapshot.payments.map(payment => {
      const registration = db.registrations.find(item => item.id === payment.registrationId);
      return { ...payment, kind: 'ticket', id: payment.paymentId, userId: registration?.attendeeId, eventId: registration?.eventId,
        status: { completed: 'Successful', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' }[payment.status],
        date: payment.paymentDate, method: payment.paymentMethod };
    });
    db.eventWorkflowPayments = snapshot.eventWorkflowPayments;
    db.financeTransactions.push(...snapshot.eventWorkflowPayments.map(payment => ({ ...payment, kind: 'event',
      id: payment.paymentId, userId: db.users.find(user => user.clientId === payment.clientId)?.id,
      status: payment.status === 'completed' ? 'Successful' : payment.status, date: payment.paymentDate, method: payment.paymentMethod,
    })));
    db.financeRefunds = snapshot.refunds.map(refund => {
      const registration = db.registrations.find(item => item.id === refund.registrationId);
      return { ...refund, id: refund.refundId, userId: registration?.attendeeId, eventId: registration?.eventId,
        status: { pending: 'Requested', completed: 'Completed', failed: 'Failed', not_applicable: 'Not applicable' }[refund.status], date: date(refund.requestedAt) };
    });
    db.financeRefunds.push(...(snapshot.eventWorkflowRefunds || []).map(refund => ({ ...refund, id: refund.refundId,
      userId: db.users.find(user => user.clientId === refund.clientId)?.id, status: 'Requested', date: date(refund.requestedAt),
    })));
    db.staffReports = snapshot.staffReports;
    db.reports = snapshot.staffReports.map(report => ({ ...report, id: report.staffReportId, notes: report.reportText,
      staffId: snapshot.staffProfiles.find(profile => profile.staffId === report.staffId)?.userId || report.staffId,
      submitted: date(report.createdAt), submittedAt: report.createdAt, type: 'Attendance Report', title: 'Attendance Report' }));
    db.operationalReports = snapshot.supportReports.map(report => ({ ...report, id: report.reportId, backendReportId: report.reportId,
      type: report.category, owner: report.author, status: { draft: 'Draft', submitted: 'Submitted', reviewed: 'Reviewed' }[report.status], updated: date(report.updatedAt) }));
    const profile = normalizeUser(snapshot.currentUser, snapshot.staffProfiles);
    const previousType = user.employeeType;
    Object.assign(user, profile);
    if (previousType !== user.employeeType && user.employeeType && typeof buildEmployeeNav === 'function') buildEmployeeNav(user.employeeType);
    try { sessionStorage.setItem('ef_cu', JSON.stringify(user)); } catch {}
    if (typeof updateNotifDot === 'function') updateNotifDot();
    if (typeof updateHeaderUser === 'function') updateHeaderUser();
    const sidebarName = document.getElementById('sb-name');
    if (sidebarName && !user.employeeType) sidebarName.textContent = user.name;
  }

  async function sync(user = current(), db = database(), { force = true } = {}) {
    if (!user?.token || !db) return false;
    const session = identity(user);
    if (state.identity !== session) Object.assign(state, { identity: session, snapshot: null, flight: null, pending: false });
    if (!force && state.snapshot) { apply(state.snapshot, user, db); return false; }
    if (!state.flight || state.flight.epoch !== state.epoch) {
      const flight = { promise: request(user, '/workspace'), epoch: state.epoch };
      state.flight = flight;
      flight.promise.finally(() => { if (state.flight === flight) state.flight = null; }).catch(() => {});
    }
    const flight = state.flight;
    const snapshot = await flight.promise;
    if (state.identity !== session || !current() || identity(current()) !== session) return false;
    if (flight.epoch !== state.epoch) return sync(user, db);
    const changed = state.snapshot?.version !== snapshot.version;
    state.snapshot = snapshot;
    apply(snapshot, user, db);
    return changed;
  }

  function invalidate() {
    state.epoch++;
    state.pending = true;
    try { localStorage.setItem(key, `${Date.now()}:${Math.random()}`); } catch {}
  }

  function editing() {
    return state.editedElement?.isConnected || document.querySelector('#modal-overlay.open, #modal-overlay.show, #drawer-overlay.open, #confirm-overlay.open, .support-modal-overlay:not([hidden])') ||
      document.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]');
  }

  async function refresh() {
    if (!current()?.token || document.hidden || state.rendering) return;
    try {
      // Do not replace form state while the user is editing or reviewing a report.
      if (editing()) { state.pending = true; return; }
      const changed = await sync();
      state.pending ||= changed;
      if (state.pending && typeof _currentPage !== 'undefined' && _currentPage) {
        state.pending = false;
        await window.renderPage(_currentPage, { cached: true });
      }
    } catch (error) {
      const notice = document.getElementById('data-sync-notice');
      if (notice) notice.textContent = error.message;
    }
  }

  const mutations = new Set();
  async function mutate(id, action, message, { close = true, page } = {}) {
    if (mutations.has(id)) return;
    mutations.add(id);
    let saved = false;
    try {
      const result = await action();
      saved = true;
      if (!current()?.token) return result;
      state.editedElement = null;
      invalidate();
      if (close && typeof closeModal === 'function') closeModal();
      await sync();
      await window.renderPage(page || _currentPage, { cached: true });
      if (typeof toast === 'function') toast(message, 'success');
      return result;
    } catch (error) {
      if (typeof toast === 'function') toast(saved ? `Saved, but the page could not refresh: ${error.message}` : error.message, 'error');
    } finally { mutations.delete(id); }
  }

  function patch(name, handler) { if (typeof window[name] === 'function') window[name] = handler; }
  const send = (route, method, body) => request(current(), route, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
  const findUser = id => database().users.find(user => String(user.id) === String(id));
  const isSupport = () => window.EventFlowAccountPolicy.isSupportExecutiveAccount(current());
  function customerRoute(id) { return `${isSupport() ? '/workspace/customers' : '/users'}/${encodeURIComponent(id)}`; }
  function manageUser(id, fields) {
    const target = findUser(id);
    if (!window.EventFlowAccountPolicy.canManageAccount(current(), target)) return toast('Only an admin can change employee or admin accounts.', 'error');
    if (fields.role && fields.role !== target.role) return toast('Account roles cannot be changed from this form.', 'error');
    if (!fields.name || !fields.email?.includes('@')) return toast('Enter a name and valid email.', 'error');
    return mutate(`user:${id}`, () => send(customerRoute(id), 'PATCH', {
      name: fields.name, email: fields.email, ...(fields.phone ? { phoneNo: fields.phone } : {}),
      ...(fields.status ? { status: fields.status === 'deactivated' ? 'inactive' : fields.status } : {}),
    }), 'User details updated');
  }

  function install() {
    const render = window.renderPage;
    if (render) window.renderPage = async function(pg, { cached = false } = {}) {
      const sequence = ++state.sequence;
      state.rendering++;
      _currentPage = pg;
      const session = current() ? identity(current()) : '';
      try {
        if (current() && !current().token) throw new Error('Sign in again to load your account data.');
        await sync(current(), database(), { force: !cached });
        if (sequence !== state.sequence || _currentPage !== pg || (session && (!current() || identity(current()) !== session))) return;
        await render(pg);
      } catch (error) {
        if (sequence !== state.sequence || _currentPage !== pg) return;
        const container = document.getElementById('page-content');
        if (container) container.innerHTML = `<div class="empty"><div class="empty-title">Data could not be loaded</div><p class="empty-desc" id="data-sync-notice" role="status">${esc(error.message)}</p><button class="btn btn-primary" type="button" data-sync-retry>Try Again</button></div>`;
        container?.querySelector('[data-sync-retry]')?.addEventListener('click', () => window.renderPage(pg));
      } finally { state.rendering--; }
    };
    patch('saveEditUser', id => manageUser(id, { name: field('edit-usr-name'), email: field('edit-usr-email'), phone: field('edit-usr-phone'), role: field('edit-usr-role') }));
    patch('saveUser', id => manageUser(id, { name: field('um-edit-name'), email: field('um-edit-email'), phone: field('um-edit-phone'), role: field('um-edit-role'), status: field('um-edit-status') }));
    patch('toggleUserStatus', id => {
      const target = findUser(id);
      if (!window.EventFlowAccountPolicy.canManageAccount(current(), target)) return toast('Only an admin can change employee or admin accounts.', 'error');
      return mutate(`user:${id}`, () => send(customerRoute(id), 'PATCH', { status: target.status === 'active' ? 'inactive' : 'active' }), 'Account status updated', { close: false });
    });
    for (const name of ['deleteUserOps', 'removeUser']) patch(name, id => {
      if (!window.EventFlowAccountPolicy.canManageAccount(current(), findUser(id))) return toast('Only an admin can change employee or admin accounts.', 'error');
      confirm2('Delete User', 'Permanently delete this user account?', () => mutate(`user:${id}`, () => send(customerRoute(id), 'DELETE'), 'User deleted', { close: false }));
    });
    patch('saveSettings', () => {
      const name = field('st-name'), email = field('st-email'), phone = field('st-phone');
      if (!name || !email.includes('@')) return toast('Enter a name and valid email.', 'error');
      return mutate('profile', () => send(`/users/${encodeURIComponent(userId(current()))}`, 'PATCH', {
        name, email, bio: field('st-bio'), ...(phone ? { phoneNo: phone } : {}),
      }), 'Settings saved successfully', { close: false });
    });
    patch('changePass', () => {
      const currentPassword = field('st-cur'), newPassword = field('st-new');
      if (!currentPassword || newPassword.length < 6) return toast('Enter your current password and a new password of at least 6 characters.', 'error');
      if (newPassword !== field('st-conf')) return toast('Passwords do not match.', 'error');
      return mutate('password', () => send('/auth/password', 'POST', { currentPassword, newPassword }), 'Password changed successfully', { close: false });
    });
    function review(id, decision, reason) {
      return mutate(`registration:${id}`, () => send(`/registrations/${encodeURIComponent(id)}/review`, 'PATCH', { decision, ...(reason ? { reason } : {}) }), 'Registration review saved');
    }
    for (const name of ['approveRegistrationDirect', 'approveVerificationDirect']) patch(name, id => review(id, 'approved'));
    patch('confirmRejectRegistration', id => {
      const reason = field('reject-reason-custom') || field('reject-reason-preset');
      if (reason.length < 10) return toast('Explain the decline in at least 10 characters.', 'error');
      return review(id, 'rejected', reason);
    });
    patch('rejectRegistrationDirect', id => openRejectRegistrationWithReasonModal(id));
    const eventStatus = value => ({ Pending: 'draft', pending: 'draft', Active: 'published', upcoming: 'published', full: 'published', Completed: 'completed', Cancelled: 'cancelled' })[value] || value;
    const eventRoute = id => `${isSupport() ? '/workspace/events' : '/events'}/${encodeURIComponent(id)}`;
    patch('setEventOpsStatus', (id, status) => mutate(`event:${id}`, () => send(eventRoute(id), isSupport() ? 'PATCH' : 'PUT', { status: eventStatus(status) }), 'Event status updated', { close: false }));
    patch('approveEventOpsDirect', id => window.setEventOpsStatus(id, 'published'));
    patch('rejectEventOpsDirect', id => confirm2('Cancel Event', 'Cancel this event and notify affected attendees?', () => window.setEventOpsStatus(id, 'cancelled')));
    patch('saveNewEvent', () => {
      const name = field('ne-title'), venue = field('ne-venue'), date = field('ne-date'), capacity = Number(field('ne-cap'));
      if (!name || !venue || !date || capacity < 1) return toast('Enter the title, venue, date, and a valid capacity.', 'error');
      return mutate('new-event', () => send('/events', 'POST', { name, date, location: venue, capacity,
        time: field('ne-time') || '09:00', category: field('ne-cat') || 'Conference', city: field('ne-city'),
        ticketPrice: Number(field('ne-price')) || 0, status: eventStatus(field('ne-status') || 'published'),
        description: field('ne-desc'), organizerId: current().organizerId || userId(current()),
      }), 'Event created');
    });
    patch('saveEditEvent', id => mutate(`event:${id}`, () => send(eventRoute(id), isSupport() ? 'PATCH' : 'PUT', {
      name: field('ee-title'), date: field('ee-date'), time: field('ee-time'), location: field('ee-venue'),
      capacity: Number(field('ee-cap')), ticketPrice: Number(field('ee-price')), status: eventStatus(field('ee-status')), description: field('ee-desc'),
    }), 'Event updated'));
    for (const name of ['deleteEvent', 'deleteEventOps']) patch(name, id => confirm2('Delete Event', 'Permanently delete this event?', () => mutate(`event:${id}`, () => send(`/events/${encodeURIComponent(id)}`, 'DELETE'), 'Event deleted', { close: false })));
    patch('respondAssign', (id, status) => mutate(`assignment:${id}`, () => send(`/staff-assignments/${encodeURIComponent(id)}/status`, 'PATCH', { status }), 'Assignment response saved', { close: false }));
    for (const [name, status] of [['acceptStaffRequest', 'accepted'], ['rejectStaffRequest', 'declined']]) {
      patch(name, id => window.respondAssign(id, status));
    }
    function assign(staffId, eventId, role, fee, notes) {
      const staff = findUser(staffId), event = database().events.find(item => item.id === eventId);
      if (!staff?.staffId || !event || !role || fee <= 0) return toast('Choose an event and staff member, and enter a role and fee.', 'error');
      return mutate(`assign:${staffId}:${eventId}`, () => send('/staff-assignments', 'POST', {
        staffId: staff.staffId, eventId, organizerId: event.organizerId, role, fee, notes,
      }), 'Assignment sent to staff');
    }
    patch('saveAssignment', () => assign(field('as-staff'), field('as-event'), field('as-role'), Number(field('as-fee')), field('as-notes')));
    patch('confirmStaffAssignment', id => assign(id, field('assign-event-id'), field('assign-role'), Number(field('assign-fee')), field('assign-notes')));
    patch('sendStaffRequest', id => window.assignStaffToEvent(id));
    patch('sendReportToOrganizer', eventId => {
      const event = database().events.find(item => item.id === eventId);
      if (!event) return toast('Event not found.', 'error');
      const registrations = database().registrations.filter(item => item.eventId === eventId);
      return mutate(`staff-report:${eventId}`, () => send('/reports/staff', 'POST', {
        eventId, staffId: current().staffId, organizerId: event.organizerId,
        reportText: `${event.title}: ${registrations.filter(item => item.checkedIn).length} of ${registrations.length} attendees checked in.`,
      }), 'Attendance report sent to organizer', { close: false });
    });
    patch('toggleAvailabilityDate', selected => {
      const availableDates = [...(state.snapshot?.staffProfiles.find(profile => profile.userId === userId(current()))?.availableDates || [])];
      const index = availableDates.indexOf(selected);
      if (index >= 0) availableDates.splice(index, 1); else availableDates.push(selected);
      if (selected < new Date().toISOString().slice(0, 10)) return toast('Past dates cannot be marked as available.', 'error');
      return mutate('availability', () => send(`/staff/${encodeURIComponent(current().staffId)}`, 'PUT', { availableDates }), 'Availability updated', { close: false });
    });
    patch('removeAvailDate', selected => mutate('availability', () => send(`/staff/${encodeURIComponent(current().staffId)}`, 'PUT', {
      availableDates: (state.snapshot?.staffProfiles.find(profile => profile.userId === userId(current()))?.availableDates || []).filter(value => value !== selected),
    }), 'Availability updated', { close: false }));
    patch('markNotifRead', id => mutate(`notification:${id}`, () => send(`/notifications/${encodeURIComponent(id)}/read`, 'PATCH'), 'Notification marked as read', { close: false }));
    patch('markAllRead', () => mutate('notifications', () => send('/notifications/read-all', 'PATCH'), 'Notifications marked as read', { close: false }));
    let operationalReference;
    function saveOperational(submitted) {
      const title = field(submitted ? 'op-submit-title' : 'op-report-title');
      if (!title) return toast('Enter a report title.', 'error');
      operationalReference ||= `form:operational:${crypto.randomUUID()}`;
      const db = database();
      const revenue = db.financeTransactions.filter(item => item.status === 'Successful').reduce((sum, item) => sum + item.amount, 0);
      return mutate('operational-report', async () => {
        const result = await send('/reports/operational', 'POST', {
          title, category: field(submitted ? 'op-submit-type' : 'op-report-type'), scope: 'Platform Wide',
          period: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          summary: `Registration revenue: ₹${revenue.toLocaleString('en-IN')}. ${db.financeTransactions.length} payment records and ${db.financeRefunds.length} refund records. ${db.supportRequests.filter(item => item.status !== 'Resolved').length} open customer requests.`,
          status: submitted ? 'submitted' : 'draft', sourceReference: operationalReference,
        });
        operationalReference = null;
        return result;
      }, submitted ? 'Report submitted to admin' : 'Report saved as draft');
    }
    patch('saveOperationalReport', () => saveOperational(false));
    patch('submitNewOperationalReport', () => saveOperational(true));
    patch('submitOperationalReport', id => mutate(`report:${id}`, () => send(`/reports/operational/${encodeURIComponent(id)}/submit`, 'POST'), 'Report submitted to admin'));
    patch('verifyRegisterOtp', async () => {
      if (!pendingRegistration || Date.now() > pendingRegistration.expiresAt) return toast('OTP expired. Please create your account again.', 'error');
      if (field('rg-otp') !== pendingRegistration.otp) return toast('Incorrect OTP. Please try again.', 'error');
      if (mutations.has('register')) return;
      mutations.add('register');
      try {
        const { user } = pendingRegistration;
        const profileFields = ['dateOfBirth', 'gender', 'city', 'interests', 'organizationType', 'organizationName',
          'organizationAddress', 'yearsExperience', 'eventCategories', 'service', 'staffPosition', 'staffCompany', 'staffCity', 'previousExperience'];
        const registered = await request(null, '/auth/register', { method: 'POST', body: JSON.stringify({
          name: user.name, email: user.email, password: user.password, userRole: { organizer: 'event_organizer', staff: 'event_staff' }[user.role] || user.role,
          ...(user.phone ? { phoneNo: user.phone } : {}), ...(user.address ? { address: user.address } : {}),
          profile: Object.fromEntries(profileFields.filter(key => user[key] !== undefined).map(key => [key, user[key]])),
        }) });
        pendingRegistration = null;
        closeModal();
        invalidate();
        if (registered.token) {
          CU = { ...normalizeUser(registered), token: registered.token };
          sessionStorage.setItem('ef_cu', JSON.stringify(CU));
          if (!routeToRoleWorkspace(CU)) { initApp(); showPage('app'); }
        } else {
          openModal('Registration Submitted', `<p>Your account was saved and is awaiting admin approval. You can sign in once it is activated.</p>`, [{ lbl: 'Close', cls: 'btn-primary', fn: 'closeModal()' }], false);
        }
      } catch (error) { toast(error.message, 'error'); }
      finally { mutations.delete('register'); }
    });
  }

  window.EventFlowData = { sync, invalidate, refresh, request, apply, mutate, normalizeUser };
  install();
  document.addEventListener('input', event => {
    const target = event.target;
    if (target?.closest?.('#page-content') && !target.closest('.support-modal, #modal-overlay') && target.type !== 'search'
      && !/search|filter|query|(?:^|-)q$/i.test(`${target.id || ''} ${target.placeholder || ''}`)) state.editedElement = target;
  });
  setInterval(refresh, 8000);
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('storage', event => { if (event.key === key) { state.pending = true; refresh(); } });
})();
