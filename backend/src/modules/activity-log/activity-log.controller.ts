import {
  Controller,
  Get,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';

@Controller('api/activity-logs')
@UseGuards(RoleGuard)
@ApiHeader({
  name: 'x-role',
  description: 'User role',
  required: true,
})
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activity logs' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit results (default: 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity logs',
  })
  findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.activityLogService.findAll(
      limit ? parseInt(limit as any) : 100,
      offset ? parseInt(offset as any) : 0,
    );
  }

  @Get('by-role/:role')
  @ApiOperation({ summary: 'Get activity logs by role' })
  @ApiResponse({
    status: 200,
    description: 'Activity logs filtered by role',
  })
  findByRole(@Param('role') role: string) {
    return this.activityLogService.findByRole(role);
  }

  @Get('by-action/:action')
  @ApiOperation({ summary: 'Get activity logs by action' })
  @ApiResponse({
    status: 200,
    description: 'Activity logs filtered by action',
  })
  findByAction(@Param('action') action: string) {
    return this.activityLogService.findByAction(action);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get activity log statistics' })
  @ApiResponse({
    status: 200,
    description: 'Activity statistics',
  })
  getStatistics() {
    return this.activityLogService.getStatistics();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all activity logs' })
  @ApiResponse({
    status: 200,
    description: 'All logs cleared',
  })
  clearLogs() {
    return this.activityLogService.clearLogs();
  }
}
