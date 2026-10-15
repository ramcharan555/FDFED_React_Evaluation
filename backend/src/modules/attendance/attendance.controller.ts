import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { VerifyAttendanceDto } from './dto/attendance.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';
import { UserId } from '../../common/decorators/user-id.decorator';

@ApiTags('attendance')
@Controller('api/attendance')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify attendee check-in using QR code or verification ID (EVENT_STAFF only)' })
  @ApiResponse({ status: 200, description: 'Attendee checked in successfully' })
  @ApiResponse({ status: 403, description: 'Only EVENT_STAFF can verify attendance' })
  @ApiResponse({ status: 404, description: 'No registration found for provided QR/verification ID' })
  @ApiResponse({ status: 409, description: 'Attendee already checked in' })
  verify(@Body() dto: VerifyAttendanceDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.verify(dto, role, userId);
  }

  @Post('reconcile/:eventId')
  @ApiOperation({ summary: 'Mark confirmed non-attendees as no-shows after an event concludes' })
  reconcile(@Param('eventId') eventId: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.reconcileNoShows(eventId, role, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List attendance records' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  findAll(
    @UserRoleDecorator() role: UserRole,
    @Query('eventId') eventId?: string,
    @UserId() userId?: string,
  ) {
    return this.service.findAll(role, eventId, userId);
  }
}
