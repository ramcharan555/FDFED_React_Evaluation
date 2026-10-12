import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { StaffAssignmentsService } from './staff-assignments.service';
import { CreateStaffAssignmentDto, UpdateAssignmentStatusDto } from './dto/staff-assignment.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('staff-assignments')
@Controller('api/staff-assignments')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership', required: false })
export class StaffAssignmentsController {
  constructor(private readonly service: StaffAssignmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign staff to event (EVENT_ORGANIZER only)' })
  @ApiResponse({ status: 201, description: 'Assignment created. Staff notified.' })
  @ApiResponse({ status: 403, description: 'Only EVENT_ORGANIZER can assign staff' })
  @ApiResponse({ status: 409, description: 'Staff already assigned to this event' })
  create(@Body() dto: CreateStaffAssignmentDto, @UserRoleDecorator() role: UserRole) {
    return this.service.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'List assignments (role-filtered: staff sees own, organizer sees own, admin sees all)' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Accept/decline assignment (EVENT_STAFF). Cancel (ORGANIZER).' })
  @ApiResponse({ status: 200, description: 'Assignment status updated. Organizer notified.' })
  @ApiResponse({ status: 403, description: 'Staff can only update own assignments' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updateStatus(id, dto, role, userId);
  }
}
