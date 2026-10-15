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
exports.EventPlansController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const event_plans_service_1 = require("./event-plans.service");
const event_plan_dto_1 = require("./dto/event-plan.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const user_id_decorator_1 = require("../../common/decorators/user-id.decorator");
const constants_1 = require("../../common/constants");
const EVENT_PLAN_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-plans');
function ensureEventPlanUploadDir() {
    if (!fs.existsSync(EVENT_PLAN_UPLOAD_DIR)) {
        fs.mkdirSync(EVENT_PLAN_UPLOAD_DIR, { recursive: true });
    }
}
let EventPlansController = class EventPlansController {
    constructor(service) {
        this.service = service;
    }
    uploadDocument(requestId, file, role, userId) {
        if (!file)
            throw new common_1.BadRequestException('A PDF event plan file is required');
        return this.service.uploadDocument(requestId, file, role, userId);
    }
    create(dto, role, userId) {
        return this.service.create(dto, role, userId);
    }
    findAll(role, userId) {
        return this.service.findAll(role, userId);
    }
    findOne(id, role, userId) {
        return this.service.findOne(id, role, userId);
    }
    async downloadDocument(id, role, userId, response) {
        const result = await this.service.getDocument(id, role, userId);
        const fileName = result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        response.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        return new common_1.StreamableFile(result.stream);
    }
    updateApproval(id, dto, role, userId) {
        return this.service.updateApproval(id, dto, role, userId);
    }
};
exports.EventPlansController = EventPlansController;
__decorate([
    (0, common_1.Post)(':requestId/document'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a PDF for an accepted event request' }),
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
                ensureEventPlanUploadDir();
                callback(null, EVENT_PLAN_UPLOAD_DIR);
            },
            filename: (_request, _file, callback) => callback(null, `${(0, crypto_1.randomUUID)()}.pdf`),
        }),
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
            if (file.mimetype !== 'application/pdf' || path.extname(file.originalname).toLowerCase() !== '.pdf') {
                callback(new common_1.BadRequestException('Event plans must be uploaded as PDF files'), false);
                return;
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create event plan (EVENT_ORGANIZER)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event plan created. Notifies client.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_plan_dto_1.CreateEventPlanDto, String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List event plans (role-filtered)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event plans filtered by role' }),
    __param(0, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event plan by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event plan details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/document'),
    (0, swagger_1.ApiOperation)({ summary: 'Download an event plan PDF (authorized client or organizer)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EventPlansController.prototype, "downloadDocument", null);
__decorate([
    (0, common_1.Patch)(':id/approval'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve/reject event plan (CLIENT only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Approval status updated. Notifies organizer.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only CLIENT can approve/reject' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Event plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_role_decorator_1.UserRoleDecorator)()),
    __param(3, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, event_plan_dto_1.UpdateEventPlanApprovalDto, String, String]),
    __metadata("design:returntype", void 0)
], EventPlansController.prototype, "updateApproval", null);
exports.EventPlansController = EventPlansController = __decorate([
    (0, swagger_1.ApiTags)('event-plans'),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    (0, common_1.Controller)('api/event-plans'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', description: 'User ID for ownership checks', required: false }),
    __metadata("design:paramtypes", [event_plans_service_1.EventPlansService])
], EventPlansController);
//# sourceMappingURL=event-plans.controller.js.map