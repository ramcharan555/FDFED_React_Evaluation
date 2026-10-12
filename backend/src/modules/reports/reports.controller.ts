import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateEventReportDto, CreateStaffReportDto } from './dto/report.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

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
  createEventReport(@Body() dto: CreateEventReportDto, @UserRoleDecorator() role: UserRole) {
    return this.service.createEventReport(dto, role);
  }

  @Get('events')
  @ApiOperation({ summary: 'List event reports (role-filtered)' })
  findAllEventReports(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAllEventReports(role, userId);
  }

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create staff report (EVENT_STAFF only, must be assigned to event)' })
  @ApiResponse({ status: 201, description: 'Staff report created. Organizer notified.' })
  @ApiResponse({ status: 403, description: 'Staff can only report for assigned events' })
  createStaffReport(@Body() dto: CreateStaffReportDto, @UserRoleDecorator() role: UserRole) {
    return this.service.createStaffReport(dto, role);
  }

  @Get('staff')
  @ApiOperation({ summary: 'List staff reports (role-filtered)' })
  findAllStaffReports(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAllStaffReports(role, userId);
  }
}
