import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataStore, Attendee } from '../../common/data-store';
import { CreateAttendeeDto, UpdateAttendeeDto } from './dtos/attendee.dto';
import { UserRole } from '../../common/constants';

@Injectable()
export class AttendeesService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  // ─── Map attendee + user data to frontend-friendly shape ─────────────────────
  private mapAttendeeToFrontend(a: Attendee): any {
    const user = this.dataStore.users.find((u) => u.userId === a.userId);
    // Registrations for this attendee
    const regs = this.dataStore.registrations.filter(r => r.attendeeId === a.attendeeId);
    const eventIds = regs.map(r => r.eventId);

    return {
      ...a,
      // Frontend-compatible aliases
      id: a.attendeeId,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phoneNo || '',
      status: user?.status || 'active',
      bio: user?.bio || '',
      registrationCount: regs.length,
      eventIds,
      // First registered event (for simple displays)
      eventId: eventIds[0] || null,
      joinedAt: user?.createdAt || a.createdAt,
    };
  }

  // Create Attendee (registration via user creation)
  create(createAttendeeDto: CreateAttendeeDto, role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ATTENDEE) {
      throw new ForbiddenException('Only attendees and super admin can create attendee profiles');
    }

    const existingUser = this.dataStore.findUserByEmail(createAttendeeDto.email);

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    if (!createAttendeeDto.phone) throw new BadRequestException('Phone number is required');
    if (!createAttendeeDto.bio?.trim()) throw new BadRequestException('Bio is required');

    const userId = this.dataStore.generateId('usr-attendee');
    const attendeeId = this.dataStore.generateId('att');

    const user = {
      userId,
      name: createAttendeeDto.name,
      email: createAttendeeDto.email.trim().toLowerCase(),
      password: createAttendeeDto.password || '',
      userRole: UserRole.ATTENDEE,
      status: 'active' as const,
      phoneNo: (createAttendeeDto as any).phone || '',
      bio: createAttendeeDto.bio.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const attendee: Attendee = {
      attendeeId,
      userId,
      createdAt: new Date(),
    };

    this.dataStore.users.push(user);
    this.dataStore.attendees.push(attendee);

    return this.mapAttendeeToFrontend(attendee);
  }

  // Get all attendees
  findAll(role: UserRole, search?: string): any[] {
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_ORGANIZER) {
      // Return empty rather than 403 so the UI can degrade gracefully
      return [];
    }

    let attendees = this.dataStore.attendees.map((a) => this.mapAttendeeToFrontend(a));

    if (search) {
      attendees = attendees.filter(
        (a) =>
          a.name?.toLowerCase().includes(search.toLowerCase()) ||
          a.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return attendees;
  }

  // Get attendee by ID
  findOne(attendeeId: string, role: UserRole, userId?: string): any {
    const attendee = this.dataStore.attendees.find((a) => a.attendeeId === attendeeId);

    if (!attendee) {
      throw new NotFoundException(`Attendee with ID ${attendeeId} not found`);
    }
    if (role === UserRole.ATTENDEE && attendee.userId !== userId) throw new ForbiddenException('You can only view your own attendee profile');
    if (![UserRole.ATTENDEE, UserRole.EVENT_ORGANIZER, UserRole.EVENT_STAFF, UserRole.SUPER_ADMIN].includes(role)) throw new ForbiddenException('Access denied');

    return this.mapAttendeeToFrontend(attendee);
  }

  // Get attendees by event ID
  findByEvent(eventId: string, role: UserRole, userId?: string): any[] {
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_ORGANIZER && role !== UserRole.EVENT_STAFF && role !== UserRole.CLIENT) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const event = this.dataStore.events.find(e => e.eventId === eventId);
    if (!event) throw new NotFoundException('Event not found');
    if (role === UserRole.EVENT_ORGANIZER) {
      const organizer = this.dataStore.organizers.find(o => o.userId === userId);
      if (!organizer || event.organizerId !== organizer.organizerId) throw new ForbiddenException('You can only view attendees for your own events');
    } else if (role === UserRole.EVENT_STAFF) {
      const staff = this.dataStore.staffProfiles.find(s => s.userId === userId);
      const assigned = this.dataStore.staffAssignments.some(a => a.staffId === staff?.staffId && a.eventId === eventId && a.status === 'accepted');
      if (!assigned) throw new ForbiddenException('You can only view attendees for accepted event assignments');
    } else if (role === UserRole.CLIENT) {
      const client = this.dataStore.clients.find(c => c.userId === userId);
      if (!client || event.clientId !== client.clientId) throw new ForbiddenException('You can only view attendees for your own events');
    }

    const registrations = this.dataStore.registrations.filter(r => r.eventId === eventId);
    const attendeeIds = registrations.map(r => r.attendeeId);
    const attendees = this.dataStore.attendees.filter(a => attendeeIds.includes(a.attendeeId));

    return attendees.map(a => this.mapAttendeeToFrontend(a));
  }

  // Update attendee profile
  update(attendeeId: string, updateAttendeeDto: UpdateAttendeeDto, role: UserRole, userId?: string): any {
    const attendee = this.dataStore.attendees.find((a) => a.attendeeId === attendeeId);

    if (!attendee) {
      throw new NotFoundException(`Attendee with ID ${attendeeId} not found`);
    }

    if (role === UserRole.ATTENDEE && attendee.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    } else if (role !== UserRole.ATTENDEE && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this profile');
    }

    const user = this.dataStore.users.find((u) => u.userId === attendee.userId);
    if (!user) {
      throw new NotFoundException('Associated user not found');
    }

    const dto = updateAttendeeDto as any;
    if (dto.email) {
      const existing = this.dataStore.findUserByEmail(dto.email);
      if (existing && existing.userId !== user.userId) throw new BadRequestException('Email already registered');
    }
    const phone = dto.phone ?? user.phoneNo;
    const bio = dto.bio ?? user.bio;
    if (!phone) throw new BadRequestException('Phone number is required');
    if (!/^[6-9]\d{9}$/.test(phone)) throw new BadRequestException('Enter a valid 10-digit Indian mobile number.');
    if (!bio?.trim()) throw new BadRequestException('Bio is required');
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.trim().toLowerCase();
    if (dto.phone) user.phoneNo = dto.phone;
    if (dto.bio !== undefined) user.bio = dto.bio.trim();
    if (dto.status) user.status = dto.status;

    user.updatedAt = new Date();

    return this.mapAttendeeToFrontend(attendee);
  }

  // Delete attendee
  delete(attendeeId: string, role: UserRole): { message: string } {
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can delete attendees');
    }

    const index = this.dataStore.attendees.findIndex((a) => a.attendeeId === attendeeId);

    if (index === -1) {
      throw new NotFoundException(`Attendee with ID ${attendeeId} not found`);
    }

    const attendee = this.dataStore.attendees[index];
    this.dataStore.attendees.splice(index, 1);

    const userIndex = this.dataStore.users.findIndex((u) => u.userId === attendee.userId);
    if (userIndex !== -1) {
      this.dataStore.users.splice(userIndex, 1);
    }

    return { message: `Attendee ${attendeeId} deleted successfully` };
  }

  // Get attendee statistics
  getStatistics(): any {
    const attendees = this.dataStore.attendees;
    const activeCount = attendees.length;
    const totalRegistrations = this.dataStore.registrations.length;

    return {
      totalAttendees: activeCount,
      totalRegistrations,
      avgRegistrationsPerAttendee: activeCount > 0 ? totalRegistrations / activeCount : 0,
    };
  }
}
