"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const data_store_1 = require("../../common/data-store");
const constants_1 = require("../../common/constants");
let ReviewsService = class ReviewsService {
    constructor() { this.db = data_store_1.DataStore.getInstance(); }
    createEventReview(dto, role) {
        if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only ATTENDEE or CLIENT can review events');
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
    findAllEventReviews(eventId) {
        if (eventId)
            return this.db.eventReviews.filter(r => r.eventId === eventId);
        return this.db.eventReviews;
    }
    createStaffReview(dto, role) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_ORGANIZER can review staff');
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
    findAllStaffReviews(staffId) {
        if (staffId)
            return this.db.staffReviews.filter(r => r.staffId === staffId);
        return this.db.staffReviews;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map