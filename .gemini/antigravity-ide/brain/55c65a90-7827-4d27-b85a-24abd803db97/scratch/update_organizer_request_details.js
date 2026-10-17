const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'React_frontend/src/apps/organizer/app/runtime.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Helpers for proposal calculations
const calcHelpers = `
    function calculateProposalPrice() {
      const fee = parseFloat(document.getElementById('prop-fee')?.value) || 0;
      const taxes = parseFloat(document.getElementById('prop-taxes')?.value) || 0;
      const amountEl = document.getElementById('prop-amount');
      const depositEl = document.getElementById('prop-deposit');
      const total = fee + taxes;
      if (total > 0 && amountEl && (!amountEl.value || parseFloat(amountEl.value) <= 0)) {
        amountEl.value = total;
      }
      if (amountEl && depositEl && (!depositEl.value || parseFloat(depositEl.value) <= 0)) {
        depositEl.value = Math.round((parseFloat(amountEl.value) || 0) * 0.3);
      }
    }
    window.calculateProposalPrice = calculateProposalPrice;

    function updateProposalBreakdownFromTotal(val) {
      const total = parseFloat(val) || 0;
      const depositEl = document.getElementById('prop-deposit');
      if (depositEl) {
        depositEl.value = Math.round(total * 0.3);
      }
      const feeEl = document.getElementById('prop-fee');
      if (feeEl && (!feeEl.value || parseFloat(feeEl.value) === 0)) {
        feeEl.value = Math.round(total * 0.2);
      }
      const taxesEl = document.getElementById('prop-taxes');
      if (taxesEl && (!taxesEl.value || parseFloat(taxesEl.value) === 0)) {
        taxesEl.value = Math.round(total * 0.18);
      }
    }
    window.updateProposalBreakdownFromTotal = updateProposalBreakdownFromTotal;
`;

// 2. Replace openSendProposalModal and submitSendProposal
const sendProposalStart = content.indexOf('    function openSendProposalModal(');
const sendProposalEnd = content.indexOf('    function simulateClientDecision(', sendProposalStart);

if (sendProposalStart === -1 || sendProposalEnd === -1) {
  console.error('Could not find openSendProposalModal boundaries');
  process.exit(1);
}

