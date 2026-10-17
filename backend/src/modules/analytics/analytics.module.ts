import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { EventsModule } from '../events/events.module';
import { RegistrationsService } from '../registrations/registrations.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [EventsModule],
  controllers: [AnalyticsController, WorkspaceController],
  providers: [AnalyticsService, WorkspaceService, RegistrationsService, UsersService],
})
export class AnalyticsModule {}
