import { BadRequestException, Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, StreamableFile, Res, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateEventCompletionReportDto, CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

const EVENT_REPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-reports');

function ensureEventReportUploadDir(): void {
  if (!fs.existsSync(EVENT_REPORT_UPLOAD_DIR)) {
    fs.mkdirSync(EVENT_REPORT_UPLOAD_DIR, { recursive: true });
  }
}

@ApiTags('reports')
@Controller('api/reports')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership', required: false })
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create event report (EVENT_ORGANIZER sends final report to client)' })
  @ApiResponse({ status: 201, description: 'Event report created. Notifies client.' })
  @ApiResponse({ status: 403, description: 'Only EVENT_ORGANIZER can create event reports' })
  createEventReport(@Body() dto: CreateEventReportDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.createEventReport(dto, role, userId);
  }

  @Post('events/:eventId/file')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload an event report for the requesting client (assigned organizer only)' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_request, _file, callback) => { ensureEventReportUploadDir(); callback(null, EVENT_REPORT_UPLOAD_DIR); },
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const mimeTypes: Record<string, string> = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      if (mimeTypes[path.extname(file.originalname).toLowerCase()] !== file.mimetype) {
        callback(new BadRequestException('Report files must be PDF, DOCX, or XLSX'), false); return;
      }
      callback(null, true);
    },
  }))
  uploadEventReport(@Param('eventId') eventId: string, @UploadedFile() file: Express.Multer.File | undefined,
    @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    if (!file) throw new BadRequestException('Select a report file to submit');
    return this.service.uploadEventReport(eventId, file, role, userId);
  }

  @Get('events/:reportId/file')
  @ApiOperation({ summary: 'Download an event report file with ownership authorization' })
  async getEventReportFile(@Param('reportId') reportId: string, @UserRoleDecorator() role: UserRole,
    @UserId() userId: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    const file = await this.service.getEventReportFile(reportId, role, userId);
    response.set({ 'Content-Type': file.mimeType, 'Content-Disposition': `attachment; filename="${file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"` });
    return new StreamableFile(file.stream);
  }

  @Get('events')
  @ApiOperation({ summary: 'List event reports (role-filtered)' })
  findAllEventReports(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAllEventReports(role, userId);
  }

  @Post('events/:eventId/completion')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a completed-event report with optional photos (assigned organizer only)' })
  @UseInterceptors(
    FilesInterceptor('photos', 5, {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureEventReportUploadDir();
          callback(null, EVENT_REPORT_UPLOAD_DIR);
        },
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
        const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
        if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
          callback(new BadRequestException('Report photos must be JPG, PNG, or WEBP images'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  createCompletionReport(
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventCompletionReportDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.createCompletionReport(eventId, dto, files || [], role, userId);
  }

  @Get('events/completion')
  @ApiOperation({ summary: 'List completion reports visible to the client, assigned organizer, or admin' })
  findAllCompletionReports(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAllCompletionReports(role, userId);
  }

  @Get('events/:eventId/completion/photos/:fileName')
  @ApiOperation({ summary: 'View a completion-report photo with event ownership authorization' })
  async getCompletionReportPhoto(
    @Param('eventId') eventId: string,
    @Param('fileName') fileName: string,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const photo = await this.service.getCompletionReportPhoto(eventId, fileName, role, userId);
    response.set({
      'Content-Type': photo.mimeType,
      'Content-Disposition': `inline; filename="${photo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
    });
    return new StreamableFile(photo.stream);
  }

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create staff report (EVENT_STAFF only, must be assigned to event)' })
  @ApiResponse({ status: 201, description: 'Staff report created. Organizer notified.' })
  @ApiResponse({ status: 403, description: 'Staff can only report for assigned events' })
  createStaffReport(@Body() dto: CreateStaffReportDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.createStaffReport(dto, role, userId);
  }

  @Get('staff')
  @ApiOperation({ summary: 'List staff reports (role-filtered)' })
  findAllStaffReports(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAllStaffReports(role, userId);
  }
}
