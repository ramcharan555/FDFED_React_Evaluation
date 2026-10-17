import { useEffect } from 'react';
import themeSource from '../utils/theme.js?raw';
import scannerSource from '../utils/ticket-scanner.js?raw';
import supportSource from '../api/support.js?raw';
import supportReportsSource from '../api/support-reports.js?raw';
import accountPolicySource from '../utils/account-policy.js?raw';
import organizerRegSource from '../utils/organizer-registration.js?raw';
import paymentCheckoutSource from '../api/paymentCheckout.js?raw';
import dataSyncSource from '../api/data-sync.js?raw';

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
    const scripts = [run(themeSource), run(scannerSource), run(supportSource), run(supportReportsSource), run(accountPolicySource), run(organizerRegSource), run(source), run(paymentCheckoutSource), run(dataSyncSource)];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => scripts.forEach(script => script.remove());
  }, [source, role]);
  return null;
}
