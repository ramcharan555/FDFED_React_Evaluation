import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { constants, createReadStream, existsSync, readFileSync, unlinkSync } from 'fs';
import { access } from 'fs/promises';
import * as path from 'path';
import { DataStore, EventCompletionReport } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import {
  CreateEventCompletionReportDto, CreateEventReportDto, CreateStaffReportDto,
} from './dto/report.dto';

const EVENT_REPORT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'event-reports');

@Injectable()
export class ReportsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  // EVENT REPORTS
  createEventReport(dto: CreateEventReportDto, role: UserRole, userId?: string, file?: Express.Multer.File): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can create event reports');
    }
    const event = this.db.events.find(item => item.eventId === dto.eventId);
    if (!event) throw new NotFoundException('Event not found');
    const organizer = this.db.organizers.find(item => item.userId === userId);
    if (role === UserRole.EVENT_ORGANIZER && (!organizer || organizer.organizerId !== event.organizerId)) {
      throw new ForbiddenException('You can only report on your own events');
    }
    if (event.status !== 'completed') throw new BadRequestException('Reports can only be submitted for completed events');
    const request = this.db.eventRequests.find(item => item.eventId === event.eventId);
    const client = this.db.clients.find(item => item.clientId === (request?.clientId || event.clientId));
    if (!client) throw new BadRequestException('This event has no requesting client. A client report cannot be submitted.');
    const id = this.db.generateId('rpt-evt');
    const report = {
      eventReportId: id,
      organizerId: event.organizerId,
      eventId: dto.eventId,
      clientId: client.clientId,
      submittedByStaffId: dto.submittedByStaffId,
      reportTitle: dto.reportTitle,
      reportDetails: dto.reportDetails,
      submissionDate: dto.submissionDate,
      documentName: file ? path.basename(file.originalname) : undefined,
      documentFileName: file?.filename,
      documentMimeType: file?.mimetype,
      documentSize: file?.size,
      status: 'submitted' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventReports.push(report);

    // The requesting client is derived from the event, never from a recipient supplied by the browser.
    this.db.notifications.push({
      notificationId: this.db.generateId('notif'),
      userId: client.userId,
      eventId: dto.eventId,
      registrationId: undefined,
      paymentId: undefined,
      message: `New event report: "${dto.reportTitle}" has been submitted`,
      type: 'event_report',
      read: false,
      dateTime: new Date(),
      createdAt: new Date(),
    });

    return { success: true, message: 'Event report sent to the requesting client', data: this.mapEventReport(report) };
  }

  private mapEventReport(report: DataStore['eventReports'][number]): any {
    const client = this.db.clients.find(item => item.clientId === report.clientId);
    const user = this.db.users.find(item => item.userId === client?.userId);
    return { ...report, clientUserId: client?.userId, clientName: user?.name, clientEmail: user?.email,
      organizerUserId: this.db.organizers.find(item => item.organizerId === report.organizerId)?.userId };
  }

  uploadEventReport(eventId: string, file: Express.Multer.File, role: UserRole, userId?: string): any {
    try {
      const signature = readFileSync(file.path).subarray(0, 5).toString('ascii');
      if (path.extname(file.originalname).toLowerCase() === '.pdf' ? signature !== '%PDF-' : !signature.startsWith('PK')) {
        throw new BadRequestException('The uploaded report does not match its file type');
      }
      return this.createEventReport({ eventId, organizerId: '', reportTitle: path.basename(file.originalname),
        reportDetails: 'Event report file submitted to the requesting client.', submissionDate: new Date().toISOString().slice(0, 10) }, role, userId, file);
    } catch (error) {
      if (existsSync(file.path)) unlinkSync(file.path);
      throw error;
    }
  }

  async getEventReportFile(reportId: string, role: UserRole, userId?: string) {
    const report = this.db.eventReports.find(item => item.eventReportId === reportId);
    if (!report) throw new NotFoundException('Event report not found');
    const client = this.db.clients.find(item => item.userId === userId);
    const organizer = this.db.organizers.find(item => item.userId === userId);
    if (role !== UserRole.SUPER_ADMIN && !(role === UserRole.CLIENT && client && client.clientId === report.clientId) &&
      !(role === UserRole.EVENT_ORGANIZER && organizer && organizer.organizerId === report.organizerId)) {
      throw new ForbiddenException('You can only access reports for your own events');
    }
    if (!report.documentFileName) throw new NotFoundException('No file was attached to this report');
    const filePath = path.join(EVENT_REPORT_UPLOAD_DIR, path.basename(report.documentFileName));
    if (!existsSync(filePath)) throw new NotFoundException('Report file is unavailable');
    await access(filePath, constants.R_OK);
    return { stream: createReadStream(filePath), fileName: report.documentName || 'event-report', mimeType: report.documentMimeType || 'application/octet-stream' };
  }

  findAllEventReports(role: UserRole, userId?: string): any[] {
    let reports = [...this.db.eventReports];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(c => c.userId === userId);
      if (client) reports = reports.filter(r => r.clientId === client.clientId);
      else reports = [];
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const org = this.db.organizers.find(o => o.userId === userId);
      if (org) reports = reports.filter(r => r.organizerId === org.organizerId);
      else reports = [];
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return reports.map(report => this.mapEventReport(report));
  }

  createCompletionReport(
    eventId: string,
    dto: CreateEventCompletionReportDto,
    files: Express.Multer.File[],
    role: UserRole,
    userId?: string,
  ): any {
    const removeFiles = () => files.forEach(file => {
      if (file.path && existsSync(file.path)) unlinkSync(file.path);
    });
    if (role !== UserRole.EVENT_ORGANIZER) {
      removeFiles();
      throw new ForbiddenException('Only the assigned organizer can submit an event completion report');
    }
    const event = this.db.events.find(item => item.eventId === eventId);
    if (!event || !event.clientId) {
      removeFiles();
      throw new NotFoundException(`Client event ${eventId} not found`);
    }
    const organizer = this.db.organizers.find(item => item.userId === userId);
    if (!organizer || organizer.organizerId !== event.organizerId) {
      removeFiles();
      throw new ForbiddenException('You can only report on your own events');
    }
    const request = this.db.eventRequests.find(item =>
      item.eventId === eventId && item.organizerId === organizer.organizerId,
    );
    const verifiedPayment = request && this.db.eventWorkflowPayments.find(payment =>
      payment.eventId === eventId &&
      payment.requestId === request.requestId &&
      payment.status === 'completed' &&
      payment.amount === request.budget,
    );
    if (event.status !== 'completed' || !request || request.status !== 'completed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment) {
      removeFiles();
      throw new BadRequestException('A completion report can only be submitted for a completed, fully paid event');
    }
    if (this.db.eventCompletionReports.some(report => report.eventId === eventId)) {
      removeFiles();
      throw new BadRequestException('A completion report has already been submitted for this event');
    }

    const report: EventCompletionReport = {
      reportId: this.db.generateId('rpt-completion'),
      eventId,
      requestId: request.requestId,
      clientId: request.clientId,
      organizerId: request.organizerId,
      eventName: event.name,
      eventDate: event.date,
      venue: event.location,
      servicesProvided: dto.servicesProvided.trim(),
      expenses: dto.expenses.trim(),
      completionNotes: dto.completionNotes.trim(),
      photos: files.map(file => ({
        originalName: path.basename(file.originalname),
        fileName: path.basename(file.filename),
        mimeType: file.mimetype,
        size: file.size,
      })),
      submittedAt: new Date(),
    };
    if (!report.servicesProvided || !report.expenses || !report.completionNotes) {
      removeFiles();
      throw new BadRequestException('Services, expenses, and completion notes are required');
    }
    this.db.eventCompletionReports.push(report);
    const client = this.db.clients.find(item => item.clientId === request.clientId);
    if (client) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: client.userId,
        eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `The completion report for "${event.name}" is ready to review.`,
        type: 'event_completion_report',
        read: false,
        dateTime: report.submittedAt,
        createdAt: report.submittedAt,
      });
    }
    return { success: true, message: 'Event completion report submitted', data: report };
  }

  findAllCompletionReports(role: UserRole, userId?: string): EventCompletionReport[] {
    if (role === UserRole.SUPER_ADMIN) return [...this.db.eventCompletionReports];
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(item => item.userId === userId);
      return client ? this.db.eventCompletionReports.filter(report => report.clientId === client.clientId) : [];
    }
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(item => item.userId === userId);
      return organizer ? this.db.eventCompletionReports.filter(report => report.organizerId === organizer.organizerId) : [];
    }
    throw new ForbiddenException('Access denied');
  }

  async getCompletionReportPhoto(
    eventId: string,
    fileName: string,
    role: UserRole,
    userId?: string,
  ): Promise<{ stream: ReturnType<typeof createReadStream>; mimeType: string; fileName: string }> {
    const report = this.getCompletionReport(eventId, role, userId);
    const photo = report.photos.find(item => item.fileName === path.basename(fileName));
    if (!photo) throw new NotFoundException('Report photo not found');
    const filePath = path.join(EVENT_REPORT_UPLOAD_DIR, photo.fileName);
    if (!existsSync(filePath)) throw new NotFoundException('Report photo is unavailable');
    await access(filePath, constants.R_OK);
    return { stream: createReadStream(filePath), mimeType: photo.mimeType, fileName: photo.originalName };
  }

  private getCompletionReport(eventId: string, role: UserRole, userId?: string): EventCompletionReport {
    const report = this.db.eventCompletionReports.find(item => item.eventId === eventId);
    if (!report) throw new NotFoundException('Event completion report not found');
    if (role === UserRole.CLIENT) {
      const client = this.db.clients.find(item => item.userId === userId);
      if (!client || client.clientId !== report.clientId) throw new ForbiddenException('You can only access reports for your own events');
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.db.organizers.find(item => item.userId === userId);
      if (!organizer || organizer.organizerId !== report.organizerId) throw new ForbiddenException('You can only access reports for your own events');
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return report;
  }

  // STAFF REPORTS
  createStaffReport(dto: CreateStaffReportDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_STAFF can create staff reports');
    }
    const staff = this.db.staffProfiles.find(profile => profile.staffId === dto.staffId);
    const event = this.db.events.find(item => item.eventId === dto.eventId);
    if (!staff || !event) throw new NotFoundException('Staff or event not found');
    if (role !== UserRole.SUPER_ADMIN && staff.userId !== userId) throw new ForbiddenException('You can only submit your own staff report');
    if (event.organizerId !== dto.organizerId) throw new BadRequestException('The report must go to the event organizer');
    // Staff should only report for assigned events
    const assignment = this.db.staffAssignments.find(
      a => a.staffId === dto.staffId && a.eventId === dto.eventId && a.status === 'accepted',
    );
    if (!assignment && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only report for events you are assigned to');
    }

    const existing = this.db.staffReports.find(report => report.eventId === dto.eventId && report.staffId === dto.staffId);
    if (existing) return { success: true, message: 'Staff report already submitted', data: existing };

    const id = this.db.generateId('rpt-staff');
    const report = {
      staffReportId: id,
      staffId: dto.staffId,
      organizerId: dto.organizerId,
      eventId: dto.eventId,
      reportText: dto.reportText,
      status: 'submitted' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.staffReports.push(report);

    // Notify organizer
    const organizer = this.db.organizers.find(o => o.organizerId === dto.organizerId);
    if (organizer) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: organizer.userId,
        eventId: dto.eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `Staff report submitted by ${dto.staffId} for event ${dto.eventId}`,
        type: 'staff_report',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Staff report created', data: report };
  }

  findAllStaffReports(role: UserRole, userId?: string): any[] {
    let reports = [...this.db.staffReports];
    if (role === UserRole.EVENT_STAFF) {
      const staff = this.db.staffProfiles.find(s => s.userId === userId);
      if (staff) reports = reports.filter(r => r.staffId === staff.staffId);
      else reports = [];
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const org = this.db.organizers.find(o => o.userId === userId);
      if (org) reports = reports.filter(r => r.organizerId === org.organizerId);
      else reports = [];
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return reports;
  }
}
