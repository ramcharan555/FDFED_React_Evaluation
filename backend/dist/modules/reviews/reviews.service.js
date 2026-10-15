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
    createEventReview(dto, role, userId) {
        if (role !== constants_1.UserRole.ATTENDEE && role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only ATTENDEE or CLIENT can review events');
        }
        const event = this.db.events.find(e => e.eventId === dto.eventId);
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const attendee = this.db.attendees.find(a => a.userId === userId), client = this.db.clients.find(c => c.userId === userId);
        if (role === constants_1.UserRole.ATTENDEE && (dto.reviewerId !== attendee?.attendeeId || !this.db.registrations.some(r => r.attendeeId === attendee?.attendeeId && r.eventId === dto.eventId && ['registered', 'attended', 'no-show'].includes(r.status))))
            throw new common_1.ForbiddenException('Only your own registered event can be reviewed');
        if (role === constants_1.UserRole.CLIENT && (dto.reviewerId !== client?.clientId || event.clientId !== client?.clientId))
            throw new common_1.ForbiddenException('Only your own event can be reviewed');
        if (this.db.eventReviews.some(r => r.reviewerId === dto.reviewerId && r.eventId === dto.eventId))
            throw new common_1.ConflictException('You already reviewed this event');
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
    createStaffReview(dto, role, userId) {
        if (role !== constants_1.UserRole.EVENT_ORGANIZER && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only EVENT_ORGANIZER can review staff');
        }
        const organizer = this.db.organizers.find(o => o.userId === userId);
        if (role === constants_1.UserRole.EVENT_ORGANIZER && (dto.reviewerId !== organizer?.organizerId || !this.db.staffAssignments.some(a => a.staffId === dto.staffId && a.eventId === dto.eventId && a.organizerId === organizer?.organizerId && ['accepted', 'completed'].includes(a.status))))
            throw new common_1.ForbiddenException('You can only review staff assigned to your own event');
        if (this.db.staffReviews.some(r => r.reviewerId === dto.reviewerId && r.staffId === dto.staffId && r.eventId === dto.eventId))
            throw new common_1.ConflictException('You already reviewed this assignment');
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