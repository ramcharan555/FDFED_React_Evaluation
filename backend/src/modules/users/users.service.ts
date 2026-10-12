import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  findAll(role: UserRole): any[] {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can view all users');
    return this.db.users.map(({ password, ...u }) => u);
  }

  findOne(userId: string, role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can view user details');
    const user = this.db.findUserById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const { password, ...safe } = user;
    return safe;
  }

  create(dto: CreateUserDto, role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can create users');
    const existing = this.db.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const userId = this.db.generateId('usr');
    const user = {
      userId, name: dto.name, email: dto.email, password: dto.password,
      userRole: dto.userRole, status: 'active' as const,
      address: dto.address, phoneNo: dto.phoneNo,
      createdAt: new Date(), updatedAt: new Date(),
    };
    this.db.users.push(user);

    // Create role-specific profile
    if (dto.userRole === UserRole.CLIENT) {
      this.db.clients.push({ clientId: this.db.generateId('cli'), userId, createdAt: new Date() });
    } else if (dto.userRole === UserRole.EVENT_ORGANIZER) {
      this.db.organizers.push({ organizerId: this.db.generateId('org'), userId, rating: 0, createdAt: new Date() });
    } else if (dto.userRole === UserRole.EVENT_STAFF) {
      this.db.staffProfiles.push({ staffId: this.db.generateId('staff'), userId, availableDates: [], rating: 0, status: 'available', createdAt: new Date() });
    } else if (dto.userRole === UserRole.ATTENDEE) {
      this.db.attendees.push({ attendeeId: this.db.generateId('att'), userId, createdAt: new Date() });
    } else if (dto.userRole === UserRole.SUPER_ADMIN) {
      this.db.superAdmins.push({ superAdminId: this.db.generateId('sa'), userId, email: dto.email, createdAt: new Date() });
    }

    const { password, ...safe } = user;
    return { success: true, message: 'User created', data: safe };
  }

  update(userId: string, dto: UpdateUserDto, role: UserRole, requesterId: string): any {
    if (role !== UserRole.SUPER_ADMIN && userId !== requesterId) {
      throw new ForbiddenException('You can only update your own profile');
    }
    const user = this.db.findUserById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.address) user.address = dto.address;
    if (dto.phoneNo) user.phoneNo = dto.phoneNo;
    if (dto.status && role === UserRole.SUPER_ADMIN) user.status = dto.status;
    user.updatedAt = new Date();

    const { password, ...safe } = user;
    return { success: true, message: 'User updated', data: safe };
  }

  remove(userId: string, role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can delete users');
    const idx = this.db.users.findIndex(u => u.userId === userId);
    if (idx === -1) throw new NotFoundException(`User ${userId} not found`);
    this.db.users.splice(idx, 1);

    this.db.clients = this.db.clients.filter(c => c.userId !== userId);
    this.db.organizers = this.db.organizers.filter(o => o.userId !== userId);
    this.db.staffProfiles = this.db.staffProfiles.filter(s => s.userId !== userId);
    this.db.attendees = this.db.attendees.filter(a => a.userId !== userId);
    this.db.superAdmins = this.db.superAdmins.filter(s => s.userId !== userId);

    return { success: true, message: `User ${userId} deleted` };
  }

  updateStatus(userId: string, status: 'active' | 'inactive' | 'suspended', role: UserRole): any {
    if (role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Only SUPER_ADMIN can update user status');
    const user = this.db.findUserById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    user.status = status;
    user.updatedAt = new Date();
    const { password, ...safe } = user;
    return { success: true, message: `Status updated to ${status}`, data: safe };
  }
}
