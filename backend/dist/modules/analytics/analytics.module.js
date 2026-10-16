"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_controller_1 = require("./analytics.controller");
const analytics_service_1 = require("./analytics.service");
const workspace_controller_1 = require("./workspace.controller");
const workspace_service_1 = require("./workspace.service");
const events_module_1 = require("../events/events.module");
const registrations_service_1 = require("../registrations/registrations.service");
const users_service_1 = require("../users/users.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [events_module_1.EventsModule],
        controllers: [analytics_controller_1.AnalyticsController, workspace_controller_1.WorkspaceController],
        providers: [analytics_service_1.AnalyticsService, workspace_service_1.WorkspaceService, registrations_service_1.RegistrationsService, users_service_1.UsersService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map