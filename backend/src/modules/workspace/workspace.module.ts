import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
@Module({ imports: [EventsModule], controllers: [WorkspaceController], providers: [WorkspaceService] })
export class WorkspaceModule {}
