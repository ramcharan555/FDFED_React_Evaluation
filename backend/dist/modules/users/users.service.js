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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let UsersService = class UsersService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    findAll(role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can view all users');
        return this.db.users.map(({ password, ...u }) => u);
    }
    findOne(userId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can view user details');
        const user = this.db.findUserById(userId);
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        const { password, ...safe } = user;
        return safe;
    }
    create(dto, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can create users');
        const existing = this.db.findUserByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const userId = this.db.generateId('usr');
        const user = {
            userId, name: dto.name, email: dto.email, password: dto.password,
            userRole: dto.userRole, status: 'active',
            address: dto.address, phoneNo: dto.phoneNo,
            createdAt: new Date(), updatedAt: new Date(),
        };
        this.db.users.push(user);
        // Create role-specific profile
        if (dto.userRole === constants_1.UserRole.CLIENT) {
            this.db.clients.push({ clientId: this.db.generateId('cli'), userId, createdAt: new Date() });
        }
        else if (dto.userRole === constants_1.UserRole.EVENT_ORGANIZER) {
            this.db.organizers.push({ organizerId: this.db.generateId('org'), userId, rating: 0, createdAt: new Date() });
        }
        else if (dto.userRole === constants_1.UserRole.EVENT_STAFF) {
            this.db.staffProfiles.push({ staffId: this.db.generateId('staff'), userId, availableDates: [], rating: 0, status: 'available', createdAt: new Date() });
        }
        else if (dto.userRole === constants_1.UserRole.ATTENDEE) {
            this.db.attendees.push({ attendeeId: this.db.generateId('att'), userId, createdAt: new Date() });
        }
        else if (dto.userRole === constants_1.UserRole.SUPER_ADMIN) {
            this.db.superAdmins.push({ superAdminId: this.db.generateId('sa'), userId, email: dto.email, createdAt: new Date() });
        }
        const { password, ...safe } = user;
        return { success: true, message: 'User created', data: safe };
    }
    update(userId, dto, role, requesterId) {
        if (role !== constants_1.UserRole.SUPER_ADMIN && userId !== requesterId) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        const user = this.db.findUserById(userId);
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        if (dto.name)
            user.name = dto.name;
        if (dto.email)
            user.email = dto.email;
        if (dto.address)
            user.address = dto.address;
        if (dto.phoneNo)
            user.phoneNo = dto.phoneNo;
        if (dto.status && role === constants_1.UserRole.SUPER_ADMIN)
            user.status = dto.status;
        user.updatedAt = new Date();
        const { password, ...safe } = user;
        return { success: true, message: 'User updated', data: safe };
    }
    remove(userId, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can delete users');
        const idx = this.db.users.findIndex(u => u.userId === userId);
        if (idx === -1)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        this.db.users.splice(idx, 1);
        this.db.clients = this.db.clients.filter(c => c.userId !== userId);
        this.db.organizers = this.db.organizers.filter(o => o.userId !== userId);
        this.db.staffProfiles = this.db.staffProfiles.filter(s => s.userId !== userId);
        this.db.attendees = this.db.attendees.filter(a => a.userId !== userId);
        this.db.superAdmins = this.db.superAdmins.filter(s => s.userId !== userId);
        return { success: true, message: `User ${userId} deleted` };
    }
    updateStatus(userId, status, role) {
        if (role !== constants_1.UserRole.SUPER_ADMIN)
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can update user status');
        const user = this.db.findUserById(userId);
        if (!user)
            throw new common_1.NotFoundException(`User ${userId} not found`);
        user.status = status;
        user.updatedAt = new Date();
        const { password, ...safe } = user;
        return { success: true, message: `Status updated to ${status}`, data: safe };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UsersService);
//# sourceMappingURL=users.service.js.map