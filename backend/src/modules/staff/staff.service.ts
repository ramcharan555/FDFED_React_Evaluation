import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataStore, EventStaff } from '../../common/data-store';
import { CreateStaffDto, UpdateStaffDto } from './dtos/staff.dto';
import { UserRole } from '../../common/constants';

@Injectable()
export class StaffService {
  private dataStore: DataStore;

  constructor() {
    this.dataStore = DataStore.getInstance();
  }

  // Create Staff profile (registration)
  create(createStaffDto: CreateStaffDto, role: UserRole): EventStaff {
    // Only SUPER_ADMIN or EVENT_STAFF can create staff profiles
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_STAFF) {
      throw new ForbiddenException('Only super admin and staff can create staff profiles');
    }

    // Check if user already exists
    const existingUser = this.dataStore.users.find(
      (u) => u.email.toLowerCase() === createStaffDto.email.toLowerCase(),
    );

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Create user and staff profile
    const userId = this.dataStore.generateId('usr-staff');
    const staffId = this.dataStore.generateId('staff');

    const user = {
      userId,
      name: createStaffDto.name,
      email: createStaffDto.email,
      password: createStaffDto.password || '',
      userRole: UserRole.EVENT_STAFF,
      status: 'active' as const,
      phoneNo: createStaffDto.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const staff: EventStaff = {
      staffId,
      userId,
      availableDates: createStaffDto.availableDates || [],
      rating: 0,
      status: 'available',
      createdAt: new Date(),
    };

    this.dataStore.users.push(user);
    this.dataStore.staffProfiles.push(staff);

    return staff;
  }

  // Get all staff profiles
  findAll(role: UserRole, search?: string): any[] {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_ORGANIZER].includes(role)) {
      throw new ForbiddenException('Only super admin and organizers can view staff');
    }

    let staff = this.dataStore.staffProfiles.map((s) => {
      const user = this.dataStore.users.find((u) => u.userId === s.userId);
      return { ...s, ...user };
    });

    if (search) {
      staff = staff.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return staff;
  }

  // Get staff by ID
  findOne(staffId: string, role: UserRole): any {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_ORGANIZER].includes(role)) {
      throw new ForbiddenException('Only super admin and organizers can view staff');
    }

    const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    const user = this.dataStore.users.find((u) => u.userId === staff.userId);
    return { ...staff, ...user };
  }

  // Update staff profile
  update(staffId: string, updateStaffDto: UpdateStaffDto, role: UserRole, userId?: string): any {
    const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    // Validate permissions
    if (role === UserRole.EVENT_STAFF && staff.userId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    } else if (role !== UserRole.SUPER_ADMIN && role !== UserRole.EVENT_STAFF) {
      throw new ForbiddenException('Only super admin and staff can update profiles');
    }

    const user = this.dataStore.users.find((u) => u.userId === staff.userId);
    if (!user) {
      throw new NotFoundException('Associated user not found');
    }

    // Update staff profile
    if (updateStaffDto.availableDates) staff.availableDates = updateStaffDto.availableDates;
    if (updateStaffDto.status) staff.status = updateStaffDto.status;

    // Update user info
    if (updateStaffDto.name) user.name = updateStaffDto.name;
    if (updateStaffDto.email) user.email = updateStaffDto.email;
    if (updateStaffDto.phone) user.phoneNo = updateStaffDto.phone;

    user.updatedAt = new Date();

    return { ...staff, ...user };
  }

  // Assign event to staff member
  assignEvent(staffId: string, eventId: string, role: UserRole): any {
    if (![UserRole.SUPER_ADMIN, UserRole.EVENT_ORGANIZER].includes(role)) {
      throw new ForbiddenException('Only super admin and organizers can assign events');
    }

    const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);
    if (!staff) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    const event = this.dataStore.events.find((e) => e.eventId === eventId);
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const assignmentId = this.dataStore.generateId('asgn');
    const assignment = {
      assignmentId,
      eventId,
      organizerId: event.organizerId,
      staffId,
      status: 'pending' as const,
      assignedAt: new Date(),
      updatedAt: new Date(),
    };

    this.dataStore.staffAssignments.push(assignment);
    return { success: true, message: 'Staff assigned to event', data: assignment };
  }

  // Delete staff
  delete(staffId: string, role: UserRole): { message: string } {
    if (role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can delete staff');
    }

    const index = this.dataStore.staffProfiles.findIndex((s) => s.staffId === staffId);

    if (index === -1) {
      throw new NotFoundException(`Staff with ID ${staffId} not found`);
    }

    const staff = this.dataStore.staffProfiles[index];
    this.dataStore.staffProfiles.splice(index, 1);

    // Also remove associated user
    const userIndex = this.dataStore.users.findIndex((u) => u.userId === staff.userId);
    if (userIndex !== -1) {
      this.dataStore.users.splice(userIndex, 1);
    }

    return { message: `Staff ${staffId} deleted successfully` };
  }

  // Get staff statistics
  getStatistics(): any {
    const staff = this.dataStore.staffProfiles;
    const availableCount = staff.filter((s) => s.status === 'available').length;
    const totalAssignments = this.dataStore.staffAssignments.filter(
      (a) => a.status === 'accepted',
    ).length;

    return {
      totalStaff: staff.length,
      availableStaff: availableCount,
      totalAssignments,
      avgRating: staff.length > 0 ? (staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(2) : '0.00',
    };
  }
}
