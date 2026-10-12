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
import { AttendeesService } from './attendees.service';
import { CreateAttendeeDto, UpdateAttendeeDto } from './dtos/attendee.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('attendees')
@Controller('api/attendees')
@UseGuards(RoleGuard)
@ApiHeader({
  name: 'x-role',
  description: 'User role (super_admin, client, event_organizer, event_staff, attendee)',
  required: true,
})
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new attendee' })
  @ApiResponse({ status: 201, description: 'Attendee created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields or email already exists' })
  create(
    @Body() createAttendeeDto: CreateAttendeeDto,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.attendeesService.create(createAttendeeDto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendees' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by attendee name or email' })
  @ApiResponse({ status: 200, description: 'List of attendees' })
  findAll(
    @UserRoleDecorator() role: UserRole,
    @Query('search') search?: string,
  ) {
    return this.attendeesService.findAll(role, search);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get attendee statistics' })
  @ApiResponse({ status: 200, description: 'Attendee statistics' })
  getStatistics() {
    return this.attendeesService.getStatistics();
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get attendees for a specific event' })
  @ApiResponse({ status: 200, description: 'List of attendees for the event' })
  findByEvent(
    @Param('eventId') eventId: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.attendeesService.findByEvent(eventId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendee by ID' })
  @ApiResponse({ status: 200, description: 'Attendee details' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  findOne(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.attendeesService.findOne(id, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attendee' })
  @ApiResponse({ status: 200, description: 'Attendee updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  update(
    @Param('id') id: string,
    @Body() updateAttendeeDto: UpdateAttendeeDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.attendeesService.update(id, updateAttendeeDto, role, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attendee (superuser only)' })
  @ApiResponse({ status: 200, description: 'Attendee deleted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  delete(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.attendeesService.delete(id, role);
  }
}