const newSendProposal = `    function openSendProposalModal(id, isRevision) {
      const r = DB.eventRequests.find(x => String(x.id) === String(id));
      if (!r) return;
      normalizeEventRequest(r);

      const defaultAmount = r.budget || 25000;
      const defaultDeposit = Math.round(defaultAmount * 0.3);
      const defaultDate = r.date || r.eventDate || '2026-09-01';
      const defaultFee = Math.round(defaultAmount * 0.2);
      const defaultTaxes = Math.round(defaultAmount * 0.18);
      const defaultCapacity = r.capacity || r.guests || 50;

      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 14);
      const defaultValidUntil = expDate.toISOString().split('T')[0];
      const activeProposal = r.proposals?.[r.proposals.length - 1];
      const revisionFeedback = isRevision && activeProposal?.status === 'revision_requested' && activeProposal.clientNotes
        ? \`<div style="background:rgba(245,158,11,0.12);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--text2);margin-bottom:14px"><strong>Client requested changes:</strong> \${escapeHtml(activeProposal.clientNotes)}</div>\`
        : '';

      openModal(isRevision ? 'Revise Event Proposal' : 'Accept & Create Detailed Event Proposal', \`
        \${revisionFeedback}
        <div style="max-height:65vh;overflow-y:auto;padding-right:6px">
          <div style="font-weight:700;font-size:12.5px;color:var(--accent);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">1. Pricing &amp; Fee Breakdown</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="mb-12">
            <div class="form-group">
              <label class="form-label">Total Proposed Price (₹) *</label>
              <input type="number" class="form-control" id="prop-amount" value="\${defaultAmount}" min="1" oninput="updateProposalBreakdownFromTotal(this.value)">
            </div>
            <div class="form-group">
              <label class="form-label">Required Advance Deposit (₹) *</label>
              <input type="number" class="form-control" id="prop-deposit" value="\${defaultDeposit}" min="0">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="mb-12">
            <div class="form-group">
              <label class="form-label">Organizer Fee (₹)</label>
              <input type="number" class="form-control" id="prop-fee" value="\${defaultFee}" min="0" oninput="calculateProposalPrice()">
            </div>
            <div class="form-group">
              <label class="form-label">Taxes &amp; GST (18%) (₹)</label>
              <input type="number" class="form-control" id="prop-taxes" value="\${defaultTaxes}" min="0" oninput="calculateProposalPrice()">
            </div>
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Itemized Cost Breakdown</label>
            <textarea class="form-control" id="prop-itemized" rows="2" placeholder="Itemized services &amp; costs">Venue setup &amp; styling: ₹12,000; Audio-Visual equipment: ₹8,000; On-site staffing: ₹5,000</textarea>
          </div>

          <div style="font-weight:700;font-size:12.5px;color:var(--accent);margin:16px 0 10px;text-transform:uppercase;letter-spacing:0.05em">2. Event Plan, Services &amp; Deliverables</div>
          <div class="form-group mb-12">
            <label class="form-label">Detailed Event Plan &amp; Deliverables *</label>
            <textarea class="form-control" id="prop-plan" rows="2">Includes end-to-end event planning, full venue decoration, audio/visual coordination, catering logistics, and guest assistance.</textarea>
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Execution Timeline *</label>
            <textarea class="form-control" id="prop-timeline" rows="2">09:00 Setup &amp; sound check; 11:00 Guest registration; 13:00 Main event; 17:00 Wrap-up &amp; reporting</textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="mb-12">
            <div class="form-group">
              <label class="form-label">Included Services</label>
              <textarea class="form-control" id="prop-included" rows="2">Stage décor, Sound system, 2 wireless mics, Event coordinator, Registration desk</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Excluded Services</label>
              <textarea class="form-control" id="prop-excluded" rows="2">External alcohol licensing, Personal photographer, Overtime venue fees past 22:00</textarea>
            </div>
          </div>

          <div style="font-weight:700;font-size:12.5px;color:var(--accent);margin:16px 0 10px;text-transform:uppercase;letter-spacing:0.05em">3. Capacity &amp; Constraints</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="mb-12">
            <div class="form-group">
              <label class="form-label">Attendee Capacity &amp; Limits *</label>
              <input type="number" class="form-control" id="prop-capacity" value="\${defaultCapacity}" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Venue &amp; Location Constraints</label>
              <input type="text" class="form-control" id="prop-venue-constraints" value="\${r.venue ? escapeHtml(r.venue) : 'Indoor venue only; preferred location'}">
            </div>
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Date, Budget &amp; Resource Constraints</label>
            <input type="text" class="form-control" id="prop-constraints" value="Indoor venue only; max 85dB noise limit; power backup required; strictly within agreed budget">
          </div>

          <div style="font-weight:700;font-size:12.5px;color:var(--accent);margin:16px 0 10px;text-transform:uppercase;letter-spacing:0.05em">4. Payment &amp; Cancellation Terms</div>
          <div class="form-group mb-12">
            <label class="form-label">Payment Schedule &amp; Terms *</label>
            <select class="form-control" id="prop-schedule">
              <option value="30% advance deposit upon acceptance, 70% balance due upon event completion">30% Advance Deposit on Approval, 70% Final Balance upon Completion</option>
              <option value="50% advance deposit upon acceptance, 50% due on event date">50% Advance Deposit on Approval, 50% on Event Date</option>
              <option value="100% full payment upfront upon booking confirmation">100% Full Payment Upfront upon Confirmation</option>
              <option value="25% deposit, 50% milestone 14 days before, 25% post-event">25% Deposit, 50% Milestone 14 days before, 25% Post-Event</option>
            </select>
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Cancellation Deadline &amp; Policy Terms *</label>
            <select class="form-control" id="prop-cancellation">
              <option value="Standard Policy: 14+ days notice (10% fee, 90% refund, 5-7 business days processing)">Standard Policy: 14+ days notice (10% fee, 90% refund, 5-7 business days processing)</option>
              <option value="Moderate Policy: 7-14 days notice (25% fee, 75% refund, 7-10 business days processing)">Moderate Policy: 7-14 days notice (25% fee, 75% refund, 7-10 business days processing)</option>
              <option value="Strict Policy: Less than 7 days non-refundable; 14+ days (15% fee, 85% refund)">Strict Policy: Less than 7 days non-refundable; 14+ days (15% fee, 85% refund)</option>
            </select>
          </div>

          <div style="font-weight:700;font-size:12.5px;color:var(--accent);margin:16px 0 10px;text-transform:uppercase;letter-spacing:0.05em">5. Dates &amp; Validity</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" class="mb-12">
            <div class="form-group">
              <label class="form-label">Proposed Event Date *</label>
              <input type="date" class="form-control" id="prop-date" value="\${defaultDate}">
            </div>
            <div class="form-group">
              <label class="form-label">Proposal Expiration Date (Valid Until) *</label>
              <input type="date" class="form-control" id="prop-expiry" value="\${defaultValidUntil}">
            </div>
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Additional Conditions &amp; Terms</label>
            <textarea class="form-control" id="prop-conditions" rows="2">Standard EventFlow service agreement applies. Booking becomes effective once advance deposit is verified.</textarea>
          </div>
          <div id="prop-err-msg" style="color:var(--red);font-size:12px;display:none;margin-top:6px"></div>
        </div>
      \`, [
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
        { lbl: isRevision ? 'Send Revision' : 'Submit Proposal', cls: 'btn-primary', fn: \`submitSendProposal('\${id}', \${isRevision})\` }
      ]);
    }

    window.openAcceptCreateProposalModal = function(id) {
      openSendProposalModal(id, false);
    };

    async function submitSendProposal(id, isRevision) {
      const amount = parseFloat(v('prop-amount'));
      const deposit = parseFloat(v('prop-deposit'));
      const organizerFee = parseFloat(v('prop-fee')) || 0;
      const taxes = parseFloat(v('prop-taxes')) || 0;
      const itemizedCosts = v('prop-itemized') || '';
      const eventPlan = v('prop-plan') || '';
      const timeline = v('prop-timeline') || '';
      const includedServices = v('prop-included') || '';
      const excludedServices = v('prop-excluded') || '';
      const attendeeCapacity = parseInt(v('prop-capacity'), 10) || 50;
      const venueConstraints = v('prop-venue-constraints') || '';
      const resourceConstraints = v('prop-constraints') || '';
      const constraints = [venueConstraints ? 'Venue: ' + venueConstraints : '', resourceConstraints].filter(Boolean).join('; ');
      const paymentSchedule = v('prop-schedule') || '';
      const cancellationTerms = v('prop-cancellation') || '';
      const proposedDate = v('prop-date');
      const validUntil = v('prop-expiry');
      const conditions = v('prop-conditions') || '';
      const terms = \`\${eventPlan}\\n\\nDeliverables:\\n\${timeline}\\n\\nPayment Terms: \${paymentSchedule}\\nCancellation Policy: \${cancellationTerms}\`;
      const errEl = g('prop-err-msg');

      function showError(msg) {
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      }

      if (!amount || amount <= 0) { showError('Please enter a valid total proposed price greater than zero.'); return; }
      if (isNaN(deposit) || deposit < 0 || deposit > amount) { showError('Deposit must be between 0 and total amount.'); return; }
      if (!proposedDate) { showError('Proposed event date is required.'); return; }
      if (!validUntil) { showError('Proposal expiration date is required.'); return; }
      if (!eventPlan.trim()) { showError('Detailed event plan is required.'); return; }
      if (!timeline.trim()) { showError('Execution timeline is required.'); return; }
      if (!attendeeCapacity || attendeeCapacity <= 0) { showError('Attendee capacity must be greater than zero.'); return; }

      const todayStr = today();
      if (proposedDate <= todayStr) { showError('Proposed event date must be in the future.'); return; }
      if (validUntil <= todayStr) { showError('Proposal expiry date must be in the future.'); return; }

      // Check date availability
      const r = DB.eventRequests.find(x => String(x.id) === String(id));
      if (!r) return;
      normalizeEventRequest(r);

      const avail = checkOrganizerDateAvailability(r.organizer, proposedDate, r.id);
      if (!avail.available) {
        showError('Date unavailable: ' + avail.reason);
        return;
      }

      try {
        const response = await apiSendEventProposal(id, {
          amount,
          depositRequired: deposit,
          proposedDate,
          validUntil,
          terms,
          eventPlan,
          timeline,
          organizerFee,
          itemizedCosts,
          taxes,
          includedServices,
          excludedServices,
          attendeeCapacity,
          constraints,
          paymentSchedule,
          cancellationTerms,
          conditions,
        }, isRevision);
        const version = response?.data?.proposals?.length || (r.proposals ? r.proposals.length + 1 : 1);
        r.status = 'proposal_sent';
        r.agreementStatus = 'not_sent';
        r.paymentStatus = 'unpaid';
        closeModal();
        if (typeof syncOrganizerEventRequests === 'function') await syncOrganizerEventRequests();
        if (typeof syncWorkflowData === 'function') await syncWorkflowData();
        toast(\`Proposal v\${version} sent to client!\`, 'success');
        viewRequestDetail(id);
      } catch (error) {
        showError(error?.message || 'Unable to send the proposal.');
      }
    }
`;

