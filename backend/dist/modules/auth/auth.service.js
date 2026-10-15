"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const data_store_1 = require("../../common/data-store");
const jwt_config_1 = require("../../config/jwt.config");
const password_1 = require("../../common/utils/password");
const users_service_1 = require("../users/users.service");
const constants_1 = require("../../common/constants");
let AuthService = class AuthService {
    constructor(jwtService, usersService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.dataStore = data_store_1.DataStore.getInstance();
    }
    login(loginDto) {
        const user = this.dataStore.findUserByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const inputPass = (loginDto.password || '').trim();
        const storedPass = (user.password || '').trim();
        // Retain seeded credentials while verifying all passwords exactly.
        const passMatches = (0, password_1.verifyPassword)(inputPass, storedPass);
        if (!passMatches) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.status !== 'active') {
            throw new common_1.BadRequestException(`Account is ${user.status}. Please contact admin.`);
        }
        // Generate JWT token
        const payload = {
            userId: user.userId,
            email: user.email,
            userRole: user.userRole,
        };
        const token = this.jwtService.sign(payload, {
            secret: jwt_config_1.jwtConfig.secret,
            expiresIn: jwt_config_1.jwtConfig.expiresIn,
        }); // Cast to any to bypass strict type checking for expiresIn
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
    register(dto) {
        if (![constants_1.UserRole.ATTENDEE, constants_1.UserRole.CLIENT, constants_1.UserRole.EVENT_ORGANIZER, constants_1.UserRole.EVENT_STAFF].includes(dto.userRole))
            throw new common_1.BadRequestException('This role cannot self-register');
        this.usersService.create({ name: dto.name.trim(), email: dto.email.trim().toLowerCase(), password: dto.password, userRole: dto.userRole, phoneNo: dto.phoneNo }, constants_1.UserRole.SUPER_ADMIN);
        return this.login({ email: dto.email.trim().toLowerCase(), password: dto.password });
    }
    /**
     * Validate JWT token and extract payload
     */
    validateToken(token) {
        try {
            const decoded = this.jwtService.verify(token, {
                secret: jwt_config_1.jwtConfig.secret,
            });
            return decoded;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map