import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { EventPlansService } from './event-plans.service';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

const EVENT_PLAN_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-plans');

function ensureEventPlanUploadDir(): void {
  if (!fs.existsSync(EVENT_PLAN_UPLOAD_DIR)) {
    fs.mkdirSync(EVENT_PLAN_UPLOAD_DIR, { recursive: true });
  }
}

@ApiTags('event-plans')
@ApiBearerAuth('bearer')
@Controller('api/event-plans')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership checks', required: false })
export class EventPlansController {
  constructor(private readonly service: EventPlansService) {}

  @Post(':requestId/document')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a PDF for an accepted event request' })
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
          ensureEventPlanUploadDir();
          callback(null, EVENT_PLAN_UPLOAD_DIR);
        },
        filename: (_request, _file, callback) => callback(null, `${randomUUID()}.pdf`),
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (file.mimetype !== 'application/pdf' || path.extname(file.originalname).toLowerCase() !== '.pdf') {
          callback(new BadRequestException('Event plans must be uploaded as PDF files'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadDocument(
    @Param('requestId') requestId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    if (!file) throw new BadRequestException('A PDF event plan file is required');
    return this.service.uploadDocument(requestId, file, role, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create event plan (EVENT_ORGANIZER)' })
  @ApiResponse({ status: 201, description: 'Event plan created. Notifies client.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateEventPlanDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.create(dto, role, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List event plans (role-filtered)' })
  @ApiResponse({ status: 200, description: 'Event plans filtered by role' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event plan by ID' })
  @ApiResponse({ status: 200, description: 'Event plan details' })
  @ApiResponse({ status: 404, description: 'Event plan not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findOne(id, role, userId);
  }

  @Get(':id/document')
  @ApiOperation({ summary: 'Download an event plan PDF (authorized client or organizer)' })
  async downloadDocument(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.service.getDocument(id, role, userId);
    const fileName = result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    return new StreamableFile(result.stream);
  }

  @Patch(':id/approval')
  @ApiOperation({ summary: 'Approve/reject event plan (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'Approval status updated. Notifies organizer.' })
  @ApiResponse({ status: 403, description: 'Only CLIENT can approve/reject' })
  @ApiResponse({ status: 404, description: 'Event plan not found' })
  updateApproval(
    @Param('id') id: string,
    @Body() dto: UpdateEventPlanApprovalDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updateApproval(id, dto, role, userId);
  }
}
