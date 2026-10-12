import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateStaffAssignmentDto, UpdateAssignmentStatusDto } from './dto/staff-assignment.dto';

@Injectable()
export class StaffAssignmentsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  create(dto: CreateStaffAssignmentDto, role: UserRole): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can assign staff');
    }

    // Verify event exists
    const event = this.db.events.find(e => e.eventId === dto.eventId);
    if (!event) throw new NotFoundException(`Event ${dto.eventId} not found`);

    // Verify staff exists
    const staff = this.db.staffProfiles.find(s => s.staffId === dto.staffId);
    if (!staff) throw new NotFoundException(`Staff ${dto.staffId} not found`);

    // ✅ NEW: Check staff availability
    if (staff.availableDates && staff.availableDates.length > 0) {
      const eventDate = event.date; // Format: YYYY-MM-DD
      const isAvailable = staff.availableDates.includes(eventDate);
      
      if (!isAvailable) {
        throw new BadRequestException(
          `Staff ${staff.staffId} is not available on ${eventDate}. Available dates: ${staff.availableDates.join(', ')}`
        );
      }
    }

    // Duplicate assignment check
    const existing = this.db.staffAssignments.find(
      a => a.eventId === dto.eventId && a.staffId === dto.staffId && a.status !== 'cancelled',
    );
    if (existing) throw new ConflictException('Staff already assigned to this event');

    const id = this.db.generateId('asgn');
    const assignment = {
      assignmentId: id,
      eventId: dto.eventId,
      organizerId: dto.organizerId,
      staffId: dto.staffId,
      status: 'pending' as const,
      assignedAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.staffAssignments.push(assignment);

    // Notify staff
    const staffProfile = this.db.staffProfiles.find(s => s.staffId === dto.staffId);
    if (staffProfile) {
      this.db.notifications.push({
        notificationId: this.db.generateId('notif'),
        userId: staffProfile.userId,
        eventId: dto.eventId,
        registrationId: undefined,
        paymentId: undefined,
        message: `You have been assigned to event "${event?.name || dto.eventId}". Please accept or decline.`,
        type: 'assignment',
        read: false,
        dateTime: new Date(),
        createdAt: new Date(),
      });
    }

    return { success: true, message: 'Staff assignment created', data: assignment };
  }

  findAll(role: UserRole, userId?: string): any[] {
    let assignments = [...this.db.staffAssignments];
    if (role === UserRole.EVENT_STAFF) {
      const staffUser = this.db.staffProfiles.find(s => s.userId === userId);
      if (staffUser) assignments = assignments.filter(a => a.staffId === staffUser.staffId);
      else assignments = [];
    } else if (role === UserRole.EVENT_ORGANIZER) {
      const org = this.db.organizers.find(o => o.userId === userId);
      if (org) assignments = assignments.filter(a => a.organizerId === org.organizerId);
      else assignments = [];
    } else if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return assignments;
  }

  updateStatus(id: string, dto: UpdateAssignmentStatusDto, role: UserRole, userId?: string): any {
    const assignment = this.db.staffAssignments.find(a => a.assignmentId === id);
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);

    if (role === UserRole.EVENT_STAFF) {
      const staffUser = this.db.staffProfiles.find(s => s.userId === userId);
      if (!staffUser || staffUser.staffId !== assignment.staffId) {
        throw new ForbiddenException('You can only update your own assignments');
      }
    } else if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    assignment.status = dto.status;
    assignment.updatedAt = new Date();

    // Notify organizer when staff accepts/declines
    if (dto.status === 'accepted' || dto.status === 'declined') {
      const organizer = this.db.organizers.find(o => o.organizerId === assignment.organizerId);
      if (organizer) {
        const event = this.db.events.find(e => e.eventId === assignment.eventId);
        this.db.notifications.push({
          notificationId: this.db.generateId('notif'),
          userId: organizer.userId,
          eventId: assignment.eventId,
          registrationId: undefined,
          paymentId: undefined,
          message: `Staff ${assignment.staffId} has ${dto.status} assignment for "${event?.name || assignment.eventId}"`,
          type: `assignment_${dto.status}`,
          read: false,
          dateTime: new Date(),
          createdAt: new Date(),
        });
      }
    }

    return { success: true, message: `Assignment status updated to ${dto.status}`, data: assignment };
  }
}
