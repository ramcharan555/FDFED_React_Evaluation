import { useEffect } from 'react';
import themeSource from '../services/theme.js?raw';
import scannerSource from '../services/ticket-scanner.js?raw';

function run(source) {
  const script = document.createElement('script');
  script.textContent = source;
  document.body.appendChild(script);
  return script;
}

export default function LegacyRuntime({ source, role }) {
  useEffect(() => {
    document.body.dataset.eventflowRole = role;
    const scripts = [run(themeSource), run(scannerSource), run(source)];
    document.dispatchEvent(new Event('DOMContentLoaded'));
    return () => scripts.forEach(script => script.remove());
  }, [source, role]);
  return null;
}
