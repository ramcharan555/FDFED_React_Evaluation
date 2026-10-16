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
    createClientOrganizerReview(dto, role, userId) {
        if (role !== constants_1.UserRole.CLIENT) {
            throw new common_1.ForbiddenException('Only the event client can review the organizer');
        }
        const client = this.db.clients.find(item => item.userId === userId);
        if (!client)
            throw new common_1.ForbiddenException('Client profile not found');
        const event = this.db.events.find(item => item.eventId === dto.eventId);
        if (!event || event.clientId !== client.clientId) {
            throw new common_1.ForbiddenException('You can only review organizers for your own events');
        }
        const request = this.db.eventRequests.find(item => item.eventId === event.eventId && item.clientId === client.clientId);
        if (event.status !== 'completed') {
            throw new common_1.ForbiddenException('You can review an event only after it has been completed');
        }
        if (request) {
            const report = this.db.eventCompletionReports.find(item => item.eventId === event.eventId);
            const verifiedPayment = this.db.eventWorkflowPayments.find(payment => payment.eventId === event.eventId &&
                payment.requestId === request.requestId &&
                payment.status === 'completed' &&
                payment.amount === request.budget);
            if (request.status !== 'completed' || request.paymentStatus !== 'fully_paid' || !verifiedPayment || !report) {
                throw new common_1.ForbiddenException('A workflow event review is available after full payment and the completion report');
            }
        }
        if (this.db.clientOrganizerReviews.some(review => review.eventId === event.eventId && review.clientId === client.clientId)) {
            throw new common_1.ConflictException('You have already reviewed this event');
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
        if (!review.comment)
            throw new common_1.BadRequestException('A written review is required');
        this.db.clientOrganizerReviews.push(review);
        return { success: true, message: 'Organizer review submitted', data: { reviewId: review.reviewId, eventId: review.eventId } };
    }
    findClientOrganizerReviews(role, userId, eventId) {
        if (role === constants_1.UserRole.EVENT_ORGANIZER) {
            throw new common_1.ForbiddenException('Organizer reviews are private and cannot be accessed by organizers');
        }
        if (role === constants_1.UserRole.SUPER_ADMIN) {
            return this.db.clientOrganizerReviews.filter(review => !eventId || review.eventId === eventId);
        }
        if (role !== constants_1.UserRole.CLIENT)
            throw new common_1.ForbiddenException('Access denied');
        const client = this.db.clients.find(item => item.userId === userId);
        if (!client)
            return [];
        return this.db.clientOrganizerReviews.filter(review => review.clientId === client.clientId && (!eventId || review.eventId === eventId));
    }
    findPublicOrganizerReviews(organizerId, role) {
        if (role !== constants_1.UserRole.CLIENT && role !== constants_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Only clients can view published organizer reviews');
        }
        const organizer = this.db.organizers.find(item => item.organizerId === organizerId || item.userId === organizerId);
        if (!organizer || !this.db.findUserById(organizer.userId)) {
            throw new common_1.NotFoundException('Organizer not found');
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
                reviews: reviews.map(({ eventId, clientId, rating, comment, createdAt }) => {
                    const client = this.db.clients.find(item => item.clientId === clientId);
                    return {
                        eventId,
                        eventName: this.db.events.find(event => event.eventId === eventId)?.name || 'Past event',
                        reviewerName: client ? this.db.findUserById(client.userId)?.name || 'Client' : 'Client',
                        rating,
                        comment,
                        createdAt,
                    };
                }),
            },
        };
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