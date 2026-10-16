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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const reports_service_1 = require("./reports.service");
const report_dto_1 = require("./dto/report.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
const EVENT_REPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-reports');
function ensureEventReportUploadDir() {
    if (!fs.existsSync(EVENT_REPORT_UPLOAD_DIR)) {
        fs.mkdirSync(EVENT_REPORT_UPLOAD_DIR, { recursive: true });
    }
}
let ReportsController = class ReportsController {
    constructor(service) {
        this.service = service;
    }
    createEventReport(dto, role, userId) {
        return this.service.createEventReport(dto, role, userId);
    }
    uploadEventReport(eventId, file, role, userId) {
        if (!file)
            throw new common_1.BadRequestException('Select a report file to submit');
        return this.service.uploadEventReport(eventId, file, role, userId);
    }
    async getEventReportFile(reportId, role, userId, response) {
        const file = await this.service.getEventReportFile(reportId, role, userId);
        response.set({ 'Content-Type': file.mimeType, 'Content-Disposition': `attachment; filename="${file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"` });
        return new common_1.StreamableFile(file.stream);
    }
    findAllEventReports(role, userId) {
        return this.service.findAllEventReports(role, userId);
    }
    createCompletionReport(eventId, dto, files, role, userId) {
        return this.service.createCompletionReport(eventId, dto, files || [], role, userId);
    }
    findAllCompletionReports(role, userId) {
        return this.service.findAllCompletionReports(role, userId);
    }
    async getCompletionReportPhoto(eventId, fileName, role, userId, response) {
        const photo = await this.service.getCompletionReportPhoto(eventId, fileName, role, userId);
        response.set({
            'Content-Type': photo.mimeType,
            'Content-Disposition': `inline; filename="${photo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
        });
        return new common_1.StreamableFile(photo.stream);
    }
    createStaffReport(dto, role, userId) {
        return this.service.createStaffReport(dto, role, userId);
    }
    findAllStaffReports(role, userId) {
        return this.service.findAllStaffReports(role, userId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event report (EVENT_ORGANIZER sends final report to client)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event report created. Notifies client.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_ORGANIZER can create event reports' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateEventReportDto, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createEventReport", null);
__decorate([
    (0, common_1.Post)('events/:eventId/file'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Upload an event report for the requesting client (assigned organizer only)' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_request, _file, callback) => { ensureEventReportUploadDir(); callback(null, EVENT_REPORT_UPLOAD_DIR); },
            filename: (_request, file, callback) => callback(null, `${(0, crypto_1.randomUUID)()}${path.extname(file.originalname).toLowerCase()}`),
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            const mimeTypes = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
            if (mimeTypes[path.extname(file.originalname).toLowerCase()] !== file.mimetype) {
                callback(new common_1.BadRequestException('Report files must be PDF, DOCX, or XLSX'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "uploadEventReport", null);
__decorate([
    (0, common_1.Get)('events/:reportId/file'),
    (0, swagger_1.ApiOperation)({ summary: 'Download an event report file with ownership authorization' }),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getEventReportFile", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'List event reports (role-filtered)' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAllEventReports", null);
__decorate([
    (0, common_1.Post)('events/:eventId/completion'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a completed-event report with optional photos (assigned organizer only)' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 5, {
        storage: (0, multer_1.diskStorage)({
            destination: (_request, _file, callback) => {
                ensureEventReportUploadDir();
                callback(null, EVENT_REPORT_UPLOAD_DIR);
            },
            filename: (_request, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${path.extname(file.originalname).toLowerCase()}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
            const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
            if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
                callback(new common_1.BadRequestException('Report photos must be JPG, PNG, or WEBP images'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(4, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, report_dto_1.CreateEventCompletionReportDto, Object, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createCompletionReport", null);
__decorate([
    (0, common_1.Get)('events/completion'),
    (0, swagger_1.ApiOperation)({ summary: 'List completion reports visible to the client, assigned organizer, or admin' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAllCompletionReports", null);
__decorate([
    (0, common_1.Get)('events/:eventId/completion/photos/:fileName'),
    (0, swagger_1.ApiOperation)({ summary: 'View a completion-report photo with event ownership authorization' }),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Param)('fileName')),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __param(4, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCompletionReportPhoto", null);
__decorate([
    (0, common_1.Post)('staff'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create staff report (EVENT_STAFF only, must be assigned to event)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff report created. Organizer notified.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Staff can only report for assigned events' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateStaffReportDto, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "createStaffReport", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, swagger_1.ApiOperation)({ summary: 'List staff reports (role-filtered)' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAllStaffReports", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('api/reports'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership', required: false }),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map