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
  requesterRole?: string;
};

@Injectable()
export class SupportService {
  private readonly db = DataStore.getInstance();

  constructor(private readonly mailService: SupportMailService) {}

  private isSupportAgent(userId: string, role: UserRole): boolean {
    const user = this.db.findUserById(userId);
    return role === UserRole.SUPER_ADMIN
      || (role === UserRole.EVENT_STAFF && ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS']
        .includes(String(user?.employeeType || '').trim().toUpperCase().replace(/[\s-]+/g, '_')));
  }

  private notifySupportAgents(ticket: SupportTicket, message: string): void {
    this.db.users.filter(user => user.userRole === UserRole.EVENT_STAFF && user.status === 'active' &&
      this.isSupportAgent(user.userId, user.userRole) && user.userId !== ticket.userId).forEach(user => {
      this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: user.userId,
        supportTicketId: ticket.ticketId, message, type: 'support_ticket_received', read: false,
        dateTime: new Date(), createdAt: new Date() });
    });
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
            requesterRole: this.db.findUserById(ticket.userId)?.userRole,
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
    this.notifySupportAgents(ticket, `New Customer Support request ${ticket.ticketId}: ${ticket.concern}`);
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
    ticket.messages.push({ sender: 'requester', message, createdAt: new Date(), senderId: userId });
    ticket.status = 'open';
    ticket.updatedAt = new Date();
    this.notifySupportAgents(ticket, `A user replied to support request ${ticket.ticketId}: ${ticket.concern}`);
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

    if (!['open', 'in_progress', 'resolved'].includes(dto.status)) throw new BadRequestException('Select a valid ticket status');
    const response = typeof dto.response === 'string' ? dto.response.trim() : '';
    if (response.length > 2000) throw new BadRequestException('A support reply cannot exceed 2000 characters');
    if (dto.status === 'resolved' && !response) throw new BadRequestException('Add a reply explaining the resolution before resolving this ticket');

    const previousStatus = ticket.status;
    const lastMessage = ticket.messages?.[ticket.messages.length - 1];
    const newReply = Boolean(response && (lastMessage?.sender !== 'support' || lastMessage.message !== response || previousStatus !== dto.status));
    const statusChanged = previousStatus !== dto.status;
    let emailNotificationSent = false;
    if (!newReply && !statusChanged) return { ...ticket, emailNotificationSent };

    const now = new Date();
    if (newReply) {
      const agent = this.db.findUserById(userId);
      ticket.response = response;
      ticket.messages ||= [];
      ticket.messages.push({ sender: 'support', message: response, createdAt: now, senderId: userId, senderName: agent?.name || 'Support' });
    }
    ticket.status = dto.status;
    ticket.updatedAt = now;
    const label = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved' }[dto.status];
    this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: ticket.userId,
      supportTicketId: ticket.ticketId, message: `Support request ${ticket.ticketId} - ${label}.${newReply ? ' ' + response : ''}`,
      type: 'support_ticket_updated', read: false, dateTime: now, createdAt: now });
    this.db.persist();

    if (dto.status === 'resolved' && previousStatus !== 'resolved') {
      const requester = this.db.findUserById(ticket.userId);
      try {
        emailNotificationSent = requester?.email ? await this.mailService.sendResolvedEmail(ticket, requester) : false;
      } catch (_error) { emailNotificationSent = false; }
      if (emailNotificationSent) {
        ticket.resolutionEmailSentAt = new Date();
        this.db.persist();
      }
    }
    return { ...ticket, emailNotificationSent };
  }
}
