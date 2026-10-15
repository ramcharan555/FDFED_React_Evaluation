import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { constants, createReadStream, existsSync } from 'fs';
import { access } from 'fs/promises';
import { basename } from 'path';
import { UserRole } from '../../common/constants';
import {
  DataStore,
  SupportAttachment,
  SupportTicket,
} from '../../common/data-store';
import { CreateSupportFollowUpDto, CreateSupportTicketDto, UpdateSupportTicketStatusDto } from './dto/support-ticket.dto';
import { canSubmitSupportCategory, SUPPORT_CONCERNS } from './support.constants';
import { SupportMailService } from './support-mail.service';

type SupportTicketListItem = SupportTicket & {
  requesterName?: string;
  requesterEmail?: string;
};

@Injectable()
export class SupportService {
  private readonly db = DataStore.getInstance();

  constructor(private readonly mailService: SupportMailService) {}

  private isSupportAgent(userId: string, role: UserRole): boolean {
    const user = this.db.findUserById(userId);
    return role === UserRole.SUPER_ADMIN
      || (role === UserRole.EVENT_STAFF && String(user?.employeeType || '').toUpperCase() === 'SUPPORT_EXECUTIVE');
  }

  listTickets(userId: string, role: UserRole): SupportTicketListItem[] {
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

  createTicket(userId: string, role: UserRole, dto: CreateSupportTicketDto): SupportTicket {
    const user = this.db.findUserById(userId);
    if (!user) throw new NotFoundException('Authenticated user was not found');

    if (!canSubmitSupportCategory(role, dto.requestType)) {
      throw new ForbiddenException('Your role cannot submit a request in this category');
    }
    if (!SUPPORT_CONCERNS[dto.requestType].includes(dto.concern)) {
      throw new BadRequestException('The selected concern does not belong to this request type');
    }
    const description = dto.description.trim();
    if (!description) {
      throw new BadRequestException('Description is required');
    }

    const attachmentIds = dto.attachmentIds || [];
    const attachments = attachmentIds.map(attachmentId => {
      const alreadySubmitted = this.db.supportTickets.some(ticket =>
        ticket.attachments.some(item => item.attachmentId === attachmentId),
      );
      const attachment = this.db.supportAttachments.find(
        item => item.attachmentId === attachmentId && item.userId === userId,
      );
      if (!attachment || alreadySubmitted) {
        throw new BadRequestException('One or more attachments are invalid or unavailable');
      }
      return attachment;
    });

    const year = new Date().getFullYear();
    const ticketNumber = this.db.supportTickets.reduce((maximum, ticket) => {
      const match = ticket.ticketId.match(new RegExp(`^SUP-${year}-(\\d+)$`));
      return match ? Math.max(maximum, Number(match[1])) : maximum;
    }, 0) + 1;
    const now = new Date();
    const ticket: SupportTicket = {
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

  addRequesterFollowUp(
    ticketId: string,
    userId: string,
    dto: CreateSupportFollowUpDto,
  ): SupportTicket {
    const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId && item.userId === userId);
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const message = dto.message.trim();
    if (!message) throw new BadRequestException('Follow-up message is required');
    ticket.messages ||= [];
    ticket.messages.push({ sender: 'requester', message, createdAt: new Date() });
    ticket.status = 'open';
    ticket.updatedAt = new Date();
    this.db.persist();
    return ticket;
  }

  registerAttachment(userId: string, file: Express.Multer.File): Omit<SupportAttachment, 'userId' | 'filePath' | 'createdAt'> {
    if (!file) throw new BadRequestException('File is required');

    const attachment: SupportAttachment = {
      attachmentId: this.db.generateId('support-file'),
      userId,
      originalName: basename(file.originalname),
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

  async getAttachment(
    attachmentId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ stream: ReturnType<typeof createReadStream>; mimeType: string; fileName: string }> {
    const canViewAll = this.isSupportAgent(userId, role);
    const ticket = this.db.supportTickets.find(item =>
      (canViewAll || item.userId === userId)
      && item.attachments.some(attachment => attachment.attachmentId === attachmentId),
    );
    if (!ticket) throw new NotFoundException('Attachment not found');

    const attachment = this.db.supportAttachments.find(item => item.attachmentId === attachmentId);
    const submittedAttachment = ticket.attachments.find(item => item.attachmentId === attachmentId);
    const fileName = attachment?.filePath || '';
    if (!submittedAttachment || !fileName || !existsSync(fileName)) {
      throw new NotFoundException('Attachment file is unavailable');
    }

    await access(fileName, constants.R_OK);
    return {
      stream: createReadStream(fileName),
      mimeType: submittedAttachment.mimeType,
      fileName: submittedAttachment.originalName,
    };
  }

  async updateStatus(
    ticketId: string,
    userId: string,
    role: UserRole,
    dto: UpdateSupportTicketStatusDto,
  ): Promise<SupportTicket & { emailNotificationSent: boolean }> {
    if (!this.isSupportAgent(userId, role)) {
      throw new ForbiddenException('Only the Support Executive or an administrator can update support tickets');
    }
    const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId);
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const response = dto.response?.trim();
    let emailNotificationSent = false;
    if (dto.response !== undefined && response) ticket.response = response;
    const lastMessage = ticket.messages?.[ticket.messages.length - 1];
    if (dto.response !== undefined && response && lastMessage?.sender !== 'support') {
      ticket.messages ||= [];
      ticket.messages.push({ sender: 'support', message: response, createdAt: new Date() });
    } else if (dto.response !== undefined && response && lastMessage?.message !== response) {
      ticket.messages ||= [];
      ticket.messages.push({ sender: 'support', message: response, createdAt: new Date() });
    }

    if (dto.status === 'resolved' && ticket.status !== 'resolved') {
      const requester = this.db.findUserById(ticket.userId);
      if (!ticket.response) throw new BadRequestException('Add a reply before resolving this ticket');
      ticket.status = dto.status;
      ticket.updatedAt = new Date();
      try {
        emailNotificationSent = requester?.email
          ? await this.mailService.sendResolvedEmail(ticket, requester)
          : false;
      } catch (_error) {
        emailNotificationSent = false;
      }
      if (emailNotificationSent) ticket.resolutionEmailSentAt = new Date();
    }

    ticket.status = dto.status;
    ticket.updatedAt = new Date();
    this.db.persist();
    return { ...ticket, emailNotificationSent };
  }
}
