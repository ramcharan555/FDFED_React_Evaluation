"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let StaffService = class StaffService {
    constructor() {
        this.dataStore = data_store_1.DataStore.getInstance();
    }
    // Create Staff profile (registration)
    create(createStaffDto, role) {
        // Only SUPER_ADMIN or EVENT_STAFF can create staff profiles
        if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.EVENT_STAFF) {
            throw new common_1.ForbiddenException('Only super admin and staff can create staff profiles');
        }
        // Check if user already exists
        const existingUser = this.dataStore.users.find((u) => u.email.toLowerCase() === createStaffDto.email.toLowerCase());
        if (existingUser) {
            throw new common_1.BadRequestException('Email already registered');
        }
        // Create user and staff profile
        const userId = this.dataStore.generateId('usr-staff');
        const staffId = this.dataStore.generateId('staff');
        const user = {
            userId,
            name: createStaffDto.name,
            email: createStaffDto.email,
            password: createStaffDto.password || '',
            userRole: constants_1.UserRole.EVENT_STAFF,
            status: 'active',
            phoneNo: createStaffDto.phone,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const staff = {
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
    findAll(role, search) {
        if (![constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.EVENT_ORGANIZER].includes(role)) {
            throw new common_1.ForbiddenException('Only super admin and organizers can view staff');
        }
        let staff = this.dataStore.staffProfiles.map((s) => {
            const user = this.dataStore.users.find((u) => u.userId === s.userId);
            return { ...s, ...user };
        });
        if (search) {
            staff = staff.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()) ||
                s.email?.toLowerCase().includes(search.toLowerCase()));
        }
        return staff;
    }
    // Get staff by ID
    findOne(staffId, role) {
        if (![constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.EVENT_ORGANIZER].includes(role)) {
            throw new common_1.ForbiddenException('Only super admin and organizers can view staff');
        }
        const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);
        if (!staff) {
            throw new common_1.NotFoundException(`Staff with ID ${staffId} not found`);
        }
        const user = this.dataStore.users.find((u) => u.userId === staff.userId);
        return { ...staff, ...user };
    }
    // Update staff profile
    update(staffId, updateStaffDto, role, userId) {
        const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);
        if (!staff) {
            throw new common_1.NotFoundException(`Staff with ID ${staffId} not found`);
        }
        // Validate permissions
        if (role === constants_1.UserRole.EVENT_STAFF && staff.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        else if (role !== constants_1.UserRole.SUPER_ADMIN && role !== constants_1.UserRole.EVENT_STAFF) {
            throw new common_1.ForbiddenException('Only super admin and staff can update profiles');
        }
        const user = this.dataStore.users.find((u) => u.userId === staff.userId);
        if (!user) {
            throw new common_1.NotFoundException('Associated user not found');
        }
        // Update staff profile
        if (updateStaffDto.availableDates)
            staff.availableDates = updateStaffDto.availableDates;
        if (updateStaffDto.status)
            staff.status = updateStaffDto.status;
        // Update user info
        if (updateStaffDto.name)
            user.name = updateStaffDto.name;
        if (updateStaffDto.email)
            user.email = updateStaffDto.email;
        if (updateStaffDto.phone)
            user.phoneNo = updateStaffDto.phone;
        user.updatedAt = new Date();
        return { ...staff, ...user };
    }
    // Assign event to staff member
    assignEvent(staffId, eventId, role) {
        if (![constants_1.UserRole.SUPER_ADMIN, constants_1.UserRole.EVENT_ORGANIZER].includes(role)) {
            throw new common_1.ForbiddenException('Only super admin and organizers can assign events');
        }
        const staff = this.dataStore.staffProfiles.find((s) => s.staffId === staffId);
        if (!staff) {
            throw new common_1.NotFoundException(`Staff with ID ${staffId} not found`);
        }
        const event = this.dataStore.events.find((e) => e.eventId === eventId);
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        const assignmentId = this.dataStore.generateId('asgn');
        const assignment = {
            assignmentId,
            eventId,
            organizerId: event.organizerId,
            staffId,
            status: 'pending',
            assignedAt: new Date(),
            updatedAt: new Date(),
        };
        this.dataStore.staffAssignments.push(assignment);
        return { success: true, message: 'Staff assigned to event', data: assignment };
    }
    // Delete staff
    delete(staffId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only super admin can delete staff');
        }
        const index = this.dataStore.staffProfiles.findIndex((s) => s.staffId === staffId);
        if (index === -1) {
            throw new common_1.NotFoundException(`Staff with ID ${staffId} not found`);
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
    getStatistics() {
        const staff = this.dataStore.staffProfiles;
        const availableCount = staff.filter((s) => s.status === 'available').length;
        const totalAssignments = this.dataStore.staffAssignments.filter((a) => a.status === 'accepted').length;
        return {
            totalStaff: staff.length,
            availableStaff: availableCount,
            totalAssignments,
            avgRating: staff.length > 0 ? (staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(2) : '0.00',
        };
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StaffService);
//# sourceMappingURL=staff.service.js.map