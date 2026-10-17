import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../config/jwt.config';
import { ChangePasswordDto, RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private jwtService;
    private dataStore;
    constructor(jwtService: JwtService);
    register(dto: RegisterDto): any;
    changePassword(dto: ChangePasswordDto, userId: string): {
        success: boolean;
        message: string;
    };
    login(loginDto: LoginDto): any;
    /**
     * Validate JWT token and extract payload
     */
    validateToken(token: string): JwtPayload;
}
//# sourceMappingURL=auth.service.d.ts.map