import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '../../common/constants';
import { CreateSupportTicketDto, UpdateSupportTicketStatusDto } from './dto/support-ticket.dto';
import { SupportService } from './support.service';
export declare class SupportController {
    private readonly service;
    constructor(service: SupportService);
    listTickets(userId: string, role: UserRole): (import("../../common/data-store").SupportTicket & {
        requesterName?: string;
        requesterEmail?: string;
    })[];
    createTicket(userId: string, role: UserRole, dto: CreateSupportTicketDto): import("../../common/data-store").SupportTicket;
    uploadAttachment(userId: string, file?: Express.Multer.File): Omit<import("../../common/data-store").SupportAttachment, "userId" | "filePath" | "createdAt">;
    downloadAttachment(attachmentId: string, userId: string, role: UserRole, response: Response): Promise<StreamableFile>;
    updateStatus(ticketId: string, role: UserRole, dto: UpdateSupportTicketStatusDto): Promise<import("../../common/data-store").SupportTicket>;
}
//# sourceMappingURL=support.controller.d.ts.map