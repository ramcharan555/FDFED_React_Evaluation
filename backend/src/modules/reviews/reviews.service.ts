import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';

@Injectable()
export class ReviewsService {
  private db: DataStore;
  constructor() { this.db = DataStore.getInstance(); }

  createEventReview(dto: CreateEventReviewDto, role: UserRole): any {
    if (role !== UserRole.ATTENDEE && role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only ATTENDEE or CLIENT can review events');
    }
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

  createStaffReview(dto: CreateStaffReviewDto, role: UserRole): any {
    if (role !== UserRole.EVENT_ORGANIZER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only EVENT_ORGANIZER can review staff');
    }
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
