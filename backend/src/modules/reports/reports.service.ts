import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import {
  CreateEventReportDto, CreateStaffReportDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  // EVENT REPORTS
  createEventReport(dto: CreateEventReportDto, role: UserRole): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can create event reports');
    }
    const id = this.db.generateId('rpt-evt');
    const report = {
      eventReportId: id,
      organizerId: dto.organizerId,
      eventId: dto.eventId,
      clientId: dto.clientId,
      submittedByStaffId: dto.submittedByStaffId,
      reportTitle: dto.reportTitle,
      reportDetails: dto.reportDetails,
      submissionDate: dto.submissionDate,
      status: 'submitted' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.eventReports.push(report);

    // Notify client if clientId provided
    if (dto.clientId) {
      const client = this.db.clients.find(c => c.clientId === dto.clientId);
      if (client) {
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
      }
    }

    return { success: true, message: 'Event report created', data: report };
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
    return reports;
  }

  // STAFF REPORTS
  createStaffReport(dto: CreateStaffReportDto, role: UserRole): any {
    if (role !== UserRole.EVENT_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_STAFF can create staff reports');
    }
    // Staff should only report for assigned events
    const assignment = this.db.staffAssignments.find(
      a => a.staffId === dto.staffId && a.eventId === dto.eventId && a.status === 'accepted',
    );
    if (!assignment && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You can only report for events you are assigned to');
    }

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
