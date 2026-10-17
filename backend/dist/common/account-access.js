"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupportExecutive = isSupportExecutive;
exports.isFinanceExecutive = isFinanceExecutive;
const constants_1 = require("./constants");
function isSupportExecutive(user) {
    const type = String(user?.employeeType || '').toUpperCase().replace(/[\s-]+/g, '_');
    return user?.userRole === constants_1.UserRole.EVENT_STAFF && [
        constants_1.EmployeeType.SUPPORT_EXECUTIVE, constants_1.EmployeeType.REGISTRATION_VERIFICATION, constants_1.EmployeeType.EVENT_OPERATIONS,
    ].includes(type);
}
function isFinanceExecutive(user) {
    return user?.userRole === constants_1.UserRole.EVENT_STAFF && [constants_1.EmployeeType.SUPPORT_FINANCE, constants_1.EmployeeType.FINANCE_EXECUTIVE]
        .includes(user.employeeType);
}
//# sourceMappingURL=account-access.js.map