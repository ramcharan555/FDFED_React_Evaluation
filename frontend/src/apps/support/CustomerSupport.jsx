import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supportSource from '../../services/support.js?raw';
import '../attendee/attendee.css';

export default function CustomerSupport() {
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let user = null;
    try {
      user = JSON.parse(sessionStorage.getItem('ef_cu') || 'null');
    } catch (error) {
      console.error('Could not read the signed-in user for customer support.', error);
    }

    if (!user?.token) {
      navigate('/landing', { replace: true });
      return undefined;
    }

    const script = document.createElement('script');
    script.textContent = supportSource;
    document.body.appendChild(script);

    const start = async () => {
      try {
        const support = window.EventFlowSupport;
        const content = contentRef.current;
        if (!support || !content) {
          throw new Error('Customer Support could not be initialized.');
        }
        if (!support.canRequestSupport(user)) {
          const role = String(user.role || user.userRole || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
          const employeeType = String(user.employeeType || role).trim().toUpperCase().replace(/[\s-]+/g, '_');
          const home = ['superuser', 'super_admin', 'superadmin', 'admin'].includes(role)
            ? '/admin'
            : ['FINANCE_EXECUTIVE', 'SUPPORT_FINANCE'].includes(employeeType) ? '/employee2' : '/employee1';
          navigate(home, { replace: true });
          return;
        }
        content.innerHTML = await support.render(user, 'Sign out and return');
        support.bind(content, user, () => {
          sessionStorage.removeItem('ef_cu');
          navigate('/landing', { replace: true });
        }, 'Sign out and return');
      } catch (error) {
        if (active && contentRef.current) {
          contentRef.current.textContent = error.message;
        }
      }
    };

    start();
    return () => {
      active = false;
      script.remove();
    };
  }, [navigate]);

  return <main className="support-standalone" id="page-content" ref={contentRef} />;
}
