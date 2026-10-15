import { Controller, Get, Post, Param, Query, Body, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { RoleGuard } from '../../common/guards/role.guard';
import { FinanceService } from './finance.service';
import { csv, pdf } from './finance.exports';
import { DataStore } from '../../common/data-store';

@Controller('api/finance')
@UseGuards(RoleGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}
  private auth(req: any) { this.service.actor(req.user.userId); return req.user.userId; }
  // Synchronous mutations are serialized within the existing single-process store.
  // Restore all touched collections if writing the atomic snapshot fails.
  private mutate(req: any, operation: (id: string) => any) {
    const id = this.auth(req), db = DataStore.getInstance();
    const saved = { users: structuredClone(db.users), refunds: structuredClone(db.refunds), financeSettlements: structuredClone(db.financeSettlements), commissionPolicies: structuredClone(db.commissionPolicies), financeAudit: structuredClone(db.financeAudit), financeGrants: structuredClone(db.financeGrants), financeReportSubmissions: structuredClone(db.financeReportSubmissions), notifications: structuredClone(db.notifications) };
    try { const result = operation(id); db.persist(); return result; }
    catch (error) { Object.assign(db, saved); throw error; }
  }
  @Get('config') config(@Req() req: any) { return this.service.config(this.auth(req)); }
  @Get('account') account(@Req() req: any) { return this.service.account(this.auth(req)); }
  @Post('account') updateAccount(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.updateAccount(actor, body)); }
  @Post('account/password') password(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.password(actor, body)); }
  @Get('dashboard') dashboard(@Req() req: any, @Query() q: any) { this.auth(req); return this.service.dashboard(q); }
  @Get('transactions') transactions(@Req() req: any, @Query() q: any) { this.auth(req); return this.service.transactions(q); }
  @Get('transactions/:id') transaction(@Req() req: any, @Param('id') id: string) { this.auth(req); return this.service.detail('transactions', id); }
  @Get('refunds') refunds(@Req() req: any, @Query() q: any) { this.auth(req); return this.service.refunds(q); }
  @Get('refunds/:id') refund(@Req() req: any, @Param('id') id: string) { this.auth(req); return this.service.detail('refunds', id); }
  @Post('refunds/:id/review') review(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(req, actor => this.service.reviewRefund(id, actor, body)); }
  @Get('settlements') settlements(@Req() req: any, @Query() q: any) { this.auth(req); return this.service.settlements(q); }
  @Get('settlements/:id') settlement(@Req() req: any, @Param('id') id: string) { this.auth(req); return this.service.detail('settlements', id); }
  @Post('settlements') calculate(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.createSettlement(actor, body)); }
  @Post('settlements/:id/action') settlementAction(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(req, actor => this.service.settlementAction(id, actor, body)); }
  @Get('revenue') revenue(@Req() req: any, @Query() q: any) { this.auth(req); this.service.filters(q); return this.service.revenue(q); }
  @Get('commission-policies') policies(@Req() req: any) { return this.service.config(this.auth(req)).policies; }
  @Post('commission-policies') policy(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.addPolicy(actor, body)); }
  @Post('permissions') grant(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.grant(actor, body)); }
  @Get('reconciliation') reconciliation(@Req() req: any, @Query() q: any) { this.auth(req); this.service.filters(q); return { available: false, reason: 'No trusted gateway API or reconciliation file integration is configured. Internal demo records cannot be independently reconciled.', records: [] }; }
  @Get('reports') report(@Req() req: any, @Query() q: any) { this.auth(req); const { allRecords, ...report } = this.service.report(q); return report; }
  @Post('submitted-reports') submitReport(@Req() req: any, @Body() body: any) { return this.mutate(req, actor => this.service.submitReport(actor, body)); }
  @Get('submitted-reports') submittedReports(@Req() req: any, @Query() q: any) { return this.service.submittedReports(this.auth(req), q); }
  @Get('submitted-reports/:id') submittedReport(@Req() req: any, @Param('id') id: string) { return this.service.submittedReport(this.auth(req), id); }
  @Post('submitted-reports/:id/review') reviewSubmittedReport(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.mutate(req, actor => this.service.reviewSubmittedReport(actor, id, body)); }
  @Get('submitted-reports/:id/export') exportSubmittedReport(@Req() req: any, @Param('id') id: string, @Query('format') format: string, @Res() res: Response) {
    const report = this.service.submittedReport(this.auth(req), id);
    if (!['csv', 'pdf'].includes(format)) throw new BadRequestException('Use CSV or PDF');
    const snapshot = report.snapshot;
    if (format === 'pdf' && snapshot.records.length > 2000) throw new BadRequestException('This report exceeds the PDF limit; download CSV instead');
    const payload = format === 'csv' ? csv(snapshot.records) : pdf(report.title, [`Submitted by: ${report.submittedByName}`, `Submitted: ${new Date(report.submittedAt).toISOString()}`, `Generated: ${new Date(snapshot.generatedAt).toISOString()}`, `Filters: ${JSON.stringify(snapshot.filters)}`, `Totals: ${JSON.stringify(snapshot.totals)}`, `Notes: ${report.notes}`], snapshot.records);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eventflow-${report.id}.${format}"`);
    res.send(payload);
  }
  @Get('reports/export') export(@Req() req: any, @Query() q: any, @Res() res: Response) {
    this.auth(req);
    if (!['csv', 'pdf'].includes(q.format)) throw new BadRequestException('Use CSV or PDF');
    const report = this.service.report(q);
    if (report.allRecords.length > (q.format === 'pdf' ? 2000 : 20000)) throw new BadRequestException('Report is too large; narrow the date range');
    const payload = q.format === 'csv' ? csv(report.allRecords) : pdf(`${report.type} report`, [`Generated: ${report.generatedAt.toISOString()}`, `Filters: ${JSON.stringify(q)}`, `Filtered report totals: ${JSON.stringify(report.totals)}`, report.unavailable || ''], report.allRecords);
    res.setHeader('Content-Type', q.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eventflow-${report.type}.${q.format}"`);
    res.send(payload);
  }
}
