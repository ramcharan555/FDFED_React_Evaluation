import { UserRole } from '../../common/constants';
import { CreateClientOrganizerReviewDto, CreateEventReviewDto, CreateStaffReviewDto } from '../reports/dto/report.dto';
export declare class ReviewsService {
    private db;
    constructor();
    createEventReview(dto: CreateEventReviewDto, role: UserRole): any;
    findAllEventReviews(eventId?: string): any[];
    createClientOrganizerReview(dto: CreateClientOrganizerReviewDto, role: UserRole, userId?: string): any;
    findClientOrganizerReviews(role: UserRole, userId?: string, eventId?: string): any[];
    findPublicOrganizerReviews(organizerId: string, role: UserRole): any;
    createStaffReview(dto: CreateStaffReviewDto, role: UserRole): any;
    findAllStaffReviews(staffId?: string): any[];
}
//# sourceMappingURL=reviews.service.d.ts.map