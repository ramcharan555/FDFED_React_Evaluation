import { Injectable, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';

@Injectable()
export class ReviewsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  createEventReview(dto: CreateEventReviewDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.ATTENDEE && role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE or CLIENT can review events');
    }
    const event = this.db.events.find(e => e.eventId === dto.eventId); if (!event) throw new NotFoundException('Event not found');
    const attendee = this.db.attendees.find(a => a.userId === userId), client = this.db.clients.find(c => c.userId === userId);
    if (role === UserRole.ATTENDEE && (dto.reviewerId !== attendee?.attendeeId || !this.db.registrations.some(r => r.attendeeId === attendee?.attendeeId && r.eventId === dto.eventId && ['registered', 'attended', 'no-show'].includes(r.status)))) throw new ForbiddenException('Only your own registered event can be reviewed');
    if (role === UserRole.CLIENT && (dto.reviewerId !== client?.clientId || event.clientId !== client?.clientId)) throw new ForbiddenException('Only your own event can be reviewed');
    if (this.db.eventReviews.some(r => r.reviewerId === dto.reviewerId && r.eventId === dto.eventId)) throw new ConflictException('You already reviewed this event');
    const id = this.db.generateId('rev-evt');
    const review = {
      reviewId: id,
      reviewerId: dto.reviewerId,
      eventId: dto.eventId,
      rating: dto.rating,
      comment: dto.comment,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    };
    this.db.eventReviews.push(review);
    return { success: true, message: 'Event review submitted', data: review };
  }

  findAllEventReviews(eventId?: string): any[] {
    if (eventId) return this.db.eventReviews.filter(r => r.eventId === eventId);
    return this.db.eventReviews;
  }

  createStaffReview(dto: CreateStaffReviewDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can review staff');
    }
    const organizer = this.db.organizers.find(o => o.userId === userId);
    if (role === UserRole.EVENT_ORGANIZER && (dto.reviewerId !== organizer?.organizerId || !this.db.staffAssignments.some(a => a.staffId === dto.staffId && a.eventId === dto.eventId && a.organizerId === organizer?.organizerId && ['accepted', 'completed'].includes(a.status)))) throw new ForbiddenException('You can only review staff assigned to your own event');
    if (this.db.staffReviews.some(r => r.reviewerId === dto.reviewerId && r.staffId === dto.staffId && r.eventId === dto.eventId)) throw new ConflictException('You already reviewed this assignment');
    const id = this.db.generateId('rev-staff');
    const review = {
      reviewId: id,
      reviewerId: dto.reviewerId,
      staffId: dto.staffId,
      eventId: dto.eventId,
      rating: dto.rating,
      comment: dto.comment,
      reviewDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    };
    this.db.staffReviews.push(review);

    // Update staff average rating
    const staff = this.db.staffProfiles.find(s => s.staffId === dto.staffId);
    if (staff) {
      const staffRevs = this.db.staffReviews.filter(r => r.staffId === dto.staffId);
      staff.rating = parseFloat((staffRevs.reduce((sum, r) => sum + r.rating, 0) / staffRevs.length).toFixed(1));
    }

    return { success: true, message: 'Staff review submitted', data: review };
  }

  findAllStaffReviews(staffId?: string): any[] {
    if (staffId) return this.db.staffReviews.filter(r => r.staffId === staffId);
    return this.db.staffReviews;
  }
}
