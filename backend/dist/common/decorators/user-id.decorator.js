"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
const common_1 = require("@nestjs/common");
/**
 * Custom decorator to extract user ID from the authenticated request.
 * Usage: @UserId() userId: string
 */
exports.UserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId;
});
//# sourceMappingURL=user-id.decorator.js.map