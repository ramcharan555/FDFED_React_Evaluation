import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID (required for all notification endpoints)', required: true })
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the current user (requires x-user-id header)' })
  @ApiResponse({ status: 200, description: 'List of notifications for this user' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  getUnreadCount(@UserId() userId: string) {
    return this.service.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markRead(@Param('id') id: string, @UserId() userId: string) {
    return this.service.markRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllRead(@UserId() userId: string) {
    return this.service.markAllRead(userId);
  }
}
