import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { EventRequestsService } from './event-requests.service';
import { CreateEventRequestDto, UpdateEventRequestStatusDto } from './dto/event-request.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('event-requests')
@Controller('api/event-requests')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role (client, event_organizer, super_admin)', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership checks', required: false })
export class EventRequestsController {
  constructor(private readonly service: EventRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create event request (CLIENT only)' })
  @ApiResponse({ status: 201, description: 'Event request created' })
  @ApiResponse({ status: 403, description: 'Only CLIENT can create event requests' })
  create(@Body() dto: CreateEventRequestDto, @UserRoleDecorator() role: UserRole) {
    return this.service.create(dto, role);
  }

  @Get()
  @ApiOperation({ summary: 'List event requests (role-filtered)' })
  @ApiResponse({ status: 200, description: 'List of event requests filtered by role' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event request by ID' })
  @ApiResponse({ status: 200, description: 'Event request details' })
  @ApiResponse({ status: 404, description: 'Event request not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findOne(id, role, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event request status (ORGANIZER approves/rejects, CLIENT cancels)' })
  @ApiResponse({ status: 200, description: 'Status updated. Notifies client.' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event request not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventRequestStatusDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.service.updateStatus(id, dto, role, userId);
  }
}
