import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../../config/jwt.config';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
/**
 * JWT Strategy for Passport
 * Used to validate JWT tokens and extract user info
 */
export declare class JwtStrategy extends JwtStrategy_base {
    private dataStore;
    constructor();
    validate(payload: JwtPayload): {
        userId: string;
        email: string;
        userRole: import("../constants").UserRole;
    };
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map