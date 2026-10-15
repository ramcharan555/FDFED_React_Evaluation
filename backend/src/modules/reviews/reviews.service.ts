import { Injectable, ForbiddenException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
import { CreateClientOrganizerReviewDto, CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';

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

  createClientOrganizerReview(dto: CreateClientOrganizerReviewDto, role: UserRole, userId?: string): any {
    if (role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only the event client can review the organizer');
    }
    const client = this.db.clients.find(item => item.userId === userId);
    if (!client) throw new ForbiddenException('Client profile not found');
    const event = this.db.events.find(item => item.eventId === dto.eventId);
    if (!event || event.clientId !== client.clientId) {
      throw new ForbiddenException('You can only review organizers for your own events');
    }
    const request = this.db.eventRequests.find(item =>
      item.eventId === event.eventId && item.clientId === client.clientId,
    );
    if (event.status !== 'completed') {
      throw new ForbiddenException('You can review an event only after it has been completed');
    }
    if (request) {
      const report = this.db.eventCompletionReports.find(item => item.eventId === event.eventId);
      const verifiedPayment = this.db.eventWorkflowPayments.find(payment =>
        payment.eventId === event.eventId &&
        payment.requestId === request.requestId &&
        payment.status === 'completed' &&
        payment.amount === request.budget,
      );
      if (request.status !== 'completed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment || !report) {
        throw new ForbiddenException('A workflow event review is available after full payment and the completion report');
      }
    }
    if (this.db.clientOrganizerReviews.some(review => review.eventId === event.eventId && review.clientId === client.clientId)) {
      throw new ConflictException('You have already reviewed this event');
    }
    const review = {
      reviewId: this.db.generateId('rev-organizer'),
      eventId: event.eventId,
      requestId: request?.requestId,
      clientId: client.clientId,
      organizerId: event.organizerId,
      rating: dto.rating,
      comment: dto.comment.trim(),
      createdAt: new Date(),
    };
    if (!review.comment) throw new BadRequestException('A written review is required');
    this.db.clientOrganizerReviews.push(review);
    return { success: true, message: 'Organizer review submitted', data: { reviewId: review.reviewId, eventId: review.eventId } };
  }

  findClientOrganizerReviews(role: UserRole, userId?: string, eventId?: string): any[] {
    if (role === UserRole.EVENT_ORGANIZER) {
      throw new ForbiddenException('Organizer reviews are private and cannot be accessed by organizers');
    }
    if (role === UserRole.SUPER_ADMIN) {
      return this.db.clientOrganizerReviews.filter(review => !eventId || review.eventId === eventId);
    }
    if (role !== UserRole.CLIENT) throw new ForbiddenException('Access denied');
    const client = this.db.clients.find(item => item.userId === userId);
    if (!client) return [];
    return this.db.clientOrganizerReviews.filter(review =>
      review.clientId === client.clientId && (!eventId || review.eventId === eventId),
    );
  }

  findPublicOrganizerReviews(organizerId: string, role: UserRole): any {
    if (role !== UserRole.CLIENT && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only clients can view published organizer reviews');
    }
    const organizer = this.db.organizers.find(item =>
      item.organizerId === organizerId || item.userId === organizerId,
    );
    if (!organizer || !this.db.findUserById(organizer.userId)) {
      throw new NotFoundException('Organizer not found');
    }

    const reviews = this.db.clientOrganizerReviews
      .filter(review => review.organizerId === organizer.organizerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const averageRating = reviews.length
      ? Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1))
      : organizer.rating || null;
    return {
      success: true,
      data: {
        organizerId: organizer.organizerId,
        averageRating,
        totalReviews: reviews.length,
        reviews: reviews.map(({ rating, comment, createdAt }) => ({ rating, comment, createdAt })),
      },
    };
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
