"use strict";
/**
 * JWT Configuration
 * Handles token generation and verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
exports.jwtConfig = {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h', // Ensure this is a string
};
//# sourceMappingURL=jwt.config.js.map