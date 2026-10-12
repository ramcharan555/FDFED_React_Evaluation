import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { EmployeeType, UserRole } from '../../common/constants';

@Injectable()
export class AnalyticsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  getDashboard(role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can view analytics dashboard');
    }

    const totalRevenue = this.db.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      message: 'Dashboard analytics',
      data: {
        users: {
          total: this.db.users.length,
          active: this.db.users.filter(u => u.status === 'active').length,
          suspended: this.db.users.filter(u => u.status === 'suspended').length,
          byRole: {
            super_admin: this.db.users.filter(u => u.userRole === UserRole.SUPER_ADMIN).length,
            client: this.db.users.filter(u => u.userRole === UserRole.CLIENT).length,
            event_organizer: this.db.users.filter(u => u.userRole === UserRole.EVENT_ORGANIZER).length,
            event_staff: this.db.users.filter(u => u.userRole === UserRole.EVENT_STAFF).length,
            attendee: this.db.users.filter(u => u.userRole === UserRole.ATTENDEE).length,
          },
        },
        events: {
          total: this.db.events.length,
          draft: this.db.events.filter(e => e.status === 'draft').length,
          published: this.db.events.filter(e => e.status === 'published').length,
          ongoing: this.db.events.filter(e => e.status === 'ongoing').length,
          completed: this.db.events.filter(e => e.status === 'completed').length,
          cancelled: this.db.events.filter(e => e.status === 'cancelled').length,
        },
        eventRequests: {
          total: this.db.eventRequests.length,
          pending: this.db.eventRequests.filter(r => r.status === 'pending').length,
          approved: this.db.eventRequests.filter(r => r.status === 'approved').length,
          rejected: this.db.eventRequests.filter(r => r.status === 'rejected').length,
        },
        registrations: {
          total: this.db.registrations.length,
          registered: this.db.registrations.filter(r => r.status === 'registered').length,
          attended: this.db.registrations.filter(r => r.status === 'attended').length,
          cancelled: this.db.registrations.filter(r => r.status === 'cancelled').length,
        },
        payments: {
          total: this.db.payments.length,
          completed: this.db.payments.filter(p => p.status === 'completed').length,
          totalRevenue,
        },
        staffAssignments: {
          total: this.db.staffAssignments.length,
          pending: this.db.staffAssignments.filter(a => a.status === 'pending').length,
          accepted: this.db.staffAssignments.filter(a => a.status === 'accepted').length,
        },
        attendance: {
          totalCheckIns: this.db.attendance.filter(a => a.status === 'checked-in').length,
        },
        reviews: {
          totalEventReviews: this.db.eventReviews.length,
          totalStaffReviews: this.db.staffReviews.length,
          avgEventRating: this.db.eventReviews.length > 0
            ? parseFloat((this.db.eventReviews.reduce((s, r) => s + r.rating, 0) / this.db.eventReviews.length).toFixed(1))
            : 0,
        },
        reports: {
          totalEventReports: this.db.eventReports.length,
          totalStaffReports: this.db.staffReports.length,
        },
      },
    };
  }

  getOrganizerDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    const organizer = this.db.organizers.find(o => o.userId === userId);
    if (!organizer) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return { success: false, message: 'Organizer profile not found' };
    }

    const myEvents = this.db.events.filter(e => e.organizerId === organizer.organizerId);
    const myEventIds = myEvents.map(e => e.eventId);
    const myRegs = this.db.registrations.filter(r => myEventIds.includes(r.eventId));
    const myRevenue = this.db.payments
      .filter(p => myRegs.some(r => r.registrationId === p.registrationId) && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const myRequests = this.db.eventRequests.filter(r => r.organizerId === organizer.organizerId);
    const myAssignments = this.db.staffAssignments.filter(a => a.organizerId === organizer.organizerId);

    return {
      success: true,
      data: {
        totalEvents: myEvents.length,
        activeEvents: myEvents.filter(e => e.status === 'published' || e.status === 'ongoing').length,
        draftEvents: myEvents.filter(e => e.status === 'draft').length,
        completedEvents: myEvents.filter(e => e.status === 'completed').length,
        totalRegistrations: myRegs.length,
        totalRevenue: myRevenue,
        staffAssigned: myAssignments.filter(a => a.status !== 'cancelled').length,
        pendingRequests: myRequests.filter(r => r.status === 'pending').length,
        approvedRequests: myRequests.filter(r => r.status === 'approved').length,
      },
    };
  }

  // ✅ NEW: Client Dashboard
  getClientDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only CLIENT can view this dashboard');
    }
    const client = this.db.clients.find(c => c.userId === userId);
    if (!client) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return { success: false, message: 'Client profile not found' };
    }

    const myRequests = this.db.eventRequests.filter(r => r.clientId === client.clientId);
    const myPlans = this.db.eventPlans.filter(p => p.clientId === client.clientId);
    const approvedPlanIds = myPlans.filter(p => p.status === 'approved').map(p => p.eventId).filter(Boolean);
    const myEvents = this.db.events.filter(e => approvedPlanIds.includes(e.eventId));

    return {
      success: true,
      data: {
        totalRequests: myRequests.length,
        pendingRequests: myRequests.filter(r => r.status === 'pending').length,
        approvedRequests: myRequests.filter(r => r.status === 'approved').length,
        rejectedRequests: myRequests.filter(r => r.status === 'rejected').length,
        totalEventPlans: myPlans.length,
        pendingPlans: myPlans.filter(p => p.status === 'submitted').length,
        approvedPlans: myPlans.filter(p => p.status === 'approved').length,
        ongoingEvents: myEvents.filter(e => e.status === 'ongoing').length,
        completedEvents: myEvents.filter(e => e.status === 'completed').length,
        totalEvents: myEvents.length,
      },
    };
  }

  // ✅ NEW: Event Staff Dashboard
  getStaffDashboard(role: UserRole, userId: string, employeeType?: EmployeeType): any {
    if (role !== UserRole.EVENT_STAFF && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_STAFF can view this dashboard');
    }
    const staffUser = this.db.staffProfiles.find(s => s.userId === userId);
    if (!staffUser) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return { success: false, message: 'Staff profile not found' };
    }

    const myAssignments = this.db.staffAssignments.filter(a => a.staffId === staffUser.staffId);
    const myEventIds = myAssignments.map(a => a.eventId);
    const myReports = this.db.staffReports.filter(r => r.staffId === staffUser.staffId);

    const departmentStats = employeeType === EmployeeType.REGISTRATION_VERIFICATION
      ? {
          totalRegistrations: this.db.registrations.length,
          pendingVerifications: this.db.registrations.filter(r => r.status === 'registered').length,
          verifiedRegistrations: this.db.registrations.filter(r => r.status === 'attended').length,
          todayRegistrations: this.db.registrations.filter(r => r.registrationDate === new Date().toISOString().split('T')[0]).length,
        }
      : employeeType === EmployeeType.EVENT_OPERATIONS
        ? {
            totalEvents: this.db.events.length,
            activeEvents: this.db.events.filter(e => e.status === 'published' || e.status === 'ongoing').length,
            pendingEvents: this.db.events.filter(e => e.status === 'draft').length,
            upcomingEvents: this.db.events.filter(e => new Date(e.date) >= new Date()).length,
          }
        : employeeType === EmployeeType.SUPPORT_FINANCE
          ? {
              pendingSupportRequests: this.db.eventRequests.filter(r => r.status === 'pending').length,
              openIssues: this.db.eventRequests.filter(r => (r.status as string) === 'in_review').length,
              successfulTransactions: this.db.payments.filter(p => p.status === 'completed').length,
              pendingPayments: this.db.payments.filter(p => p.status === 'pending').length,
            }
          : {};

    return {
      success: true,
      data: {
        employeeType,
        ...departmentStats,
        totalAssignments: myAssignments.length,
        pendingAssignments: myAssignments.filter(a => a.status === 'pending').length,
        acceptedAssignments: myAssignments.filter(a => a.status === 'accepted').length,
        declinedAssignments: myAssignments.filter(a => a.status === 'declined').length,
        completedAssignments: myAssignments.filter(a => a.status === 'completed').length,
        myRating: staffUser.rating,
        totalReportsSubmitted: myReports.length,
        draftReports: myReports.filter(r => r.status === 'draft').length,
        submittedReports: myReports.filter(r => r.status === 'submitted').length,
        upcomingEvents: myEventIds.length, // Count of events assigned
        availableDates: staffUser.availableDates || [],
      },
    };
  }

  // ✅ NEW: Attendee Dashboard
  getAttendeeDashboard(role: UserRole, userId: string): any {
    if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE can view this dashboard');
    }
    const attendeeUser = this.db.attendees.find(a => a.userId === userId);
    if (!attendeeUser) {
      if (role === UserRole.SUPER_ADMIN) return this.getDashboard(role);
      return { success: false, message: 'Attendee profile not found' };
    }

    const myRegistrations = this.db.registrations.filter(r => r.attendeeId === attendeeUser.attendeeId);
    const myEventIds = myRegistrations.map(r => r.eventId);
    const myEvents = this.db.events.filter(e => myEventIds.includes(e.eventId));
    const myAttendance = this.db.attendance.filter(a => a.attendeeId === attendeeUser.attendeeId);

    const upcomingEvents = myEvents.filter(e => new Date(e.date).setHours(23, 59, 59, 999) > new Date().setHours(0, 0, 0, 0));
    const completedEvents = myEvents.filter(e => new Date(e.date).setHours(23, 59, 59, 999) <= new Date().setHours(0, 0, 0, 0));

    return {
      success: true,
      data: {
        totalRegistrations: myRegistrations.length,
        registeredEvents: myRegistrations.filter(r => r.status === 'registered').length,
        attendedEvents: myRegistrations.filter(r => r.status === 'attended').length,
        cancelledRegistrations: myRegistrations.filter(r => r.status === 'cancelled').length,
        upcomingEvents: upcomingEvents.length,
        completedEvents: completedEvents.length,
        checkedInCount: myAttendance.filter(a => a.status === 'checked-in').length,
        noShowCount: myAttendance.filter(a => a.status === 'no-show').length,
        registeredEventDetails: myRegistrations.map(reg => {
          const event = myEvents.find(e => e.eventId === reg.eventId);
          return {
            registrationId: reg.registrationId,
            eventId: reg.eventId,
            eventName: event?.name,
            eventDate: event?.date,
            status: reg.status,
            ticketType: reg.ticketType,
            verificationId: reg.verificationId,
          };
        }),
      },
    };
  }
}
