import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): any;
    login(loginDto: LoginDto): any;
}
//# sourceMappingURL=auth.controller.d.ts.map