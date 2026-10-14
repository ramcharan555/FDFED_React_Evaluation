import { CanActivate, ExecutionContext } from '@nestjs/common';
declare const RoleGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
/**
 * RoleGuard authenticates through Passport's JWT strategy, then reads the
 * trusted role placed on the request by that strategy.
 */
export declare class RoleGuard extends RoleGuard_base implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
//# sourceMappingURL=role.guard.d.ts.map