import { createReadStream } from 'fs';
import { UserRole } from '../../common/constants';
import { SupportAttachment, SupportTicket } from '../../common/data-store';
import { CreateSupportFollowUpDto, CreateSupportTicketDto, UpdateSupportTicketStatusDto } from './dto/support-ticket.dto';
import { SupportMailService } from './support-mail.service';
type SupportTicketListItem = SupportTicket & {
    requesterName?: string;
    requesterEmail?: string;
};
export declare class SupportService {
    private readonly mailService;
    private readonly db;
    constructor(mailService: SupportMailService);
    private isSupportAgent;
    listTickets(userId: string, role: UserRole): SupportTicketListItem[];
    createTicket(userId: string, role: UserRole, dto: CreateSupportTicketDto): SupportTicket;
    addRequesterFollowUp(ticketId: string, userId: string, dto: CreateSupportFollowUpDto): SupportTicket;
    registerAttachment(userId: string, file: Express.Multer.File): Omit<SupportAttachment, 'userId' | 'filePath' | 'createdAt'>;
    getAttachment(attachmentId: string, userId: string, role: UserRole): Promise<{
        stream: ReturnType<typeof createReadStream>;
        mimeType: string;
        fileName: string;
    }>;
    updateStatus(ticketId: string, userId: string, role: UserRole, dto: UpdateSupportTicketStatusDto): Promise<SupportTicket & {
        emailNotificationSent: boolean;
    }>;
}
export {};
//# sourceMappingURL=support.service.d.ts.map