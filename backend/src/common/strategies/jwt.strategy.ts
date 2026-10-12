import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig, JwtPayload } from '../../config/jwt.config';
import { DataStore } from '../data-store';

/**
 * JWT Strategy for Passport
 * Used to validate JWT tokens and extract user info
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private dataStore: DataStore;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
    this.dataStore = DataStore.getInstance();
  }

  validate(payload: JwtPayload) {
    const user = this.dataStore.findUserByEmail(payload.email);

    if (
      !user ||
      user.status !== 'active' ||
      user.userId !== payload.userId
    ) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user info to be attached to request
    return {
      userId: payload.userId,
      email: payload.email,
      userRole: user.userRole,
    };
  }
}
