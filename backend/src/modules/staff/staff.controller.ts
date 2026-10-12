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
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto } from './dtos/staff.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('staff')
@Controller('api/staff')
@UseGuards(RoleGuard)
@ApiHeader({
  name: 'x-role',
  description: 'User role (super_admin, client, event_organizer, event_staff, attendee)',
  required: true,
})
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new staff member (superuser only)' })
  @ApiResponse({
    status: 201,
    description: 'Staff created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient permissions',
  })
  create(
    @Body() createStaffDto: CreateStaffDto,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.staffService.create(createStaffDto, role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all staff' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by staff name, email, or role',
  })
  @ApiResponse({
    status: 200,
    description: 'List of staff',
  })
  @ApiResponse({
    status: 400,
    description: 'Attendees cannot view staff list',
  })
  findAll(
    @UserRoleDecorator() role: UserRole,
    @Query('search') search?: string,
  ) {
    return this.staffService.findAll(role, search);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get staff statistics' })
  @ApiResponse({
    status: 200,
    description: 'Staff statistics',
  })
  getStatistics(@UserRoleDecorator() role: UserRole) {
    // Only super admin may view aggregated staff statistics
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can view staff statistics');
    }
    return this.staffService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff details',
  })
  @ApiResponse({
    status: 400,
    description: 'Attendees cannot view staff details',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  findOne(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.staffService.findOne(id, role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update staff (superuser only)' })
  @ApiResponse({
    status: 200,
    description: 'Staff updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.staffService.update(id, updateStaffDto, role, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete staff (superuser only)' })
  @ApiResponse({
    status: 200,
    description: 'Staff deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  delete(
    @Param('id') id: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.staffService.delete(id, role);
  }

  @Post(':id/events/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign event to staff (superuser only)' })
  @ApiResponse({
    status: 200,
    description: 'Event assigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient permissions',
  })
  assignEvent(
    @Param('id') staffId: string,
    @Param('eventId') eventId: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.staffService.assignEvent(staffId, eventId, role);
  }
}
