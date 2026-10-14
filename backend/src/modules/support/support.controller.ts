import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  StreamableFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';
import { CreateSupportTicketDto, UpdateSupportTicketStatusDto } from './dto/support-ticket.dto';
import { SupportService } from './support.service';

const SUPPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'support');
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

function ensureUploadDir(): void {
  if (!fs.existsSync(SUPPORT_UPLOAD_DIR)) {
    fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });
  }
}

function supportFileName(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `${randomUUID()}${extension}`;
}

@ApiTags('customer-support')
@ApiBearerAuth('bearer')
@Controller('api/support')
@UseGuards(RoleGuard)
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'List the authenticated user’s support tickets; administrators can view all tickets' })
  listTickets(@UserId() userId: string, @UserRoleDecorator() role: UserRole) {
    return this.service.listTickets(userId, role);
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket using a role-authorized request type and concern' })
  @ApiResponse({ status: 201, description: 'Support ticket created' })
  @ApiResponse({ status: 403, description: 'Request type is not available to this role' })
  createTicket(
    @UserId() userId: string,
    @UserRoleDecorator() role: UserRole,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.service.createTicket(userId, role, dto);
  }

  @Post('attachments')
  @ApiOperation({ summary: 'Upload a support attachment (JPG, PNG, WEBP, PDF, or TXT; up to 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureUploadDir();
          callback(null, SUPPORT_UPLOAD_DIR);
        },
        filename: (_request, file, callback) => callback(null, supportFileName(file.originalname)),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, TXT.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadAttachment(
    @UserId() userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.service.registerAttachment(userId, file);
  }

  @Get('attachments/:attachmentId')
  @ApiOperation({ summary: 'Download a support attachment owned by the requester or viewable by an administrator' })
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @UserId() userId: string,
    @UserRoleDecorator() role: UserRole,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.service.getAttachment(attachmentId, userId, role);
    const downloadName = result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    response.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
    });
    return new StreamableFile(result.stream);
  }

  @Patch('tickets/:ticketId/status')
  @ApiOperation({ summary: 'Update a support ticket status; resolving it emails the requester' })
  updateStatus(
    @Param('ticketId') ticketId: string,
    @UserRoleDecorator() role: UserRole,
    @Body() dto: UpdateSupportTicketStatusDto,
  ) {
    return this.service.updateStatus(ticketId, role, dto);
  }
}
