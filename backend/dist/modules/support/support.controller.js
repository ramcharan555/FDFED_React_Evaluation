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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const role_guard_1 = require("../../common/guards/role.guard");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
const support_ticket_dto_1 = require("./dto/support-ticket.dto");
const support_service_1 = require("./support.service");
const SUPPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'support');
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
]);
function ensureUploadDir() {
    if (!fs.existsSync(SUPPORT_UPLOAD_DIR)) {
        fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });
    }
}
function supportFileName(originalName) {
    const extension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
    return `${(0, crypto_1.randomUUID)()}${extension}`;
}
let SupportController = class SupportController {
    constructor(service) {
        this.service = service;
    }
    listTickets(userId, role) {
        return this.service.listTickets(userId, role);
    }
    createTicket(userId, role, dto) {
        return this.service.createTicket(userId, role, dto);
    }
    uploadAttachment(userId, file) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        return this.service.registerAttachment(userId, file);
    }
    async downloadAttachment(attachmentId, userId, role, response) {
        const result = await this.service.getAttachment(attachmentId, userId, role);
        const downloadName = result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        response.set({
            'Content-Type': result.mimeType,
            'Content-Disposition': `attachment; filename="${downloadName}"`,
        });
        return new common_1.StreamableFile(result.stream);
    }
    updateStatus(ticketId, role, dto) {
        return this.service.updateStatus(ticketId, role, dto);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Get)('tickets'),
    (0, swagger_1.ApiOperation)({ summary: 'List the authenticated user’s support tickets; administrators can view all tickets' }),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "listTickets", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a support ticket using a role-authorized request type and concern' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Support ticket created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Request type is not available to this role' }),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, support_ticket_dto_1.CreateSupportTicketDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Post)('attachments'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a support attachment (JPG, PNG, WEBP, PDF, or TXT; up to 5 MB)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
            required: ['file'],
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (_request, _file, callback) => {
                ensureUploadDir();
                callback(null, SUPPORT_UPLOAD_DIR);
            },
            filename: (_request, file, callback) => callback(null, supportFileName(file.originalname)),
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
                callback(new common_1.BadRequestException('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, TXT.'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, user_id_decorator_1.UserId)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "uploadAttachment", null);
__decorate([
    (0, common_1.Get)('attachments/:attachmentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Download a support attachment owned by the requester or viewable by an administrator' }),
    __param(0, (0, common_1.Param)('attachmentId')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "downloadAttachment", null);
__decorate([
    (0, common_1.Patch)('tickets/:ticketId/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a support ticket status; resolving it emails the requester' }),
    __param(0, (0, common_1.Param)('ticketId')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, support_ticket_dto_1.UpdateSupportTicketStatusDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "updateStatus", null);
exports.SupportController = SupportController = __decorate([
    (0, swagger_1.ApiTags)('customer-support'),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    (0, common_1.Controller)('api/support'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map