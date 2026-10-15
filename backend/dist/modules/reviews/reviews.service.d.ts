import { UserRole } from '../../common/constants';
import { CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';
export declare class ReviewsService {
    private db;
    constructor();
    createEventReview(dto: CreateEventReviewDto, role: UserRole, userId?: string): any;
    findAllEventReviews(eventId?: string): any[];
    createStaffReview(dto: CreateStaffReviewDto, role: UserRole, userId?: string): any;
    findAllStaffReviews(staffId?: string): any[];
}
//# sourceMappingURL=reviews.service.d.ts.map