import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the trusted user role from the authenticated request.
 * Usage: @UserRoleDecorator() role: UserRole
 */
export const UserRoleDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.userRole || request.user?.userRole;
  },
);
