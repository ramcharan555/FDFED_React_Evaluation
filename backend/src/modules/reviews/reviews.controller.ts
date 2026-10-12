import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';
import { RoleGuard } from '../../common/guards/role.guard';
import { UserRoleDecorator } from '../../common/decorators/user-role.decorator';
import { UserRole } from '../../common/constants';

@ApiTags('reviews')
@Controller('api/reviews')
@UseGuards(RoleGuard)
@ApiHeader({ name: 'x-role', description: 'User role', required: true })
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit event review (ATTENDEE or CLIENT, rating 1-5)' })
  @ApiResponse({ status: 201, description: 'Event review submitted' })
  @ApiResponse({ status: 403, description: 'Only ATTENDEE or CLIENT can review events' })
  createEventReview(@Body() dto: CreateEventReviewDto, @UserRoleDecorator() role: UserRole) {
    return this.service.createEventReview(dto, role);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get event reviews' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  findAllEventReviews(@Query('eventId') eventId?: string) {
    return this.service.findAllEventReviews(eventId);
  }

  @Post('staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit staff review (EVENT_ORGANIZER only, rating 1-5). Auto-updates staff rating.' })
  @ApiResponse({ status: 201, description: 'Staff review submitted. Staff average rating recalculated.' })
  @ApiResponse({ status: 403, description: 'Only EVENT_ORGANIZER can review staff' })
  createStaffReview(@Body() dto: CreateStaffReviewDto, @UserRoleDecorator() role: UserRole) {
    return this.service.createStaffReview(dto, role);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get staff reviews' })
  @ApiQuery({ name: 'staffId', required: false, description: 'Filter by staff ID' })
  findAllStaffReviews(@Query('staffId') staffId?: string) {
    return this.service.findAllStaffReviews(staffId);
  }
}
