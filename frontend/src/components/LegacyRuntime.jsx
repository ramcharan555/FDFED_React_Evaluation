import { useEffect } from 'react';
import themeSource from '../services/theme.js?raw';
import scannerSource from '../services/ticket-scanner.js?raw';
import supportSource from '../services/support.js?raw';
import paymentCheckoutSource from '../services/paymentCheckout.js?raw';
import connectedWorkspaceSource from '../services/connectedWorkspace.js?raw';
import reportInboxSource from '../services/financeReportInbox.js?raw';
import '../styles/connectedWorkspace.css';
import '../styles/financeReports.css';

function run(source) {
  const script = document.createElement('script');
  script.textContent = source;
  document.body.appendChild(script);
  return script;
}

export default function LegacyRuntime({ source, role }) {
  useEffect(() => {
    const existingRuntime = window.__eventFlowLegacyRuntime;
    if (existingRuntime) {
      if (existingRuntime.role !== role || existingRuntime.source !== source) window.location.reload();
      return;
    }
    window.__eventFlowLegacyRuntime = { role, source };
    document.body.dataset.eventflowRole = role;
    // Connected forms validate historical dates and optional fields independently.
    const preparedSource = source.replace('function validateInput(target) {', "function validateInput(target) { if (target.closest('.cw-workspace, .cw-form')) return true;");
    const scripts = [run(themeSource), run(scannerSource), run(supportSource), run(preparedSource), run(paymentCheckoutSource), run(reportInboxSource), run(connectedWorkspaceSource)];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => scripts.forEach(script => script.remove());
  }, [source, role]);
  return null;
}
