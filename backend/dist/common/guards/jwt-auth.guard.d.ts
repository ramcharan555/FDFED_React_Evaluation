declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
/**
 * JWT Guard
 * Protects endpoints that require JWT authentication
 * Checks for valid bearer token in Authorization header
 */
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    constructor();
}
export {};
//# sourceMappingURL=jwt-auth.guard.d.ts.map