content = content.slice(0, sendProposalStart) + calcHelpers + newSendProposal + content.slice(sendProposalEnd);

// 3. Replace openRejectModal and submitRejectReq
const rejectStart = content.indexOf('    function openRejectModal(');
const rejectEnd = content.indexOf('    // Legacy wrappers', rejectStart);

if (rejectStart === -1 || rejectEnd === -1) {
  console.error('Could not find openRejectModal boundaries');
  process.exit(1);
}

const newReject = `    function openRejectModal(id) {
      const r = DB.eventRequests.find(x => String(x.id) === String(id));
      openModal('Reject Event Request', \`
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">
          Declining request for <strong>\${escapeHtml(r?.title || r?.eventName || 'Event Request')}</strong>. Please provide a mandatory reason for the client.
        </div>
        <div class="form-group mb-16">
          <label class="form-label" style="font-weight:700">Reason for Declining (Mandatory) *</label>
          <textarea class="form-control" id="reject-reason-txt" rows="3" placeholder="Explain why this request is declined (e.g. Schedule unavailable, capacity constraints, budget misalignment)..." required></textarea>
          <div id="reject-err" style="color:var(--red);font-size:12px;display:none;margin-top:6px">Please provide a valid rejection reason.</div>
        </div>
        <div class="form-group mb-16">
          <label class="form-label" style="font-weight:700">Additional Comments (Optional)</label>
          <textarea class="form-control" id="reject-comments-txt" rows="2" placeholder="Any additional notes, alternative suggestions, or context for the client..."></textarea>
        </div>
      \`, [
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
        { lbl: 'Confirm Decline', cls: 'btn-danger', fn: \`submitRejectReq('\${id}')\` }
      ]);
    }

    window.openRejectRequestModal = openRejectModal;

    async function submitRejectReq(id) {
      const reason = (v('reject-reason-txt') || '').trim();
      const comments = (v('reject-comments-txt') || '').trim();
      if (!reason) {
        const el = g('reject-err');
        if (el) {
          el.textContent = 'Please provide a valid rejection reason.';
          el.style.display = 'block';
        }
        return;
      }
      const r = DB.eventRequests.find(x => String(x.id) === String(id));
      if (!r) return;
      normalizeEventRequest(r);

      const submitBtn = g('modal-foot')?.querySelector('.btn-danger');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Declining...'; }

      try {
        await apiRejectEventRequest(id, {
          reason,
          comments,
          reasonType: 'permanent'
        });
      } catch (err) {
        console.warn('Backend reject call notification:', err?.message || err);
      }

      r.status = 'rejected';
      r.rejectionReason = reason;
      if (comments) r.rejectionComments = comments;
      if (r.proposals && r.proposals.length > 0) {
        r.proposals.forEach(p => {
          if (p.status === 'pending_client') p.status = 'rejected';
        });
      }
      r.auditHistory = r.auditHistory || [];
      r.auditHistory.push({
        id: 'aud-' + Date.now(),
        action: 'Request Declined by Organizer',
        performedBy: CU.name || 'Organizer',
        role: 'organizer',
        timestamp: today(),
        details: { reason, comments }
      });

      saveDB();
      closeModal();
      if (typeof syncWorkflowData === 'function') await syncWorkflowData();
      toast('Request declined with reason recorded', 'info');
      viewRequestDetail(id);
      if (typeof renderPage === 'function' && _currentPage === 'event-requests') {
        renderPage('event-requests');
      }
    }

    window.submitRejectRequest = submitRejectReq;
`;

