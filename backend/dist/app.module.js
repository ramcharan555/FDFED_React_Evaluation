"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const request_logging_middleware_1 = require("./common/middleware/request-logging.middleware");
const events_audit_middleware_1 = require("./common/middleware/events-audit.middleware");
const data_store_persistence_interceptor_1 = require("./common/interceptors/data-store-persistence.interceptor");
const activity_logging_interceptor_1 = require("./common/interceptors/activity-logging.interceptor");
// Existing modules
const events_module_1 = require("./modules/events/events.module");
const attendees_module_1 = require("./modules/attendees/attendees.module");
const staff_module_1 = require("./modules/staff/staff.module");
const activity_log_module_1 = require("./modules/activity-log/activity-log.module");
// New modules — Review-4 complete backend
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const event_requests_module_1 = require("./modules/event-requests/event-requests.module");
const event_plans_module_1 = require("./modules/event-plans/event-plans.module");
const registrations_module_1 = require("./modules/registrations/registrations.module");
const payments_module_1 = require("./modules/payments/payments.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const staff_assignments_module_1 = require("./modules/staff-assignments/staff-assignments.module");
const reports_module_1 = require("./modules/reports/reports.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const support_module_1 = require("./modules/support/support.module");
const finance_module_1 = require("./modules/finance/finance.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_logging_middleware_1.RequestLoggingMiddleware).forRoutes('*');
        consumer.apply(events_audit_middleware_1.EventsAuditMiddleware).forRoutes({
            path: 'api/events',
            method: common_1.RequestMethod.ALL,
        });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Rate limiting (applied per-endpoint via @Throttle decorator)
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
            // Existing
            events_module_1.EventsModule,
            attendees_module_1.AttendeesModule,
            staff_module_1.StaffModule,
            activity_log_module_1.ActivityLogModule,
            // New
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            event_requests_module_1.EventRequestsModule,
            event_plans_module_1.EventPlansModule,
            registrations_module_1.RegistrationsModule,
            payments_module_1.PaymentsModule,
            attendance_module_1.AttendanceModule,
            staff_assignments_module_1.StaffAssignmentsModule,
            reports_module_1.ReportsModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            uploads_module_1.UploadsModule,
            support_module_1.SupportModule,
            finance_module_1.FinanceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: data_store_persistence_interceptor_1.DataStorePersistenceInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: activity_logging_interceptor_1.ActivityLoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map