import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRole } from '../../common/constants';
import { CreateOperationalReportDto } from './dto/support-report.dto';
import { SupportReportsService } from './support-reports.service';

@ApiTags('reports')
@Controller('api/reports/operational')
@UseGuards(RoleGuard)
export class OperationalReportsController {
  constructor(private readonly reports: SupportReportsService) {}

  @Get()
  list(@UserId() userId: string, @UserRoleDecorator() role: UserRole) {
    return this.reports.list(userId, role, true);
  }

  @Post()
  create(@Body() dto: CreateOperationalReportDto, @UserId() userId: string, @UserRoleDecorator() role: UserRole) {
    return this.reports.create(dto, undefined, userId, role, true);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole) {
    return this.reports.submit(id, userId, role, true);
  }
}