content = content.slice(0, rejectStart) + newReject + content.slice(rejectEnd);

// 4. Replace viewRequestDetail
const vrdStart = content.indexOf('    function viewRequestDetail(reqId) {');
const vrdEnd = content.indexOf('    function viewOngoingEventDetail(eventId) {', vrdStart);

if (vrdStart === -1 || vrdEnd === -1) {
  console.error('Could not find viewRequestDetail boundaries');
  process.exit(1);
}

const newVrd = `    function viewRequestDetail(reqId) {
      const r = DB.eventRequests.find(x => String(x.id) === String(reqId)); if (!r) return;
      normalizeEventRequest(r);
      const returnPage = ['event-requests', 'request-status', 'dashboard'].includes(_currentPage) ? _currentPage : 'event-requests';
      const cl = DB.users.find(u => String(u.id) === String(r.clientId)) || DB.users.find(u => u.role === 'client') || { name: 'Michael Torres', email: 'client@example.com', phone: '+91 9876543203' };
      const el = document.getElementById('page-content');
      if (!el) return;

      const isTerminal = ['rejected', 'withdrawn', 'cancelled', 'completed'].includes(r.status);
      const isProgressed = ['confirmed', 'approved'].includes(r.status);
      const isAwaitingClient = r.status === 'proposal_sent' || r.status === 'awaiting_client';
      const isAssigned = !r.organizerId || !r.organizer || String(r.organizerId) === String(CU.id) || String(r.organizer) === String(CU.id) || String(r.organizerId) === String(CU.organizerId) || CU.role === 'superuser' || CU.role === 'admin';
      const canManage = isAssigned && (CU.role === 'organizer' || CU.role === 'superuser' || CU.role === 'admin');
      const canDecide = canManage && !isTerminal && !isProgressed && !isAwaitingClient;

      // Status badges
      const statusMap = {
        'submitted': { label: 'Submitted', bg: '#FEF9C3', color: '#92400E', desc: 'Request submitted by client. Review details below and accept to create a proposal or decline.' },
        'pending': { label: 'Pending Review', bg: '#FEF9C3', color: '#92400E', desc: 'Pending organizer review. Review details below and accept to create a proposal or decline.' },
        'under_review': { label: 'Under Review', bg: '#FEF9C3', color: '#92400E', desc: 'Request under review. Create a detailed proposal or decline.' },
        'planning': { label: 'In Planning', bg: '#E0E7FF', color: '#3730A3', desc: 'Request accepted. Prepare and submit your detailed proposal.' },
        'proposal_sent': { label: 'Proposal Sent', bg: '#E0E7FF', color: '#3730A3', desc: 'Proposal sent to client. Awaiting client review and response.' },
        'awaiting_client': { label: 'Awaiting Client Review', bg: '#E0E7FF', color: '#3730A3', desc: 'Proposal sent to client. Awaiting client decision.' },
        'changes_requested': { label: 'Revision Requested', bg: '#FFEDD5', color: '#9A3412', desc: 'Client requested changes. Send an updated proposal or decline.' },
        'plan_revision_requested': { label: 'Revision Requested', bg: '#FFEDD5', color: '#9A3412', desc: 'Client requested modifications. Send a revised proposal.' },
        'accepted': { label: 'Proposal Accepted', bg: '#DCFCE7', color: '#166534', desc: 'Client accepted proposal. Deposit payment and booking confirmation pending.' },
        'confirmed': { label: 'Booking Confirmed', bg: '#DCFCE7', color: '#166534', desc: 'Booking confirmed and agreement in effect.' },
        'approved': { label: 'Approved', bg: '#DCFCE7', color: '#166534', desc: 'Event approved and confirmed.' },
        'rejected': { label: 'Rejected', bg: '#FEE2E2', color: '#991B1B', desc: 'This event request was declined.' },
        'cancelled': { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', desc: 'This booking has been cancelled.' },
        'withdrawn': { label: 'Withdrawn', bg: '#F3F4F6', color: '#374151', desc: 'Client withdrew this event request.' },
        'completed': { label: 'Completed', bg: '#DCFCE7', color: '#166534', desc: 'Event completed successfully.' }
      };
      const st = statusMap[r.status] || { label: (r.status || 'Submitted').toUpperCase(), bg: '#FEF9C3', color: '#92400E', desc: 'Review request details.' };

      // Latest proposal if any
      const activeProposal = r.proposals && r.proposals.length > 0 ? r.proposals[r.proposals.length - 1] : null;

      el.innerHTML = \`<div style="padding:28px;background:var(--bg);min-height:100vh">
    <button onclick="goNav('\${returnPage}')" style="display:inline-flex;align-items:center;gap:6px;border:none;background:none;color:var(--text2);font-size:13px;cursor:pointer;margin-bottom:24px;padding:0">&larr; Back to \${returnPage === 'event-requests' ? 'Event Requests' : returnPage === 'dashboard' ? 'Dashboard' : 'Requests'}</button>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap">
      <div style="font-size:22px;font-weight:700;color:var(--text)">\${escapeHtml(r.title || r.eventName || 'Event Request')}</div>
      <span style="background:\${st.bg};color:\${st.color};font-size:12px;font-weight:700;padding:3px 12px;border-radius:6px;letter-spacing:0.02em">\${st.label}</span>
    </div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:28px">\${st.desc}</div>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:760px">

      <!-- CLIENT INFORMATION -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128100; Client Information</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CLIENT NAME</div>
            <div style="font-size:14px;font-weight:600;color:var(--text)">\${escapeHtml(cl.name || 'Client')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CONTACT</div>
            <div style="font-size:13px;color:var(--text2)">\${escapeHtml(cl.email || '—')}</div>
            <div style="font-size:13px;color:var(--text2)">\${escapeHtml(cl.phone || '')}</div>
          </div>
        </div>
      </div>

      <!-- EVENT DETAILS -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:18px">&#128197; Event Details</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">DATE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${escapeHtml(r.date || r.eventDate || '—')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EVENT TYPE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${escapeHtml(r.type || r.eventType || 'Corporate Event')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">VENUE</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${escapeHtml(r.venue || 'To be decided')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">EXPECTED ATTENDEES</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${r.guests || r.capacity || 0}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">CITY</div>
            <div style="font-size:14px;font-weight:500;color:var(--text)">\${escapeHtml(r.city || '—')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">BUDGET</div>
            <div style="font-size:14px;font-weight:600;color:var(--green)">&#8377;\${r.budget ? Number(r.budget).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <!-- EVENT REQUIREMENTS -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">&#128203; Event Requirements</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Services and setup requested by the client</div>
        <div style="background:var(--surface2);border-radius:10px;padding:16px;font-size:13px;color:var(--text);line-height:1.7">\${escapeHtml(r.desc || r.requirements || 'Standard event requirements. No special requests.')}</div>
      </div>

      <!-- PROPOSAL DETAILS (IF SENT) -->
      \${activeProposal ? \`
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <div style="font-weight:700;font-size:15px">&#128221; Proposal Details (v\${activeProposal.version || 1})</div>
          <span class="badge badge-purple" style="font-size:11px">\${activeProposal.status || 'Active'}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">TOTAL PROPOSED PRICE</div><strong style="color:var(--green);font-size:16px">&#8377;\${(activeProposal.amount || 0).toLocaleString()}</strong></div>
          <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">REQUIRED ADVANCE DEPOSIT</div><strong style="color:var(--accent);font-size:16px">&#8377;\${(activeProposal.depositRequired || 0).toLocaleString()}</strong></div>
          <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">ORGANIZER FEE</div><div>&#8377;\${(activeProposal.organizerFee || 0).toLocaleString()}</div></div>
          <div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-bottom:4px">TAXES &amp; GST</div><div>&#8377;\${(activeProposal.taxes || 0).toLocaleString()}</div></div>
        </div>
        \${activeProposal.eventPlan ? \`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Event Plan &amp; Deliverables</div><div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:13px;color:var(--text);line-height:1.6">\${escapeHtml(activeProposal.eventPlan)}</div></div>\` : ''}
        \${activeProposal.timeline ? \`<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:4px">Execution Timeline</div><div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:13px;color:var(--text);line-height:1.6">\${escapeHtml(activeProposal.timeline)}</div></div>\` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12.5px;color:var(--text2);margin-top:10px">
          <div><strong>Payment Terms:</strong> \${escapeHtml(activeProposal.paymentSchedule || 'Standard')}</div>
          <div><strong>Cancellation Policy:</strong> \${escapeHtml(activeProposal.cancellationTerms || 'Standard (14+ days notice)')}</div>
          <div><strong>Validity:</strong> Until \${escapeHtml(activeProposal.validUntil || '—')}</div>
          <div><strong>Capacity:</strong> \${activeProposal.attendeeCapacity || r.guests || 50} attendees</div>
        </div>
      </div>\` : ''}

      <!-- REJECTION DETAILS (IF REJECTED) -->
      \${r.status === 'rejected' && r.rejectionReason ? \`
      <div style="background:var(--surface);border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:24px">
        <div style="display:flex;align-items:center;gap:8px;color:var(--red);font-weight:700;font-size:15px;margin-bottom:14px">&#10005; Request Declined</div>
        <div style="margin-bottom:10px">
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;margin-bottom:4px">REASON FOR DECLINING</div>
          <div style="background:var(--red-dim);border-radius:8px;padding:12px;font-size:13px;color:var(--text);line-height:1.6">\${escapeHtml(r.rejectionReason)}</div>
        </div>
        \${r.rejectionComments ? \`
        <div>
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:600;margin-bottom:4px">ADDITIONAL COMMENTS</div>
          <div style="background:var(--surface2);border-radius:8px;padding:12px;font-size:13px;color:var(--text2);line-height:1.6">\${escapeHtml(r.rejectionComments)}</div>
        </div>\` : ''}
      </div>\` : ''}

      <!-- STATUS NOTICE IF ACTION ALREADY TAKEN OR UNAUTHORIZED -->
      \${isAwaitingClient ? \`
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:14px;font-size:13px;color:var(--text2)">
        <strong>Proposal Awaiting Client:</strong> A proposal has already been created and sent. The client is currently reviewing the proposal. You will be notified once they respond.
      </div>\` : ''}
      \${!canManage ? \`
      <div style="background:rgba(156,163,175,0.1);border:1px solid var(--border);border-radius:10px;padding:14px;font-size:13px;color:var(--text2)">
        <strong>Notice:</strong> Only the assigned organizer can accept or decline this request.
      </div>\` : ''}

      <!-- ORGANIZER ACTIONS AT BOTTOM -->
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:12px;padding-top:16px;border-top:1px solid var(--border);margin-top:8px;flex-wrap:wrap">
        \${canDecide ? \`
        <button class="btn btn-ghost" onclick="goNav('\${returnPage}')" style="border-radius:8px;padding:10px 22px">Back to Requests</button>
        <button class="btn btn-danger" onclick="openRejectModal('\${r.id}')" style="border-radius:8px;padding:10px 22px">Reject Request</button>
        <button class="btn btn-primary" onclick="openSendProposalModal('\${r.id}', \${Boolean(r.proposals && r.proposals.length > 0)})" style="border-radius:8px;padding:10px 24px;font-weight:700">Accept &amp; Create Proposal</button>
        \` : \`
        <button class="btn btn-ghost" onclick="goNav('\${returnPage}')" style="border-radius:8px;padding:10px 24px">Back to Requests</button>
        \`}
      </div>
    </div>
  </div>\`;
    }
`;

content = content.slice(0, vrdStart) + newVrd + content.slice(vrdEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated organizer runtime with organizer actions on event request details!');
