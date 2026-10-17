"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportReportsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const path = __importStar(require("path"));
const role_guard_1 = require("../../common/guards/role.guard");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
const support_report_dto_1 = require("./dto/support-report.dto");
const support_reports_service_1 = require("./support-reports.service");
let SupportReportsController = class SupportReportsController {
    constructor(service) {
        this.service = service;
    }
    list(userId, role) { return this.service.list(userId, role); }
    create(dto, file, userId, role) { return this.service.create(dto, file, userId, role); }
    get(id, userId, role) { return this.service.get(id, userId, role); }
    submit(id, userId, role) { return this.service.submit(id, userId, role); }
    review(id, dto, userId, role) { return this.service.review(id, dto, userId, role); }
    download(id, userId, role, response) {
        const file = this.service.download(id, userId, role);
        response.set({ 'Content-Type': file.mimeType, 'Content-Disposition': `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}"` });
        return new common_1.StreamableFile(file.stream);
    }
};
exports.SupportReportsController = SupportReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin report inbox; support executives see their own drafts and submissions' }),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save or submit a support report with an optional document' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            const types = { '.pdf': 'application/pdf', '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
            if (types[path.extname(file.originalname).toLowerCase()] !== file.mimetype) {
                callback(new common_1.BadRequestException('Attach a PDF, Word, or Excel document'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __param(3, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [support_report_dto_1.CreateSupportReportDto, Object, String, String]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':reportId/submit'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':reportId/review'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __param(3, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, support_report_dto_1.ReviewSupportReportDto, String, String]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "review", null);
__decorate([
    (0, common_1.Get)(':reportId/file'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SupportReportsController.prototype, "download", null);
exports.SupportReportsController = SupportReportsController = __decorate([
    (0, swagger_1.ApiTags)('support-reports'),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    (0, common_1.Controller)('api/reports/support'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [support_reports_service_1.SupportReportsService])
], SupportReportsController);
//# sourceMappingURL=support-reports.controller.js.map