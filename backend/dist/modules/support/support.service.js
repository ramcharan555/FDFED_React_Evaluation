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
    isSupportAgent(userId, role) {
        const user = this.db.findUserById(userId);
        return role === constants_1.UserRole.SUPER_ADMIN
            || (role === constants_1.UserRole.EVENT_STAFF && String(user?.employeeType || '').toUpperCase() === 'SUPPORT_EXECUTIVE');
    }
    listTickets(userId, role) {
        const canViewAll = this.isSupportAgent(userId, role);
        const tickets = this.db.supportTickets
            .filter(ticket => canViewAll || ticket.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return tickets.map(ticket => ({
            ...ticket,
            ...(canViewAll
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
        this.db.persist();
        return ticket;
    }
    addRequesterFollowUp(ticketId, userId, dto) {
        const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId && item.userId === userId);
        if (!ticket)
            throw new common_1.NotFoundException('Support ticket not found');
        const message = dto.message.trim();
        if (!message)
            throw new common_1.BadRequestException('Follow-up message is required');
        ticket.messages ||= [];
        ticket.messages.push({ sender: 'requester', message, createdAt: new Date() });
        ticket.status = 'open';
        ticket.updatedAt = new Date();
        this.db.persist();
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
        const canViewAll = this.isSupportAgent(userId, role);
        const ticket = this.db.supportTickets.find(item => (canViewAll || item.userId === userId)
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
    async updateStatus(ticketId, userId, role, dto) {
        if (!this.isSupportAgent(userId, role)) {
            throw new common_1.ForbiddenException('Only the Support Executive or an administrator can update support tickets');
        }
        const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId);
        if (!ticket)
            throw new common_1.NotFoundException('Support ticket not found');
        const response = dto.response?.trim();
        let emailNotificationSent = false;
        if (dto.response !== undefined && response)
            ticket.response = response;
        const lastMessage = ticket.messages?.[ticket.messages.length - 1];
        if (dto.response !== undefined && response && lastMessage?.sender !== 'support') {
            ticket.messages ||= [];
            ticket.messages.push({ sender: 'support', message: response, createdAt: new Date() });
        }
        else if (dto.response !== undefined && response && lastMessage?.message !== response) {
            ticket.messages ||= [];
            ticket.messages.push({ sender: 'support', message: response, createdAt: new Date() });
        }
        if (dto.status === 'resolved' && ticket.status !== 'resolved') {
            const requester = this.db.findUserById(ticket.userId);
            if (!ticket.response)
                throw new common_1.BadRequestException('Add a reply before resolving this ticket');
            ticket.status = dto.status;
            ticket.updatedAt = new Date();
            try {
                emailNotificationSent = requester?.email
                    ? await this.mailService.sendResolvedEmail(ticket, requester)
                    : false;
            }
            catch (_error) {
                emailNotificationSent = false;
            }
            if (emailNotificationSent)
                ticket.resolutionEmailSentAt = new Date();
        }
        ticket.status = dto.status;
        ticket.updatedAt = new Date();
        this.db.persist();
        return { ...ticket, emailNotificationSent };
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [support_mail_service_1.SupportMailService])
], SupportService);
//# sourceMappingURL=support.service.js.map