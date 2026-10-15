import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataStore } from '../../common/data-store';
import { LoginDto } from './dto/login.dto';
import { jwtConfig, JwtPayload } from '../../config/jwt.config';
import { verifyPassword } from '../../common/utils/password';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../../common/constants';

@Injectable()
export class AuthService {
  private dataStore: DataStore;

  constructor(private jwtService: JwtService, private usersService: UsersService) {
    this.dataStore = DataStore.getInstance();
  }

  login(loginDto: LoginDto): any {
    const user = this.dataStore.findUserByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const inputPass = (loginDto.password || '').trim();
    const storedPass = (user.password || '').trim();

    // Retain seeded credentials while verifying all passwords exactly.
    const passMatches = verifyPassword(inputPass, storedPass);

    if (!passMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new BadRequestException(`Account is ${user.status}. Please contact admin.`);
    }

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.userId,
      email: user.email,
      userRole: user.userRole,
    };

    const token = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: jwtConfig.expiresIn,
    } as any); // Cast to any to bypass strict type checking for expiresIn

    // Do NOT return password
    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'Login successful',
      data: {
        ...safeUser,
        token, // Include JWT token
      },
    };
  }

  register(dto: RegisterDto) {
    if (![UserRole.ATTENDEE, UserRole.CLIENT, UserRole.EVENT_ORGANIZER, UserRole.EVENT_STAFF].includes(dto.userRole)) throw new BadRequestException('This role cannot self-register');
    this.usersService.create({ name: dto.name.trim(), email: dto.email.trim().toLowerCase(), password: dto.password, userRole: dto.userRole, phoneNo: dto.phoneNo }, UserRole.SUPER_ADMIN);
    return this.login({ email: dto.email.trim().toLowerCase(), password: dto.password });
  }

  /**
   * Validate JWT token and extract payload
   */
  validateToken(token: string): JwtPayload {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: jwtConfig.secret,
      });
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
