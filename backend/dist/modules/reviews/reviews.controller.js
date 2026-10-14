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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reviews_service_1 = require("./reviews.service");
const report_dto_1 = require("../reports/dto/report.dto");
const role_guard_1 = require("../../common/guards/role.guard");
const user_role_decorator_1 = require("../../common/decorators/user-role.decorator");
const constants_1 = require("../../common/constants");
let ReviewsController = class ReviewsController {
    constructor(service) {
        this.service = service;
    }
    createEventReview(dto, role) {
        return this.service.createEventReview(dto, role);
    }
    findAllEventReviews(eventId) {
        return this.service.findAllEventReviews(eventId);
    }
    createStaffReview(dto, role) {
        return this.service.createStaffReview(dto, role);
    }
    findAllStaffReviews(staffId) {
        return this.service.findAllStaffReviews(staffId);
    }
};
exports.ReviewsController = ReviewsController;
__decorate([
    (0, common_1.Post)('events'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit event review (ATTENDEE or CLIENT, rating 1-5)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event review submitted' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only ATTENDEE or CLIENT can review events' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateEventReviewDto, String]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createEventReview", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'eventId', required: false, description: 'Filter by event ID' }),
    __param(0, (0, common_1.Query)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findAllEventReviews", null);
__decorate([
    (0, common_1.Post)('staff'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit staff review (EVENT_ORGANIZER only, rating 1-5). Auto-updates staff rating.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff review submitted. Staff average rating recalculated.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Only EVENT_ORGANIZER can review staff' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_role_decorator_1.UserRoleDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_dto_1.CreateStaffReviewDto, String]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "createStaffReview", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff reviews' }),
    (0, swagger_1.ApiQuery)({ name: 'staffId', required: false, description: 'Filter by staff ID' }),
    __param(0, (0, common_1.Query)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReviewsController.prototype, "findAllStaffReviews", null);
exports.ReviewsController = ReviewsController = __decorate([
    (0, swagger_1.ApiTags)('reviews'),
    (0, common_1.Controller)('api/reviews'),
    (0, common_1.UseGuards)(role_guard_1.RoleGuard),
    (0, swagger_1.ApiHeader)({ name: 'x-role', description: 'User role', required: true }),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], ReviewsController);
//# sourceMappingURL=reviews.controller.js.map