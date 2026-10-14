"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const constants_1 = require("../constants");
/**
 * RoleGuard authenticates through Passport's JWT strategy, then reads the
 * trusted role placed on the request by that strategy.
 */
let RoleGuard = class RoleGuard extends (0, passport_1.AuthGuard)('jwt') {
    async canActivate(context) {
        await super.canActivate(context);
        const request = context.switchToHttp().getRequest();
        const authenticatedUser = request.user;
        const trustedRole = (0, constants_1.normalizeRole)(authenticatedUser?.userRole);
        if (!trustedRole) {
            throw new common_1.ForbiddenException('Authenticated user role is invalid');
        }
        request.user = {
            ...authenticatedUser,
            userRole: trustedRole,
        };
        request.userRole = trustedRole;
        return true;
    }
};
exports.RoleGuard = RoleGuard;
exports.RoleGuard = RoleGuard = __decorate([
    (0, common_1.Injectable)()
], RoleGuard);
//# sourceMappingURL=role.guard.js.map