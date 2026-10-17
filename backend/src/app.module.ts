import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { EventsAuditMiddleware } from './common/middleware/events-audit.middleware';
import { DataStorePersistenceInterceptor } from './common/interceptors/data-store-persistence.interceptor';
import { ActivityLoggingInterceptor } from './common/interceptors/activity-logging.interceptor';

// Existing modules
import { EventsModule } from './modules/events/events.module';
import { AttendeesModule } from './modules/attendees/attendees.module';
import { StaffModule } from './modules/staff/staff.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';

// New modules — Review-4 complete backend
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventRequestsModule } from './modules/event-requests/event-requests.module';
import { EventPlansModule } from './modules/event-plans/event-plans.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StaffAssignmentsModule } from './modules/staff-assignments/staff-assignments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SupportModule } from './modules/support/support.module';
import { FinanceModule } from './modules/finance/finance.module';

@Module({
  imports: [
    // Rate limiting (applied per-endpoint via @Throttle decorator)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    // Existing
    EventsModule,
    AttendeesModule,
    StaffModule,
    ActivityLogModule,
    // New
    AuthModule,
    UsersModule,
    EventRequestsModule,
    EventPlansModule,
    RegistrationsModule,
    PaymentsModule,
    AttendanceModule,
    StaffAssignmentsModule,
    ReportsModule,
    ReviewsModule,
    NotificationsModule,
    AnalyticsModule,
    UploadsModule,
    SupportModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DataStorePersistenceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
    consumer.apply(EventsAuditMiddleware).forRoutes({
      path: 'api/events',
      method: RequestMethod.ALL,
    });
  }
}
