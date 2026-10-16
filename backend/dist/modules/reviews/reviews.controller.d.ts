import { ReviewsService } from './reviews.service';
import { CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';
import { UserRole } from '../../common/constants';
export declare class ReviewsController {
    private readonly service;
    constructor(service: ReviewsService);
    createEventReview(dto: CreateEventReviewDto, role: UserRole): any;
    findAllEventReviews(eventId?: string): any[];
    createStaffReview(dto: CreateStaffReviewDto, role: UserRole): any;
    findAllStaffReviews(staffId?: string): any[];
}
//# sourceMappingURL=reviews.controller.d.ts.map