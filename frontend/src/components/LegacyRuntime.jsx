import { useEffect } from 'react';
import themeSource from '../services/theme.js?raw';
import scannerSource from '../services/ticket-scanner.js?raw';
import supportSource from '../services/support.js?raw';
import supportReportsSource from '../services/support-reports.js?raw';
import accountPolicySource from '../services/account-policy.js?raw';
import paymentCheckoutSource from '../services/paymentCheckout.js?raw';
import dataSyncSource from '../services/data-sync.js?raw';

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
    const scripts = [run(themeSource), run(scannerSource), run(supportSource), run(supportReportsSource), run(accountPolicySource), run(source), run(paymentCheckoutSource), run(dataSyncSource)];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => scripts.forEach(script => script.remove());
  }, [source, role]);
  return null;
}
