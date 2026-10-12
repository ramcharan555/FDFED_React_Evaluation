import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Guard
 * Protects endpoints that require JWT authentication
 * Checks for valid bearer token in Authorization header
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
