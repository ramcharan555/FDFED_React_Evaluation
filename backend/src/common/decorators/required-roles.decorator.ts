import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants';

/**
 * Custom decorator to specify required roles for an endpoint
 * Usage: @RequiredRoles(UserRole.SUPER_ADMIN, UserRole.CLIENT)
 */
export const REQUIRED_ROLES_KEY = 'required_roles';
export const RequiredRoles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
