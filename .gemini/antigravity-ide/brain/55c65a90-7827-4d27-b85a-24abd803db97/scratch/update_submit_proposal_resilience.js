const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'React_frontend/src/apps/organizer/app/runtime.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. In openSendProposalModal: fix duplicate Cancel button (pass false as 4th arg to openModal)
const targetModalCall = `      ], [
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
        { lbl: isRevision ? 'Send Revision' : 'Submit Proposal', cls: 'btn-primary', fn: \`submitSendProposal('\${id}', \${isRevision})\` }
      ]);`;

const replacementModalCall = `      ], [
        { lbl: 'Cancel', cls: 'btn-ghost', fn: 'closeModal()' },
        { lbl: isRevision ? 'Send Revision' : 'Submit Proposal', cls: 'btn-primary', fn: \`submitSendProposal('\${id}', \${isRevision})\` }
      ], false);`;

if (content.includes(targetModalCall)) {
  content = content.replace(targetModalCall, replacementModalCall);
  console.log('Fixed duplicate Cancel button in openSendProposalModal');
} else {
  console.log('targetModalCall not found');
}

// 2. In submitSendProposal: add resilient fallback and complete client-ready rendering
const subStart = content.indexOf('    async function submitSendProposal(id, isRevision) {');
const subEnd = content.indexOf('    function simulateClientDecision(id, decision) {', subStart);

if (subStart === -1 || subEnd === -1) {
  console.error('Could not find submitSendProposal boundaries');
  process.exit(1);
}

const newSubmitSendProposal = `    async function submitSendProposal(id, isRevision) {
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

      const submitBtn = g('modal-foot')?.querySelector('.btn-primary');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

      try {
        let response;
        try {
          response = await apiSendEventProposal(id, {
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
        } catch (apiErr) {
          const errText = String(apiErr?.message || (Array.isArray(apiErr?.data?.message) ? apiErr.data.message.join(', ') : ''));
          if (errText.includes('should not exist')) {
            // Fallback for strict or older server schemas: send standard whitelisted fields
            response = await apiSendEventProposal(id, {
              amount,
              depositRequired: deposit,
              proposedDate,
              validUntil,
              terms: \`\${terms}\\n\\nOrganizer Fee: ₹\${organizerFee}\\nTaxes & GST: ₹\${taxes}\\nItemized: \${itemizedCosts}\\nCapacity Limit: \${attendeeCapacity} guests\\nConstraints: \${constraints}\`,
              notes: conditions || '',
            }, isRevision);
          } else {
            throw apiErr;
          }
        }

        const version = response?.data?.proposals?.length || (r.proposals ? r.proposals.length + 1 : 1);
        r.status = 'proposal_sent';
        r.agreementStatus = 'not_sent';
        r.paymentStatus = 'unpaid';
        if (!r.proposals) r.proposals = [];
        r.proposals.forEach(p => { if (p.status === 'pending_client') p.status = 'revision_requested'; });
        r.proposals.push({
          version,
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
          status: 'pending_client',
          sentAt: new Date().toISOString()
        });
        r.currentProposalVersion = version;

        saveDB();
        closeModal();
        if (typeof syncOrganizerEventRequests === 'function') await syncOrganizerEventRequests();
        if (typeof syncWorkflowData === 'function') await syncWorkflowData();
        toast(\`Proposal v\${version} sent to client!\`, 'success');
        viewRequestDetail(id);
      } catch (error) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = isRevision ? 'Send Revision' : 'Submit Proposal'; }
        showError(error?.message || 'Unable to send the proposal.');
      }
    }
`;

content = content.slice(0, subStart) + newSubmitSendProposal + content.slice(subEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated submitSendProposal with fallback and clean modal buttons!');
