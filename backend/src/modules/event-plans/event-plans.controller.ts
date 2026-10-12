import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { EventPlansService } from './event-plans.service';
import { CreateEventPlanDto, UpdateEventPlanApprovalDto } from './dto/event-plan.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('event-plans')
@Controller('api/event-plans')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership checks', required: false })
export class EventPlansController {
  constructor(private readonly service: EventPlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create event plan (EVENT_ORGANIZER)' })
  @ApiResponse({ status: 201, description: 'Event plan created. Notifies client.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateEventPlanDto, @UserRoleDecorator() role: UserRole) {
    return this.service.create(dto, role);
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
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
