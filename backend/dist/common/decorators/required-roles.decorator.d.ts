import { UserRole } from '../constants';
/**
 * Custom decorator to specify required roles for an endpoint
 * Usage: @RequiredRoles(UserRole.SUPER_ADMIN, UserRole.CLIENT)
 */
export declare const REQUIRED_ROLES_KEY = "required_roles";
export declare const RequiredRoles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
//# sourceMappingURL=required-roles.decorator.d.ts.map