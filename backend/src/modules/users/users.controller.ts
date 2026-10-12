import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('users')
@Controller('api/users')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership checks', required: false })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of all users (no passwords)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@UserRoleDecorator() role: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User details (no password)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole) {
    return this.usersService.findOne(id, role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user (SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  create(@Body() dto: CreateUserDto, @UserRoleDecorator() role: UserRole) {
    return this.usersService.create(dto, role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (SUPER_ADMIN or self)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @UserRoleDecorator() role: UserRole,
    @UserId() userId: string,
  ) {
    return this.usersService.update(id, dto, role, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string, @UserRoleDecorator() role: UserRole) {
    return this.usersService.remove(id, role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user account status (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'inactive' | 'suspended' },
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.usersService.updateStatus(id, body.status, role);
  }
}
