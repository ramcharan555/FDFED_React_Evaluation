import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { CancelRegistrationDto, CreateRegistrationDto, UpdateRegistrationDetailsDto } from './dto/registration.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('registrations')
@Controller('api/registrations')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
@ApiHeader({ name: 'x-user-id', description: 'User ID for ownership', required: false })
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register for an event (ATTENDEE only). Blocks duplicate registration.' })
  @ApiResponse({ status: 201, description: 'Registered successfully. Returns qrCode and verificationId.' })
  @ApiResponse({ status: 403, description: 'Only ATTENDEE can register' })
  @ApiResponse({ status: 409, description: 'Already registered for this event' })
  create(@Body() dto: CreateRegistrationDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.create(dto, role, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List registrations (ATTENDEE sees own, SUPER_ADMIN/ORGANIZER sees all)' })
  findAll(@UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findAll(role, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration by ID' })
  @ApiResponse({ status: 200, description: 'Registration details with qrCode and verificationId' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  findOne(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.findOne(id, role, userId);
  }

  @Patch(':id/details')
  updateDetails(@Param('id') id: string, @Body() dto: UpdateRegistrationDetailsDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.updateDetails(id, dto, role, userId);
  }

  @Post(':id/waitlist/confirm')
  confirmWaitlist(@Param('id') id: string, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.confirmWaitlist(id, role, userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelRegistrationDto, @UserRoleDecorator() role: UserRole, @UserId() userId: string) {
    return this.service.cancel(id, dto.reason, role, userId);
  }
}
