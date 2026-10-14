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
import { CreateSupportTicketDto, UpdateSupportTicketStatusDto } from './dto/support-ticket.dto';
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

  listTickets(userId: string, role: UserRole): SupportTicketListItem[] {
    const tickets = this.db.supportTickets
      .filter(ticket => role === UserRole.SUPER_ADMIN || ticket.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return tickets.map(ticket => ({
      ...ticket,
      ...(role === UserRole.SUPER_ADMIN
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
    const ticket = this.db.supportTickets.find(item =>
      (role === UserRole.SUPER_ADMIN || item.userId === userId)
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
    role: UserRole,
    dto: UpdateSupportTicketStatusDto,
  ): Promise<SupportTicket> {
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only administrators can update support ticket status');
    }
    const ticket = this.db.supportTickets.find(item => item.ticketId === ticketId);
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (dto.status === 'resolved' && ticket.status !== 'resolved') {
      const requester = this.db.findUserById(ticket.userId);
      if (!requester?.email) throw new BadRequestException('Requester email address is unavailable');
      await this.mailService.sendResolvedEmail(ticket, requester);
      ticket.resolutionEmailSentAt = new Date();
    }

    ticket.status = dto.status;
    ticket.updatedAt = new Date();
    return ticket;
  }
}
