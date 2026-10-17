// Historical support routing implementation from the inactive employee 2 runtime.
// Kept for reference while the active support flow uses the backend queue.
// This file is intentionally not loaded by the application.
    function pageSupportCenter() {
      const query = (sessionStorage.getItem('support_query') || '').toLowerCase();
      const status = sessionStorage.getItem('support_status') || '';
      const requests = (DB.supportRequests || []).filter(item => {
        const user = supportUser(item), event = supportEvent(item);
        return (!status || item.status === status) && (!query || `${item.id} ${item.subject} ${item.message} ${user.name} ${user.email} ${event.title}`.toLowerCase().includes(query));
      });

      return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Support Center</div>
            <div class="page-sub">Manage user support requests with event and payment context. Route unresolvable issues to the appropriate department.</div>
          </div>
          <div class="page-hd-right">
            <button class="btn btn-primary" onclick="openRouteRequestModal()">🔀 Route Request</button>
          </div>
        </div>

        <div class="filter-row">
          <div class="search-box input-group">
            <span class="input-icon">🔍</span>
            <input class="form-control" id="support-query" placeholder="Search requests, users, or events..." value="${query}" oninput="refreshSupportCenter()">
          </div>
          <select class="form-control filter-select" id="support-status" onchange="refreshSupportCenter()">
            <option value="">All Statuses</option>
            ${['Pending', 'In Progress', 'Resolved', 'Closed'].map(item => `<option ${status === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>User</th>
                  <th>Event / Payment</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${requests.map(item => {
        const user = supportUser(item), event = supportEvent(item);
        return `
                    <tr>
                      <td>
                        <div style="font-weight:700;font-size:13.5px;color:var(--text)">${item.subject}</div>
                        <div class="small muted">${item.message}</div>
                      </td>
                      <td>
                        <div style="font-weight:600">${user.name}</div>
                        <div class="small muted">${user.email}</div>
                      </td>
                      <td>
                        <div style="font-weight:600">${event.title}</div>
                        <div class="small muted">${event.date} · Related transaction available</div>
                      </td>
                      <td><span class="badge badge-${supportStatusBadge(item.status)}">${item.status}</span></td>
                      <td class="small muted">${item.updated}</td>
                      <td>
                        <div class="flex gap-6">
                          <button class="btn btn-ghost btn-xs" onclick="openSupportRequest('${item.id}')">View / Respond</button>
                          <button class="btn btn-ghost btn-xs" style="border-color:var(--purple);color:var(--purple)" onclick="openRouteRequestModal('${item.id}')">🔀 Route</button>
                        </div>
                      </td>
                    </tr>
                  `;
      }).join('') || '<tr><td colspan="6" class="text-center py-20 muted">No support requests found.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function openRouteRequestModal(prefillId) {
      const supportReqs = DB.supportRequests || [];
      const reqOptions = supportReqs.map(r => {
        const u = supportUser(r);
        return `<option value="${r.id}" ${prefillId === r.id ? 'selected' : ''}>${r.id} — ${r.subject} (${u.name})</option>`;
      }).join('');

      // Determine prefill values if a request ID was passed
      let prefillUser = '', prefillEmail = '', prefillDesc = '', prefillEvent = '';
      let autoRouteTo = '';
      if (prefillId) {
        const item = supportReqs.find(r => r.id === prefillId);
        if (item) {
          const u = supportUser(item);
          const e = supportEvent(item);
          prefillUser = u.name || '';
          prefillEmail = u.email || '';
          prefillDesc = item.message || '';
          prefillEvent = e.title && e.title !== 'Unknown Event' ? e.title : '';
          // Auto-suggest route based on subject keywords
          const subjectLow = (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();
          const emp1Keywords = ['registration', 'account', 'verification', 'user', 'profile', 'email', 'login', 'password', 'access'];
          const emp2Keywords = ['event', 'venue', 'schedule', 'location', 'capacity', 'slot', 'cancel', 'speaker', 'av', 'equipment'];
          if (emp2Keywords.some(k => subjectLow.includes(k))) autoRouteTo = 'Employee 2 – Event Operations Executive';
          else if (emp1Keywords.some(k => subjectLow.includes(k))) autoRouteTo = 'Employee 1 – Registration & Verification Executive';
        }
      }

      openModal('🔀 Route Support Request', `
        <div style="background:var(--surface2);border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text2);border-left:3px solid var(--purple)">
          <strong style="color:var(--purple)">Routing Policy:</strong> Route <strong>user/account/registration/verification</strong> issues to Employee 1. Route <strong>event/venue/schedule/operational</strong> issues to Employee 2. Finance/payment issues are handled directly by you.
        </div>

        <div class="form-group">
          <label class="form-label">Select Request ID (optional)</label>
          <select class="form-control" id="route-req-id" onchange="prefillRouteForm(this.value)">
            <option value="">— New / Manual Route —</option>
            ${reqOptions}
          </select>
        </div>

        <div class="grid-2 gap-12">
          <div class="form-group">
            <label class="form-label">User Name *</label>
            <input class="form-control" id="route-user-name" placeholder="Full name" value="${prefillUser}">
          </div>
          <div class="form-group">
            <label class="form-label">User Email *</label>
            <input class="form-control" id="route-user-email" placeholder="user@email.com" value="${prefillEmail}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Request Category *</label>
          <select class="form-control" id="route-category">
            <option>User Account Issue</option>
            <option>Registration Problem</option>
            <option>Identity Verification Issue</option>
            <option>Event Information Query</option>
            <option>Venue / Location Issue</option>
            <option>Schedule Conflict / Change</option>
            <option>Event Capacity / Slot Issue</option>
            <option>Event Cancellation / Update Request</option>
            <option>Operational Issue</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Request Description *</label>
          <textarea class="form-control" id="route-description" rows="3" placeholder="Describe the issue in detail...">${prefillDesc}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Related Event (if applicable)</label>
          <input class="form-control" id="route-event" placeholder="Event name or ID" value="${prefillEvent}">
        </div>

        <div class="grid-2 gap-12">
          <div class="form-group">
            <label class="form-label">Priority *</label>
            <select class="form-control" id="route-priority">
              <option value="Low">🟢 Low</option>
              <option value="Medium" selected>🟡 Medium</option>
              <option value="High">🔴 High</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Route To *</label>
            <select class="form-control" id="route-to">
              <option value="Employee 1 – Registration &amp; Verification Executive" ${autoRouteTo === 'Employee 1 – Registration & Verification Executive' ? 'selected' : ''}>Employee 1 – Registration &amp; Verification Executive</option>
              <option value="Employee 2 – Event Operations Executive" ${autoRouteTo === 'Employee 2 – Event Operations Executive' ? 'selected' : ''}>Employee 2 – Event Operations Executive</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Internal Note (visible to recipient)</label>
          <textarea class="form-control" id="route-note" rows="2" placeholder="Add context for the receiving department..."></textarea>
        </div>
      `, [
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
        { lbl: '🔀 Route Request', cls: 'btn-primary', fn: 'saveRouteRequest()' }
      ]);
    }

    window.prefillRouteForm = function (reqId) {
      if (!reqId) return;
      const item = (DB.supportRequests || []).find(r => r.id === reqId);
      if (!item) return;
      const u = supportUser(item);
      const e = supportEvent(item);
      const nameEl = document.getElementById('route-user-name');
      const emailEl = document.getElementById('route-user-email');
      const descEl = document.getElementById('route-description');
      const eventEl = document.getElementById('route-event');
      const routeToEl = document.getElementById('route-to');
      if (nameEl) nameEl.value = u.name || '';
      if (emailEl) emailEl.value = u.email || '';
      if (descEl) descEl.value = item.message || '';
      if (eventEl && e.title && e.title !== 'Unknown Event') eventEl.value = e.title;
      // Auto-suggest routing
      if (routeToEl) {
        const subjectLow = (item.subject || '').toLowerCase() + ' ' + (item.message || '').toLowerCase();
        const emp2Keywords = ['event', 'venue', 'schedule', 'location', 'capacity', 'slot', 'cancel', 'speaker', 'av', 'equipment'];
        const emp1Keywords = ['registration', 'account', 'verification', 'user', 'profile', 'email', 'login', 'password'];
        if (emp2Keywords.some(k => subjectLow.includes(k))) routeToEl.value = 'Employee 2 – Event Operations Executive';
        else if (emp1Keywords.some(k => subjectLow.includes(k))) routeToEl.value = 'Employee 1 – Registration & Verification Executive';
      }
    };

    function saveRouteRequest() {
      const userName = v('route-user-name');
      const userEmail = v('route-user-email');
      const category = v('route-category');
      const description = v('route-description');
      const priority = v('route-priority');
      const routeTo = v('route-to');
      const note = v('route-note');
      const relatedEvent = v('route-event');
      const reqId = v('route-req-id');

      if (!userName) { toast('Please enter the user name', 'error'); return; }
      if (!description) { toast('Please enter a request description', 'error'); return; }

      const routedId = 'RT-' + Date.now().toString().slice(-6);
      const isEmp2 = routeTo.includes('Employee 2');
      const isEmp1 = routeTo.includes('Employee 1');

      // Build the routed request record
      const routedReq = {
        id: routedId,
        linkedRequestId: reqId || null,
        userName: userName,
        userEmail: userEmail,
        category: category,
        description: description,
        relatedEvent: relatedEvent || null,
        priority: priority,
        routeTo: routeTo,
        note: note,
        source: 'Escalated by Emp 3',
        raisedBy: 'Customer Support (Emp 3)',
        status: 'Pending',
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) + ' · ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        routedAt: 'Just now'
      };

      if (!DB.routedRequests) DB.routedRequests = [];
      DB.routedRequests.unshift(routedReq);

      // Make visible to Employee 1 (userQueries) if routed to Emp 1
      if (isEmp1) {
        if (!DB.userQueries) DB.userQueries = [];
        DB.userQueries.unshift({
          id: routedId,
          userId: null,
          userName: userName,
          userEmail: userEmail,
          type: category,
          subject: `[Routed by Emp 3] ${category}`,
          detail: description + (note ? '\n\nInternal Note: ' + note : '') + (relatedEvent ? '\nRelated Event: ' + relatedEvent : ''),
          source: 'Employee 3 Escalation',
          status: 'Pending',
          priority: priority,
          date: routedReq.date
        });
      }

      // Make visible to Employee 2 (eventOpsRequests) if routed to Emp 2
      if (isEmp2) {
        if (!DB.eventOpsRequests) DB.eventOpsRequests = [];
        // find matching eventId if possible
        const matchedEvent = relatedEvent ? (DB.events || []).find(e => (e.title || e.name || '').toLowerCase().includes(relatedEvent.toLowerCase())) : null;
        DB.eventOpsRequests.unshift({
          id: routedId,
          eventId: matchedEvent ? matchedEvent.id : null,
          eventTitle: relatedEvent || 'N/A',
          issue: description + (note ? '\n\nInternal Note: ' + note : ''),
          source: 'Escalated by Emp 3',
          raisedBy: `${userName} (via Customer Support)`,
          priority: priority,
          status: 'Pending',
          date: routedReq.date,
          notes: note || ''
        });
      }

      // Mark linked support request as In Progress if selected
      if (reqId) {
        const linked = (DB.supportRequests || []).find(r => r.id === reqId);
        if (linked && linked.status === 'Pending') {
          linked.status = 'In Progress';
          linked.response = `Routed to ${routeTo} on ${routedReq.date}. Awaiting resolution.`;
          linked.updated = 'Just now';
        }
      }

      saveDB();
      closeModal();
      renderPage('support-center');
      toast(`Request routed to ${isEmp2 ? 'Employee 2 (Event Operations)' : 'Employee 1 (Registration & Verification)'} successfully!`, 'success');
    }

    function refreshSupportCenter() {
      sessionStorage.setItem('support_query', v('support-query'));
      sessionStorage.setItem('support_status', v('support-status'));
      renderPage('support-center');
    }
    function openSupportRequest(id) {
      const item = DB.supportRequests.find(request => request.id === id);
      if (!item) return;
      const user = supportUser(item), event = supportEvent(item), transaction = (DB.financeTransactions || []).find(record => String(record.userId) === String(item.userId) && String(record.eventId) === String(item.eventId));
      openModal(`Support Request ${item.id}`, `
        <div class="info-row"><span class="info-label">User</span><span class="info-value">${user.name} · ${user.email}</span></div>
        <div class="info-row"><span class="info-label">Event</span><span class="info-value">${event.title} · ${event.date}</span></div>
        <div class="info-row"><span class="info-label">Payment</span><span class="info-value">${transaction ? `${transaction.id} · ₹${transaction.amount} · ${transaction.status}` : 'No matching transaction'}</span></div>
        <div class="info-row"><span class="info-label">Request</span><span class="info-value">${item.subject}</span></div>
        <p class="muted" style="line-height:1.6;margin:16px 0">${item.message}</p>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="support-edit-status">
            ${['Pending', 'In Progress', 'Resolved', 'Closed'].map(value => `<option ${value === item.status ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Response</label>
          <textarea class="form-control" id="support-response" rows="4">${item.response || ''}</textarea>
        </div>
      `, [
        { lbl: '🔀 Route This Request', cls: 'btn-ghost', fn: `closeModal();openRouteRequestModal('${id}')` },
        { lbl: 'Save Response', cls: 'btn-primary', fn: `saveSupportRequest('${id}')` }
      ]);
    }
    function saveSupportRequest(id) {
      const item = DB.supportRequests.find(request => request.id === id);
      if (!item) return;
      item.status = v('support-edit-status');
      item.response = v('support-response');
      item.updated = 'Just now';
      saveDB();
      closeModal();
      renderPage('support-center');
      toast('Support request updated', 'success');
    }

