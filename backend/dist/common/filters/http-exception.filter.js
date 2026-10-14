"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const file_log_service_1 = require("../logging/file-log.service");
let HttpExceptionFilter = class HttpExceptionFilter {
    /*
     * NestJS uses exception filters as its framework-native centralized
     * error-handling mechanism. This global filter captures both expected
     * HttpException errors and unexpected server errors, then writes details
     * to logs/error.log while returning a clean JSON response to the client.
     */
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttpException = exception instanceof common_1.HttpException;
        const status = isHttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = isHttpException
            ? exception.getResponse()
            : 'Internal server error';
        const message = this.getMessage(exceptionResponse);
        const stack = exception instanceof Error ? exception.stack : undefined;
        file_log_service_1.FileLogService.writeError(JSON.stringify({
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.originalUrl,
            statusCode: status,
            message,
            stack,
        }, null, 2));
        response.status(status).json({
            success: false,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
            statusCode: status,
            message,
        });
    }
    getMessage(exceptionResponse) {
        if (typeof exceptionResponse === 'string') {
            return exceptionResponse;
        }
        const responseBody = exceptionResponse;
        return responseBody.message || responseBody.error || 'Request failed';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map