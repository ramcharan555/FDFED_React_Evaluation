import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): any;
    changePassword(dto: ChangePasswordDto, userId: string): {
        success: boolean;
        message: string;
    };
    login(loginDto: LoginDto): any;
}
//# sourceMappingURL=auth.controller.d.ts.map