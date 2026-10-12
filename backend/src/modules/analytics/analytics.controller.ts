import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for role-specific dashboard', required: false })
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Super admin dashboard — total users, events, revenue, registrations, pending requests, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics summary for SUPER_ADMIN',
    schema: {
      example: {
        success: true,
        data: {
          users: { total: 12, active: 12, byRole: { super_admin: 1, client: 2, event_organizer: 3, event_staff: 3, attendee: 3 } },
          events: { total: 4, published: 3, draft: 1 },
          eventRequests: { total: 2, pending: 1, approved: 1 },
          registrations: { total: 3 },
          payments: { total: 2, totalRevenue: 298 },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Only SUPER_ADMIN can view analytics' })
  getDashboard(@UserRoleDecorator() role: UserRole) {
    return this.service.getDashboard(role);
  }

  @Get('organizer-dashboard')
  @ApiOperation({ summary: 'Event organizer dashboard: my events, registrations, staff assignments, revenue' })
  @ApiResponse({ status: 200, description: 'Organizer dashboard data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getOrganizerDashboard(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.getOrganizerDashboard(role, userId);
  }

  @Get('client-dashboard')
  @ApiOperation({ summary: 'Client dashboard: my event requests, event plans, ongoing/completed events' })
  @ApiResponse({ status: 200, description: 'Client dashboard data' })
  @ApiResponse({ status: 403, description: 'Only CLIENT can view' })
  getClientDashboard(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.getClientDashboard(role, userId);
  }

  @Get('staff-dashboard')
  @ApiOperation({ summary: 'Event staff dashboard: my assignments, reports submitted, available dates' })
  @ApiResponse({ status: 200, description: 'Staff dashboard data' })
  @ApiResponse({ status: 403, description: 'Only EVENT_STAFF can view' })
  getStaffDashboard(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.getStaffDashboard(role, userId);
  }

  @Get('attendee-dashboard')
  @ApiOperation({ summary: 'Attendee dashboard: registered events, attendance status, tickets' })
  @ApiResponse({ status: 200, description: 'Attendee dashboard data' })
  @ApiResponse({ status: 403, description: 'Only ATTENDEE can view' })
  getAttendeeDashboard(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.getAttendeeDashboard(role, userId);
  }
}
