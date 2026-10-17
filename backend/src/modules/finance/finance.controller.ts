import { Body, Controller, Get, Header, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { FinanceService } from './finance.service';
@ApiTags('finance')
@Controller('api/finance')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'Authorization', description: 'Bearer access token', required: true })
export class FinanceController {
  constructor(private readonly service: FinanceService) {}
  @Get('dashboard') dashboard(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.dashboard(userId, role, query); }
  @Get('transactions') transactions(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.transactions(userId, role, query); }
  @Get('transactions.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="eventflow-payment-transactions.csv"')
  exportTransactions(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.exportTransactions(userId, role, query); }
  @Get('transactions/:id')
  transaction(@Param('id') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.transaction(userId, role, id); }
  @Get('refunds') refunds(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.refunds(userId, role, query); }
  @Get('refunds/:id') refund(@Param('id') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.refund(userId, role, id); }
  @Post('refunds/:id/reviews') reviewRefund(@Param('id') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole, @Body() body: Record<string, unknown>) { return this.service.reviewRefund(userId, role, id, body); }
  @Get('overview') overview(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.overview(userId, role, query); }
  @Get('reconciliation') reconciliation(@UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.reconciliation(userId, role); }
  @Get('reports') reports(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.report(userId, role, query); }
  @Get('submissions') submissions(@UserId() userId: string, @UserRoleDecorator() role: UserRole) { return this.service.submissions(userId, role); }
  @Post('submissions') submitReport(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Body() body: Record<string, unknown>) { return this.service.submitReport(userId, role, body); }
  @Patch('submissions/:id/review') reviewReport(@Param('id') id: string, @UserId() userId: string, @UserRoleDecorator() role: UserRole, @Body() body: Record<string, unknown>) { return this.service.reviewReport(id, userId, role, body); }
  @Get('reports.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="eventflow-finance-report.csv"')
  reportCsv(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>) { return this.service.reportCsv(userId, role, query); }
  @Get('reports.pdf')
  reportPdf(@UserId() userId: string, @UserRoleDecorator() role: UserRole, @Query() query: Record<string, unknown>, @Res() response: Response) {
    const pdf = this.service.reportPdf(userId, role, query);
    response.type('application/pdf').setHeader('Content-Disposition', 'attachment; filename="eventflow-finance-report.pdf"');
    response.send(pdf);
  }
}
