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
exports.ActivityLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const activity_log_service_1 = require("../../modules/activity-log/activity-log.service");
/**
 * Activity logging interceptor
 * Logs all CREATE, UPDATE, DELETE operations
 */
let ActivityLoggingInterceptor = class ActivityLoggingInterceptor {
    constructor(activityLogService) {
        this.activityLogService = activityLogService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const path = request.path;
        const role = request.userRole;
        // Only log non-GET requests
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            this.activityLogService.logActivity({
                action: method,
                resource: path,
                role: role || 'unknown',
                timestamp: new Date(),
                status: 'success',
                details: data,
            });
        }));
    }
};
exports.ActivityLoggingInterceptor = ActivityLoggingInterceptor;
exports.ActivityLoggingInterceptor = ActivityLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [activity_log_service_1.ActivityLogService])
], ActivityLoggingInterceptor);
//# sourceMappingURL=activity-logging.interceptor.js.map