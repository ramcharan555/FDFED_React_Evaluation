import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract user ID from the authenticated request.
 * Usage: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<any>();
    return request.user?.userId;
  },
);
