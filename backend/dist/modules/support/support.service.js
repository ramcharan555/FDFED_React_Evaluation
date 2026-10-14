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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const constants_1 = require("../../common/constants");
const data_store_1 = require("../../common/data-store");
const support_constants_1 = require("./support.constants");
const support_mail_service_1 = require("./support-mail.service");
let SupportService = class SupportService {
    constructor(mailService) {
        this.mailService = mailService;
        this.db = data_store_1.DataStore.getInstance();
    }
    listTickets(userId, role) {
        const tickets = this.db.supportTickets
            .filter(ticket => role === constants_1.UserRole.SUPER_ADMIN || ticket.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return tickets.map(ticket => ({
            ...ticket,
            ...(role === constants_1.UserRole.SUPER_ADMIN
                ? {
                    requesterName: this.db.findUserById(ticket.userId)?.name || 'Unknown user',
                    requesterEmail: this.db.findUserById(ticket.userId)?.email || '',
                }
                : {}),
        }));
    }
    createTicket(userId, role, dto) {
        const user = this.db.findUserById(userId);
        if (!user)
            throw new common_1.NotFoundException('Authenticated user was not found');
        if (!(0, support_constants_1.canSubmitSupportCategory)(role, dto.requestType)) {
            throw new common_1.ForbiddenException('Your role cannot submit a request in this category');
        }
        if (!support_constants_1.SUPPORT_CONCERNS[dto.requestType].includes(dto.concern)) {
            throw new common_1.BadRequestException('The selected concern does not belong to this request type');
        }
        const description = dto.description.trim();
        if (!description) {
            throw new common_1.BadRequestException('Description is required');
        }
        const attachmentIds = dto.attachmentIds || [];
        const attachments = attachmentIds.map(attachmentId => {
            const alreadySubmitted = this.db.supportTickets.some(ticket => ticket.attachments.some(item => item.attachmentId === attachmentId));
            const attachment = this.db.supportAttachments.find(item => item.attachmentId === attachmentId && item.userId === userId);
            if (!attachment || alreadySubmitted) {
                throw new common_1.BadRequestException('One or more attachments are invalid or unavailable');
            }
            return attachment;
        });
        const year = new Date().getFullYear();
        const ticketNumber = this.db.supportTickets.reduce((maximum, ticket) => {
            const match = ticket.ticketId.match(new RegExp(`^SUP-${year}-(\\d+)$`));
            return match ? Math.max(maximum, Number(match[1])) : maximum;
        }, 0) + 1;
        const now = new Date();
        const ticket = {
            ticketId: `SUP-${year}-${String(ticketNumber).padStart(5, '0')}`,
            userId,
            requestType: dto.requestType,
            concern: dto.concern,
            description,
            attachments: attachments.map(({ userId: _userId, filePath: _filePath, createdAt: _createdAt, ...item }) => item),
            status: 'open',
            createdAt: now,
            updatedAt: now,
        };
        this.db.supportTickets.push(ticket);
        return ticket;
    }
    registerAttachment(userId, file) {
        if (!file)
            throw new common_1.BadRequestException('File is required');
        const attachment = {
            attachmentId: this.db.generateId('support-file'),
            userId,
            originalName: (0, path_1.basename)(file.originalname),
            fileName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            filePath: file.path,
            createdAt: new Date(),
        };
        this.db.supportAttachments.push(attachment);
        const { userId: _userId, filePath: _filePath, createdAt: _createdAt, ...result } = attachment;
        return result;
    }
    async getAttachment(attachmentId, userId, role) {
        const ticket = this.db.supportTickets.find(item => (role === constants_1.UserRole.SUPER_ADMIN || item.userId === userId)
            && item.attachments.some(attachment => attachment.attachmentId === attachmentId));
        if (!ticket)
            throw new common_1.NotFoundException('Attachment not found');
        const attachment = this.db.supportAttachments.find(item => item.attachmentId === attachmentId);
        const submittedAttachment = ticket.attachments.find(item => item.attachmentId === attachmentId);
        const fileName = attachment?.filePath || '';
        if (!submittedAttachment || !fileName || !(0, fs_1.existsSync)(fileName)) {
            throw new common_1.NotFoundException('Attachment file is unavailable');
        }
        await (0, promises_1.access)(fileName, fs_1.constants.R_OK);
        return {
            stream: (0, fs_1.createReadStream)(fileName),
            mimeType: submittedAttachment.mimeType,
            fileName: submittedAttachment.originalName,
        };
    }
    async updateStatus(ticketId, role, dto) {
        if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only administrators can update support ticket status');
        }
        const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId);
        if (!ticket)
            throw new common_1.NotFoundException('Support ticket not found');
        if (dto.status === 'resolved' && ticket.status !== 'resolved') {
            const requester = this.db.findUserById(ticket.userId);
            if (!requester?.email)
                throw new common_1.BadRequestException('Requester email address is unavailable');
            await this.mailService.sendResolvedEmail(ticket, requester);
            ticket.resolutionEmailSentAt = new Date();
        }
        ticket.status = dto.status;
        ticket.updatedAt = new Date();
        return ticket;
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [support_mail_service_1.SupportMailService])
], SupportService);
//# sourceMappingURL=support.service.js.map