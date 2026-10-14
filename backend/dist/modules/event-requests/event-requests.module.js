"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const event_requests_controller_1 = require("./event-requests.controller");
const event_requests_service_1 = require("./event-requests.service");
let EventRequestsModule = class EventRequestsModule {
};
exports.EventRequestsModule = EventRequestsModule;
exports.EventRequestsModule = EventRequestsModule = __decorate([
    (0, common_1.Module)({
        controllers: [event_requests_controller_1.EventRequestsController],
        providers: [event_requests_service_1.EventRequestsService],
    })
], EventRequestsModule);
//# sourceMappingURL=event-requests.module.js.map