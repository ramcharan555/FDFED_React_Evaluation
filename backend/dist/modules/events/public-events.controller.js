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
exports.PublicEventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const events_service_1 = require("./events.service");
let PublicEventsController = class PublicEventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    findAll(search) {
        return this.eventsService.findAllPublic(search);
    }
};
exports.PublicEventsController = PublicEventsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get published events for the public attendee catalog' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by event name or location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of published events' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicEventsController.prototype, "findAll", null);
exports.PublicEventsController = PublicEventsController = __decorate([
    (0, swagger_1.ApiTags)('events'),
    (0, common_1.Controller)('api/public/events'),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], PublicEventsController);
//# sourceMappingURL=public-events.controller.js.map