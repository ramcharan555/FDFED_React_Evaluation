"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredRoles = exports.REQUIRED_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
/**
 * Custom decorator to specify required roles for an endpoint
 * Usage: @RequiredRoles(UserRole.SUPER_ADMIN, UserRole.CLIENT)
 */
exports.REQUIRED_ROLES_KEY = 'required_roles';
const RequiredRoles = (...roles) => (0, common_1.SetMetadata)(exports.REQUIRED_ROLES_KEY, roles);
exports.RequiredRoles = RequiredRoles;
//# sourceMappingURL=required-roles.decorator.js.map