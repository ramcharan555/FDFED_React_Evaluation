/**
 * JWT Configuration
 * Handles token generation and verification
 */

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: '24h', // Ensure this is a string
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
