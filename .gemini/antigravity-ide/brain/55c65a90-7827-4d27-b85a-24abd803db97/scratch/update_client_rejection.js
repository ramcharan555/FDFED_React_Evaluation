const fs = require('fs');
const path = require('path');

const filePath = path.resolve(process.cwd(), 'React_frontend/src/apps/client/app/runtime.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. In viewRequestDrawer / renderWorkflowRequestDetails
const target1 = "${r.status === 'rejected' && r.rejectionReason ? `<div style=\"padding:12px;background:var(--red-dim);margin:12px 0\"><strong>Reason for declining</strong><p style=\"margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere\">${workflowHtml(r.rejectionReason)}</p></div>` : ''}";
const replacement1 = "${r.status === 'rejected' && r.rejectionReason ? `<div style=\"padding:12px;background:var(--red-dim);margin:12px 0;border-radius:8px\"><strong style=\"color:var(--red)\">&#10005; Reason for declining</strong><p style=\"margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere\">${workflowHtml(r.rejectionReason)}</p>${r.rejectionComments ? `<p style=\"margin:6px 0 0;font-size:12px;color:var(--text2)\"><strong>Additional comments:</strong> ${workflowHtml(r.rejectionComments)}</p>` : ''}</div>` : ''}";

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('Updated client drawer rejection display');
} else {
  console.log('Target 1 not found');
}

// 2. In pageRequestStatus card
const cardTarget = "<span class=\"badge badge-${reqBadge(r.status)}\">${r.status === 'approved' ? 'Accepted' : r.status}</span>\r\n        </div>";
const cardTargetLF = "<span class=\"badge badge-${reqBadge(r.status)}\">${r.status === 'approved' ? 'Accepted' : r.status}</span>\n        </div>";

const cardReplacement = `<span class=\"badge badge-\${reqBadge(r.status)}\">\${r.status === 'approved' ? 'Accepted' : r.status}</span>
          \${r.status === 'rejected' && r.rejectionReason ? \`<div style=\"margin-top:8px;padding:8px 12px;background:var(--red-dim);border-radius:6px;font-size:12.5px\"><strong style=\"color:var(--red)\">Declined:</strong> \${escapeHtml(r.rejectionReason)}\${r.rejectionComments ? \`<div class=\"small mt-4\" style=\"color:var(--text2)\">\${escapeHtml(r.rejectionComments)}</div>\` : ''}</div>\` : ''}
        </div>`;

if (content.includes(cardTarget)) {
  content = content.replace(cardTarget, cardReplacement);
  console.log('Updated client pageRequestStatus card (CRLF)');
} else if (content.includes(cardTargetLF)) {
  content = content.replace(cardTargetLF, cardReplacement);
  console.log('Updated client pageRequestStatus card (LF)');
} else {
  console.log('Card target not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done updating client runtime!');
