import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../config/jwt.config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private jwtService;
    private usersService;
    private dataStore;
    constructor(jwtService: JwtService, usersService: UsersService);
    login(loginDto: LoginDto): any;
    register(dto: RegisterDto): any;
    /**
     * Validate JWT token and extract payload
     */
    validateToken(token: string): JwtPayload;
}
//# sourceMappingURL=auth.service.d.ts.map