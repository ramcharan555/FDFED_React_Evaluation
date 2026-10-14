/**
 * JWT Configuration
 * Handles token generation and verification
 */
export declare const jwtConfig: {
    secret: string;
    expiresIn: string;
};
/**
 * JWT Payload interface
 */
export interface JwtPayload {
    userId: string;
    email: string;
    userRole: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=jwt.config.d.ts.map