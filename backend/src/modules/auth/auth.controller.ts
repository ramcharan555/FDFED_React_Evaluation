import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, RegisterDto } from './dto/register.dto';
import { SubmitOrganizerApplicationDto, ReviewOrganizerApplicationDto } from './dto/organizer-application.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserId } from '../../common/decorators/user-id.decorator';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('organizer-application')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit organizer application for verification' })
  submitOrganizerApplication(@Body() dto: SubmitOrganizerApplicationDto) {
    return this.authService.submitOrganizerApplication(dto);
  }

  @Get('organizer-application/:ref')
  @ApiOperation({ summary: 'Track organizer application status by reference number or email' })
  getOrganizerApplicationStatus(@Param('ref') ref: string) {
    return this.authService.getOrganizerApplicationStatus(ref);
  }

  @Get('organizer-applications')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'List all organizer applications for review' })
  getAllOrganizerApplications(@Query('status') status?: string) {
    return this.authService.getAllOrganizerApplications(status);
  }

  @Post('organizer-application/:ref/review')
  @UseGuards(RoleGuard)
  @ApiOperation({ summary: 'Review organizer application (approve, reject, request info, etc.)' })
  reviewOrganizerApplication(
    @Param('ref') ref: string,
    @Body() dto: ReviewOrganizerApplicationDto,
    @UserId() userId: string,
    @UserRoleDecorator() role: UserRole,
  ) {
    return this.authService.reviewOrganizerApplication(ref, dto, userId, role);
  }

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleGuard)
  changePassword(@Body() dto: ChangePasswordDto, @UserId() userId: string) {
    return this.authService.changePassword(dto, userId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Public endpoint. Returns user info and JWT token. Use token in Authorization header (Bearer token) for subsequent requests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token and user data.',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          userId: 'usr-admin-001',
          name: 'Admin User',
          email: 'superadmin@example.com',
          userRole: 'super_admin',
          status: 'active',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 400, description: 'Account suspended/inactive or invalid input' })
  @ApiResponse({ status: 429, description: 'Too many login attempts. Try again later.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

