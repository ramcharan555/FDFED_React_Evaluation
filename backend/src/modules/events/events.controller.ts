import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CancelClientEventDto, CreateEventDto, UpdateEventDto } from './dtos/event.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('events')
@Controller('api/events')
@UseGuards(RoleGuard)
@ApiHeader({
  name: 'x-role',
  description: 'User role (super_admin, client, event_organizer, event_staff, attendee)',
  required: true,
})
@ApiHeader({
  name: 'x-user-id',
  description: 'User ID for ownership checks',
  required: false,
})
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields or insufficient permissions' })
  create(
    @Body() createEventDto: CreateEventDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.eventsService.create(createEventDto, role, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by event name, description, or location' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'List of events' })
  findAll(
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.eventsService.findAll(role, search, status, userId);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get ALL events for admin dashboard (no status filter)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'All events for admin view' })
  findAllAdmin(
    @UserRoleDecorator() role: UserRole,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.eventsService.findAllAdmin(role, search, status);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics' })
  getStatistics() {
    return this.eventsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.eventsService.findOne(id, role, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a fully paid client event completed after its event date (assigned organizer only)' })
  completeClientEvent(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.eventsService.completeClientEvent(id, role, userId);
  }

  @Get(':id/cancellation-preview')
  @ApiOperation({ summary: 'Preview the client cancellation deadline, fee, and refund due' })
  cancellationPreview(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return { success: true, data: this.eventsService.clientCancellationPreview(id, role, userId) };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Client cancels their ongoing event at least 14 days before its start, with a 10% fee on the amount paid' })
  cancelClientEvent(@Param('id') id: string, @Body() dto: CancelClientEventDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.eventsService.cancelClientEvent(id, dto, role, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.eventsService.update(id, updateEventDto, role, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete event (organizer or superuser)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  delete(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.eventsService.delete(id, role, userId);
  }
}
