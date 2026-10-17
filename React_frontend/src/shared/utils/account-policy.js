(() => {
  const normalizeEmail = value => String(value || '').trim().toLowerCase();
  function isEmailInUse(users, email, currentId) {
    const normalized = normalizeEmail(email);
    return users.some(user => normalizeEmail(user.email) === normalized &&
      (currentId == null || String(user.id ?? user.userId) !== String(currentId)));
  }

  const normalizeRole = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const adminRoles = new Set(['superuser', 'super_admin', 'superadmin', 'super_user', 'admin']);
  const customerRoles = new Set(['client', 'organizer', 'event_organizer', 'attendee']);
  const employeeRoles = new Set(['staff', 'event_staff', 'employee', 'support_executive', 'finance_executive', 'support_finance', 'registration_verification', 'event_operations']);
  function isSupportExecutiveAccount(user) {
    if (!user) return false;
    const roles = [user.role, user.userRole].map(normalizeRole);
    if (roles.some(role => adminRoles.has(role))) return false;
    return roles.includes('support_executive') ||
      ['support_executive', 'registration_verification', 'event_operations'].includes(normalizeRole(user.employeeType)) ||
      ['arjun.events@eventflow.com', 'employee@example.com', 'employee@eventflow.com'].includes(normalizeEmail(user.email));
  }
  function isPersonnelAccount(user) {
    return !!user && (!!user.employeeType || [user.role, user.userRole].some(role => employeeRoles.has(normalizeRole(role))));
  }
  function visibleAccounts(actor, users) {
    return isSupportExecutiveAccount(actor) ? users.filter(user => !isPersonnelAccount(user)) : users;
  }
  function canManageAccount(actor, target) {
    if (!actor || !target) return false;
    if (!isSupportExecutiveAccount(actor)) return true;
    const roles = [target.role, target.userRole].map(normalizeRole).filter(Boolean);
    return !target.employeeType && roles.some(role => customerRoles.has(role)) &&
      !roles.some(role => adminRoles.has(role) || employeeRoles.has(role));
  }
  function canApplyAccountUpdate(actor, target, updates) {
    if (!canManageAccount(actor, target)) return false;
    if (!isSupportExecutiveAccount(actor)) return true;
    if ('employeeType' in updates) return false;
    const currentRole = normalizeRole(target.role || target.userRole);
    const equivalentRole = role => role === 'event_organizer' ? 'organizer' : role;
    return ['role', 'userRole'].every(key => !(key in updates) ||
      equivalentRole(normalizeRole(updates[key])) === equivalentRole(currentRole));
  }

  function migrateLegacyDemoData(db) {
    // Remove only the retired, explicitly seeded secondary account.
    db.users = (db.users || []).filter(user => !(user.id === 'usr-dup-001' &&
      normalizeEmail(user.email) === 'attendee@example.com' && user.name === 'Priya Patel (Secondary)'));
    for (const query of db.userQueries || []) {
      if (query.id === 'UQR-501' && query.subject === 'Request to delete duplicate attendee account') {
        query.subject = 'Request permanent account deletion';
        query.detail = 'User requested permanent deletion of their attendee account and associated personal data.';
      }
      if (query.id === 'UQR-505' && query.subject === 'Duplicate ticket registration merge inquiry') {
        Object.assign(query, { userId: 'usr-attendee-001', userName: 'Priya Patel',
          subject: 'Ticket details correction request', detail: 'User requested a correction to the attendee name on their Tech Summit ticket.' });
      }
    }
    for (const report of [...(db.regReports || []), ...(db.supportExecReports || [])]) {
      if ((report.id === 'RVR-002' || report.sourceReference === 'legacy:RVR-002') && !report.hasDocument &&
        report.title === 'Duplicate Account Detection & Resolution Summary — Q2 2026') {
        const previousTitle = report.title;
        report.title = 'Account Access & Verification Summary — Q2 2026';
        if (report.summary === previousTitle) report.summary = report.title;
        report.fileName = report.backendReportId ? 'No document attached' : 'Account_Access_Verification_Q2_2026.docx';
      }
    }
  }

  window.EventFlowAccountPolicy = { normalizeEmail, isEmailInUse, migrateLegacyDemoData,
    isSupportExecutiveAccount, isPersonnelAccount, visibleAccounts, canManageAccount, canApplyAccountUpdate };
})();
