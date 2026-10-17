import { EmployeeType, UserRole } from './constants';
import type { User } from './data-store';

export function isSupportExecutive(user?: User): boolean {
  const type = String(user?.employeeType || '').toUpperCase().replace(/[\s-]+/g, '_');
  return user?.userRole === UserRole.EVENT_STAFF && [
    EmployeeType.SUPPORT_EXECUTIVE, EmployeeType.REGISTRATION_VERIFICATION, EmployeeType.EVENT_OPERATIONS,
  ].includes(type as EmployeeType);
}

export function isFinanceExecutive(user?: User): boolean {
  return user?.userRole === UserRole.EVENT_STAFF && [EmployeeType.SUPPORT_FINANCE, EmployeeType.FINANCE_EXECUTIVE]
    .includes(user.employeeType as EmployeeType);
}
