import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { normalizeRole } from '../constants';

/**
 * RoleGuard authenticates through Passport's JWT strategy, then reads the
 * trusted role placed on the request by that strategy.
 */
@Injectable()
export class RoleGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<Request>();
    const authenticatedUser = (request as any).user;
    const trustedRole = normalizeRole(authenticatedUser?.userRole);
    if (!trustedRole) {
      throw new ForbiddenException('Authenticated user role is invalid');
    }

    (request as any).user = {
      ...authenticatedUser,
      userRole: trustedRole,
    };
    (request as any).userRole = trustedRole;

    return true;
  }
}
