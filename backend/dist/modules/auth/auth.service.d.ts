import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../config/jwt.config';
export declare class AuthService {
    private jwtService;
    private dataStore;
    constructor(jwtService: JwtService);
    login(loginDto: LoginDto): any;
    /**
     * Validate JWT token and extract payload
     */
    validateToken(token: string): JwtPayload;
}
//# sourceMappingURL=auth.service.d.ts.map