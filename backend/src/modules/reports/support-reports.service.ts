import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { UserRole } from '../../common/constants';
import { DataStore, SupportExecutiveReport } from '../../common/data-store';
import { CreateSupportReportDto, ReviewSupportReportDto } from './dto/support-report.dto';

@Injectable()
export class SupportReportsService {
  private readonly db = DataStore.getInstance();
  private readonly uploadDirectory = path.join(process.cwd(), 'uploads', 'support-reports');

  private requireExecutive(userId: string, role: UserRole, operational = false): void {
    const user = this.db.findUserById(userId);
    const type = String(user?.employeeType || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const allowed = operational ? ['SUPPORT_FINANCE', 'FINANCE_EXECUTIVE'] : ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS'];
    if (role !== UserRole.EVENT_STAFF || !allowed.includes(type)) {
      throw new ForbiddenException('Only support executives can submit support reports');
    }
  }

  private visibleReport(reportId: string, userId: string, role: UserRole, operational = false): SupportExecutiveReport {
    if (role !== UserRole.SUPER_ADMIN) this.requireExecutive(userId, role, operational);
    const report = this.db.supportExecutiveReports.find(item => item.reportId === reportId &&
      (role === UserRole.SUPER_ADMIN ? item.status !== 'draft' : item.submittedBy === userId));
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  private present(report: SupportExecutiveReport) {
    const { documentFileName, ...details } = report;
    return { ...details, author: this.db.findUserById(report.submittedBy)?.name || 'Support Executive',
      authorEmail: this.db.findUserById(report.submittedBy)?.email || '', hasDocument: !!documentFileName };
  }

  list(userId: string, role: UserRole, operational = false) {
    if (role !== UserRole.SUPER_ADMIN) this.requireExecutive(userId, role, operational);
    return this.db.supportExecutiveReports
      .filter(report => role === UserRole.SUPER_ADMIN ? report.status !== 'draft' : report.submittedBy === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map(report => this.present(report));
  }

  get(reportId: string, userId: string, role: UserRole) {
    return this.present(this.visibleReport(reportId, userId, role));
  }

  create(dto: CreateSupportReportDto, file: Express.Multer.File | undefined, userId: string, role: UserRole, operational = false) {
    this.requireExecutive(userId, role, operational);
    for (const field of ['title', 'scope', 'period', 'summary'] as const) {
      if (!dto[field].trim()) throw new BadRequestException(`${field} is required`);
    }
    if (dto.sourceReference) {
      const existing = this.db.supportExecutiveReports.find(report => report.submittedBy === userId && report.sourceReference === dto.sourceReference);
      if (existing) return dto.status === 'submitted' ? this.submit(existing.reportId, userId, role, operational) : this.present(existing);
    }
    const now = new Date();
    const report: SupportExecutiveReport = {
      reportId: `SER-${randomUUID()}`, submittedBy: userId, sourceReference: dto.sourceReference,
      title: dto.title.trim(), category: dto.category, scope: dto.scope.trim(), period: dto.period.trim(),
      summary: dto.summary.trim(), status: dto.status || 'draft', createdAt: now, updatedAt: now,
      ...(dto.status === 'submitted' ? { submittedAt: now } : {}),
    };
    if (file) {
      const fileName = `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
      mkdirSync(this.uploadDirectory, { recursive: true });
      writeFileSync(path.join(this.uploadDirectory, fileName), file.buffer);
      Object.assign(report, { documentName: path.basename(file.originalname), documentFileName: fileName,
        documentMimeType: file.mimetype, documentSize: file.size });
    }
    this.db.supportExecutiveReports.unshift(report);
    if (report.status === 'submitted') this.notifyAdmins(report);
    this.db.persist();
    return this.present(report);
  }

  submit(reportId: string, userId: string, role: UserRole, operational = false) {
    this.requireExecutive(userId, role, operational);
    const report = this.visibleReport(reportId, userId, role, operational);
    if (report.status === 'draft') {
      report.status = 'submitted';
      report.submittedAt = new Date();
      report.updatedAt = report.submittedAt;
      this.notifyAdmins(report);
      this.db.persist();
    }
    return this.present(report);
  }

  review(reportId: string, dto: ReviewSupportReportDto, userId: string, role: UserRole) {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only admins can review support reports');
    const report = this.visibleReport(reportId, userId, role);
    const feedback = dto.feedback?.trim() || 'Reviewed by admin';
    if (report.status !== 'reviewed' || report.reviewFeedback !== feedback) {
      report.status = 'reviewed';
      report.reviewFeedback = feedback;
      report.reviewedBy = userId;
      report.reviewedAt = new Date();
      report.updatedAt = report.reviewedAt;
      this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: report.submittedBy,
        supportReportId: report.reportId, message: `Your report "${report.title}" was reviewed: ${feedback}`,
        type: 'support_report_reviewed', read: false, dateTime: report.reviewedAt, createdAt: report.reviewedAt });
      this.db.persist();
    }
    return this.present(report);
  }

  download(reportId: string, userId: string, role: UserRole) {
    const report = this.visibleReport(reportId, userId, role);
    if (!report.documentFileName) throw new NotFoundException('This report has no attached document');
    const filePath = path.join(this.uploadDirectory, path.basename(report.documentFileName));
    if (!existsSync(filePath)) throw new NotFoundException('The report document is unavailable');
    return { stream: createReadStream(filePath), name: report.documentName || 'report.pdf', mimeType: report.documentMimeType || 'application/octet-stream' };
  }

  private notifyAdmins(report: SupportExecutiveReport): void {
    this.db.users.filter(user => user.userRole === UserRole.SUPER_ADMIN && user.status === 'active').forEach(admin => {
      this.db.notifications.push({ notificationId: this.db.generateId('notif'), userId: admin.userId,
        supportReportId: report.reportId, message: `Support report submitted: "${report.title}"`,
        type: 'support_report_submitted', read: false, dateTime: new Date(), createdAt: new Date() });
    });
  }
}
