const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'React_frontend/src/apps/client/app/runtime.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update dashClient to include proposal alert banner
const dashTarget = '  </div>\r\n  <div class="card" id="client-upcoming-events"';
const dashTargetLF = '  </div>\n  <div class="card" id="client-upcoming-events"';
const dashReplacement = `  </div>
  \${myReqs.filter(r => r.status === 'proposal_sent').length > 0 ? \`
  <div style="background:rgba(99,102,241,0.12);border:1px solid var(--accent);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-weight:700;font-size:15px;color:var(--text)">📝 Proposal Received!</div>
      <div style="font-size:13px;color:var(--text2)">You have \${myReqs.filter(r => r.status === 'proposal_sent').length} event proposal(s) awaiting your review.</div>
    </div>
    <button class="btn btn-primary" onclick="goNav('request-status')">Review Proposals</button>
  </div>\` : ''}
  <div class="card" id="client-upcoming-events"`;

if (content.includes(dashTarget)) {
  content = content.replace(dashTarget, dashReplacement);
  console.log('Updated dashClient with proposal banner (CRLF)');
} else if (content.includes(dashTargetLF)) {
  content = content.replace(dashTargetLF, dashReplacement);
  console.log('Updated dashClient with proposal banner (LF)');
} else {
  console.log('dashTarget not found');
}

// 2. In pageRequestStatus: ensure Review Proposal button shows whenever r.status === 'proposal_sent'
const revBtnTarget = "${r.status === 'proposal_sent' && r.proposals?.[r.proposals.length - 1]?.status === 'pending_client' ? `<button class=\"btn btn-primary btn-sm\" onclick=\"openClientPlanReview('${r.id}')\">Review Plan</button>` : ''}";
const revBtnReplacement = "${r.status === 'proposal_sent' ? `<button class=\"btn btn-primary btn-sm\" onclick=\"openClientPlanReview('${r.id}')\">Review Proposal</button>` : ''}";

if (content.includes(revBtnTarget)) {
  content = content.replace(revBtnTarget, revBtnReplacement);
  console.log('Updated review proposal button in pageRequestStatus');
} else {
  console.log('revBtnTarget not found');
}

// 3. In openClientPlanReview: robust proposal object extraction
const prStart = content.indexOf('    function openClientPlanReview(id) {');
const prTarget = `      const request = DB.eventRequests.find(item => String(item.id) === String(id));
      const proposal = request?.proposals?.[request.proposals.length - 1];
      if (!request || !proposal || request.status !== 'proposal_sent' || proposal.status !== 'pending_client') {
        toast('This plan is no longer available for review.', 'error');
        return;
      }`;
const prTargetLF = prTarget.replace(/\r\n/g, '\n');
const prTargetCRLF = prTarget.replace(/\n/g, '\r\n');

const prReplacement = `      const request = DB.eventRequests.find(item => String(item.id) === String(id));
      if (!request || request.status !== 'proposal_sent') {
        toast('This proposal is no longer available for review.', 'error');
        return;
      }
      let proposal = request.proposals?.[request.proposals.length - 1];
      if (!proposal) {
        proposal = {
          version: request.currentProposalVersion || 1,
          amount: request.budget || 25000,
          depositRequired: Math.round((request.budget || 25000) * 0.3),
          status: 'pending_client',
          terms: request.desc || 'Standard event terms apply.',
        };
      }
      if (!proposal.eventPlan && proposal.terms) {
        proposal.eventPlan = proposal.terms;
      }`;

if (content.includes(prTargetCRLF)) {
  content = content.replace(prTargetCRLF, prReplacement);
  console.log('Updated openClientPlanReview guard (CRLF)');
} else if (content.includes(prTargetLF)) {
  content = content.replace(prTargetLF, prReplacement);
  console.log('Updated openClientPlanReview guard (LF)');
} else {
  console.log('prTarget not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Client runtime successfully updated!');
