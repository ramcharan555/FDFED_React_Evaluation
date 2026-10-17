import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import * as path from 'path';
import { Response } from 'express';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';
import { CreateSupportReportDto, ReviewSupportReportDto } from './dto/support-report.dto';
import { SupportReportsService } from './support-reports.service';

@ApiTags('support-reports')
@ApiBearerAuth('bearer')
@Controller('api/reports/support')
@UseGuards(RoleGuard)
export class SupportReportsController {
  constructor(private readonly service: SupportReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin report inbox; support executives see their own drafts and submissions' })
  list(@UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.list(userId, role); }

  @Post()
  @ApiOperation({ summary: 'Save or submit a support report with an optional document' })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const types: Record<string, string> = { '.pdf': 'application/pdf', '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      if (types[path.extname(file.originalname).toLowerCase()] !== file.mimetype) {
        callback(new BadRequestException('Attach a PDF, Word, or Excel document'), false); return;
      }
      callback(null, true);
    },
  }))
  create(@Body() dto: CreateSupportReportDto, @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.create(dto, file, userId, role); }

  @Get(':reportId')
  get(@Param('reportId') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.get(id, userId, role); }

  @Post(':reportId/submit')
  @HttpCode(200)
  submit(@Param('reportId') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.submit(id, userId, role); }

  @Patch(':reportId/review')
  review(@Param('reportId') id: string, @Body() dto: ReviewSupportReportDto, @UserId() userId: string,
    @UserRoleDecorator() role: UserRole) { return this.service.review(id, dto, userId, role); }

  @Get(':reportId/file')
  download(@Param('reportId') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole,
    @Res({ passthrough: true }) response: Response) {
    const file = this.service.download(id, userId, role);
    response.set({ 'Content-Type': file.mimeType, 'Content-Disposition': `attachment; filename="${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}"` });
    return new StreamableFile(file.stream);
  }
}
